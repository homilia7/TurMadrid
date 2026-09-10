/**
 * Helper to get dual timezone formatted strings for Madrid (GMT+2) and Costa Rica (GMT-6)
 */
export function getDualTimezoneStrings(date: Date = new Date()): {
  spain: string;
  costaRica: string;
  iso: string;
} {
  const iso = date.toISOString();

  // Madrid time (CEST / CET)
  const optionsSpain: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    hour12: true,
  };

  // Costa Rica time (CST UTC-6)
  const optionsCR: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Costa_Rica',
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    hour12: true,
  };

  const spainFormatted = new Intl.DateTimeFormat('es-ES', optionsSpain).format(date);
  const crFormatted = new Intl.DateTimeFormat('es-CR', optionsCR).format(date);

  return {
    spain: `${spainFormatted} (🇪🇸 Madrid)`,
    costaRica: `${crFormatted} (🇨🇷 Costa Rica)`,
    iso,
  };
}

export function getDualClocks(date: Date = new Date()): {
  costaRicaTime: string;
  spainTime: string;
} {
  const optionsCR: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Costa_Rica',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  const optionsSpain: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return {
    costaRicaTime: new Intl.DateTimeFormat('es-CR', optionsCR).format(date),
    spainTime: new Intl.DateTimeFormat('es-ES', optionsSpain).format(date),
  };
}

export function formatRelativeTimeDual(isoString: string): {
  spainTime: string;
  crTime: string;
  relative: string;
} {
  const d = new Date(isoString);
  const dual = getDualTimezoneStrings(d);
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  let relative = 'Justo ahora';
  if (diffMinutes >= 1 && diffMinutes < 60) {
    relative = `Hace ${diffMinutes}m`;
  } else if (diffMinutes >= 60 && diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    relative = `Hace ${hours}h`;
  } else if (diffMinutes >= 1440) {
    const days = Math.floor(diffMinutes / 1440);
    relative = `Hace ${days}d`;
  }

  return {
    spainTime: dual.spain,
    crTime: dual.costaRica,
    relative,
  };
}
