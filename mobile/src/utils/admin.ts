import { palette } from '../theme';

/** Formats an ISO timestamp from the admin API for display. */
export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formats an ISO timestamp as a short date only. */
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Maps a follow-up priority string to a badge status. */
export function priorityStatus(priority?: string | null): 'DANGER' | 'WARNING' | 'INFO' | 'DEFAULT' {
  switch ((priority || '').toUpperCase()) {
    case 'HIGH_PRIORITY':
      return 'DANGER';
    case 'FOLLOW_UP':
      return 'WARNING';
    case 'MONITOR':
      return 'INFO';
    default:
      return 'DEFAULT';
  }
}

/** Human-readable priority label. */
export function priorityLabel(priority?: string | null): string {
  const value = (priority || 'NORMAL').toUpperCase();
  return value === 'HIGH_PRIORITY' ? 'High priority' : value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Colour accent used for stat tiles. */
export const statColors = {
  teal: palette.teal600,
  blue: palette.blue600,
  warning: palette.warning600,
  danger: palette.danger600,
  success: palette.success600,
  slate: palette.slate600,
};
