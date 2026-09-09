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

/**
 * Determines whether 10:00 PM (22:00) of the given day has arrived or passed.
 * Evaluates against Spain local time (Europe/Madrid) and user's phone local time.
 */
export function isDayCompletedAt10pm(dayDateStr: string, now: Date = new Date()): boolean {
  if (!dayDateStr) return false;

  // 1. Check Europe/Madrid timezone (official local time for Spain)
  try {
    const spainParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const year = spainParts.find((p) => p.type === 'year')?.value;
    const month = spainParts.find((p) => p.type === 'month')?.value;
    const day = spainParts.find((p) => p.type === 'day')?.value;
    const hour = parseInt(spainParts.find((p) => p.type === 'hour')?.value || '0', 10);

    const spainDate = `${year}-${month}-${day}`;

    // If Spain date is already past this day's date: it is completed
    if (spainDate > dayDateStr) {
      return true;
    }
    // If it is the exact day in Spain and hour is 22 (10 PM) or later: it is completed
    if (spainDate === dayDateStr && hour >= 22) {
      return true;
    }
  } catch (err) {
    console.warn('Error checking Spain timezone:', err);
  }

  // 2. Also check user's phone local time (when user is physically in Spain)
  try {
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const localDate = `${localYear}-${localMonth}-${localDay}`;
    const localHour = now.getHours();

    if (localDate > dayDateStr) {
      return true;
    }
    if (localDate === dayDateStr && localHour >= 22) {
      return true;
    }
  } catch {
    // fallback
  }

  return false;
}

