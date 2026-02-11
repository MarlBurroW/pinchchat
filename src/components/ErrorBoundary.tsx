import { Component, type ReactNode, type ErrorInfo } from 'react';
import { t } from '../lib/i18n';

interface Props {
  children: ReactNode;
  /** Optional fallback — defaults to built-in error card */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render errors in child components and shows a recovery UI
 * instead of a blank white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PinchChat] Render error caught by ErrorBoundary:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="h-dvh flex items-center justify-center bg-[#1e1e24] text-zinc-300 p-6">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="text-4xl">💥</div>
            <h1 className="text-xl font-semibold text-zinc-100">
              {t('error.title')}
            </h1>
            <p className="text-sm text-zinc-400">
              {t('error.description')}
            </p>
            {this.state.error && (
              <pre className="mt-3 p-3 rounded-lg bg-zinc-800/60 text-xs text-red-400 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium transition-colors"
              >
                {t('error.retry')}
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-sm font-medium transition-colors"
              >
                {t('error.reload')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
