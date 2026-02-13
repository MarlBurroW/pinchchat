import { useState, useEffect } from 'react';

const GITHUB_API = 'https://api.github.com/repos/MarlBurroW/pinchchat/releases/latest';
const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
const CACHE_KEY = 'pinchchat-latest-version';

interface UpdateInfo {
  available: boolean;
  latestVersion: string | null;
  releaseUrl: string | null;
}

export function useUpdateCheck(currentVersion: string): UpdateInfo {
  const [info, setInfo] = useState<UpdateInfo>({ available: false, latestVersion: null, releaseUrl: null });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    async function check() {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { version, url, ts } = JSON.parse(cached);
          if (Date.now() - ts < CHECK_INTERVAL) {
            if (version && isNewer(version, currentVersion)) {
              setInfo({ available: true, latestVersion: version, releaseUrl: url });
            }
            timeout = setTimeout(check, CHECK_INTERVAL - (Date.now() - ts));
            return;
          }
        }

        const res = await fetch(GITHUB_API, { headers: { Accept: 'application/vnd.github.v3+json' } });
        if (!res.ok) return;
        const data = await res.json();
        const tag: string = data.tag_name?.replace(/^v/, '') || '';
        const url: string = data.html_url || '';

        localStorage.setItem(CACHE_KEY, JSON.stringify({ version: tag, url, ts: Date.now() }));

        if (tag && isNewer(tag, currentVersion)) {
          setInfo({ available: true, latestVersion: tag, releaseUrl: url });
        }
      } catch { /* silent */ }
      timeout = setTimeout(check, CHECK_INTERVAL);
    }

    check();
    return () => clearTimeout(timeout);
  }, [currentVersion]);

  return info;
}

/** True if remote is newer than local (semver compare) */
function isNewer(remote: string, local: string): boolean {
  const r = remote.split('.').map(Number);
  const l = local.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (l[i] || 0)) return true;
    if ((r[i] || 0) < (l[i] || 0)) return false;
  }
  return false;
}
