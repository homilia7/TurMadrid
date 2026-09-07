const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const MONTHS_SPANISH = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const MONTHS_SPANISH_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sept',
  'Oct',
  'Nov',
  'Dic',
];

export function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(year, month, day, 12, 0, 0);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function getDayOfWeek(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return '';
  return DAYS_OF_WEEK[d.getDay()];
}

export function formatDateWithDay(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  const dayName = DAYS_OF_WEEK[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTHS_SPANISH[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dayNum} de ${monthName} ${year}`;
}

export function formatDateShortWithDay(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  const dayName = DAYS_OF_WEEK[d.getDay()];
  const dayNum = d.getDate();
  const monthShort = MONTHS_SPANISH_SHORT[d.getMonth()];
  return `${dayName} ${dayNum} ${monthShort}`;
}
