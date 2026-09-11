import { Traveler } from '../types';

/**
 * Normalizes and beautifies personal names across chat, modals, and lists
 */
export function formatPersonName(rawName?: string): string {
  if (!rawName) return 'Viajero';
  const clean = rawName.trim();
  if (!clean) return 'Viajero';

  return clean
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Returns the customized traveler color, capitalized initial, and role for any person in the chat
 */
export function getPersonDetails(
  name: string,
  travelers: Traveler[] = [],
  fallbackColor?: string
): {
  color: string;
  initial: string;
  formattedName: string;
  isTraveler: boolean;
} {
  const formattedName = formatPersonName(name);
  const initial = formattedName.charAt(0).toUpperCase() || '?';

  const cleanQuery = name.trim().toLowerCase();
  const matchedTraveler = Array.isArray(travelers)
    ? travelers.find((t) => t && t.name && t.name.trim().toLowerCase() === cleanQuery)
    : undefined;

  if (matchedTraveler) {
    return {
      color: matchedTraveler.avatarColor || '#f59e0b',
      initial,
      formattedName,
      isTraveler: true,
    };
  }

  return {
    color: fallbackColor || '#0284c7',
    initial,
    formattedName,
    isTraveler: false,
  };
}
