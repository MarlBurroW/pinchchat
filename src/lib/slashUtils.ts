/** Check if slash command menu should be shown */
export function shouldShowSlashMenu(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith('/') && !trimmed.includes('\n') && !trimmed.includes(' ');
}
