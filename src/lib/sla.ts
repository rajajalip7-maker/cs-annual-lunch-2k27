export function getSlaDueAt(hours?: number): Date {
  const slaHours = hours ?? parseInt(process.env.SLA_HOURS || '24', 10);
  return new Date(Date.now() + slaHours * 60 * 60 * 1000);
}

export function getSlaStatus(slaDueAt: Date): {
  status: 'ok' | 'warning' | 'overdue';
  label: string;
  hoursRemaining: number;
} {
  const now = Date.now();
  const due = slaDueAt.getTime();
  const hoursRemaining = (due - now) / (1000 * 60 * 60);

  if (hoursRemaining < 0) {
    return { status: 'overdue', label: 'SLA overdue', hoursRemaining };
  }
  if (hoursRemaining < 4) {
    return { status: 'warning', label: 'SLA ending soon', hoursRemaining };
  }
  return { status: 'ok', label: 'Within SLA', hoursRemaining };
}

export function formatSlaRemaining(hours: number): string {
  if (hours < 0) {
    const overdue = Math.abs(hours);
    if (overdue < 1) return `${Math.round(overdue * 60)}m overdue`;
    return `${Math.round(overdue)}h overdue`;
  }
  if (hours < 1) return `${Math.round(hours * 60)}m remaining`;
  return `${Math.round(hours)}h remaining`;
}
