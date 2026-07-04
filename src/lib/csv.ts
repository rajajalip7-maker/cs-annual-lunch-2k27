export function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  return lines.join('\r\n');
}

export function exportFilterLabel(gender: string, accommodation: string): string {
  const genderPart =
    gender === 'male' ? 'boys' : gender === 'female' ? 'girls' : 'all-students';
  const typePart =
    accommodation === 'hostellite'
      ? 'hostellites'
      : accommodation === 'day_scholar'
        ? 'day-scholars'
        : 'all-types';
  if (gender === 'all' && accommodation === 'all') return 'all-students';
  if (gender === 'all') return typePart;
  if (accommodation === 'all') return genderPart;
  return `${genderPart}-${typePart}`;
}
