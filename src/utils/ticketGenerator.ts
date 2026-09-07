import { formatDateWithDay } from './dateUtils';

// Generates elegant SVG/DataURL tickets for tours
export function generateDigitalTicketSvg({
  tourTitle,
  travelerName = 'Pase Grupal (5 Viajeros)',
  date,
  time,
  location,
  referenceNumber,
  meetingPoint,
}: {
  tourTitle: string;
  travelerName?: string;
  date: string;
  time: string;
  location: string;
  referenceNumber: string;
  meetingPoint?: string;
}): string {
  const cleanRef = referenceNumber || 'ESP-' + Math.floor(100000 + Math.random() * 900000);
  const formattedDate = date.includes(' ') && !date.match(/^\d{4}-\d{2}-\d{2}$/) ? date : formatDateWithDay(date);
  
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
    <defs>
      <linearGradient id="ticketBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1c1917" />
        <stop offset="100%" stop-color="#292524" />
      </linearGradient>
      <linearGradient id="accentGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#44403c" stroke-width="0.5" opacity="0.2"/>
      </pattern>
    </defs>
    
    <!-- Background Card -->
    <rect x="0" y="0" width="800" height="400" rx="16" fill="url(#ticketBg)" />
    <rect x="0" y="0" width="800" height="400" rx="16" fill="url(#grid)" />
    
    <!-- Top Gold Accent Bar -->
    <rect x="0" y="0" width="800" height="8" rx="4" fill="url(#accentGold)" />
    
    <!-- Left Section: Main Ticket Details -->
    <text x="40" y="55" fill="#f59e0b" font-family="sans-serif" font-size="12" font-weight="700" letter-spacing="2">BOLETO DE ACCESO OFICIAL • ESPAÑA</text>
    
    <text x="40" y="105" fill="#fafaf9" font-family="serif" font-size="28" font-weight="700">${escapeXml(tourTitle)}</text>
    
    <!-- Info Grid -->
    <g transform="translate(40, 140)">
      <!-- Col 1: Fecha y Hora -->
      <text x="0" y="0" fill="#a8a29e" font-family="sans-serif" font-size="11" text-transform="uppercase">FECHA Y HORA</text>
      <text x="0" y="24" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700">${escapeXml(formattedDate)} • ${escapeXml(time)}</text>
      
      <!-- Col 2: Titular / Viajero -->
      <text x="240" y="0" fill="#a8a29e" font-family="sans-serif" font-size="11" text-transform="uppercase">TITULAR / GRUPO</text>
      <text x="240" y="24" fill="#38bdf8" font-family="sans-serif" font-size="16" font-weight="600">${escapeXml(travelerName)}</text>
      
      <!-- Location -->
      <text x="0" y="70" fill="#a8a29e" font-family="sans-serif" font-size="11" text-transform="uppercase">LUGAR</text>
      <text x="0" y="92" fill="#e7e5e4" font-family="sans-serif" font-size="14">${escapeXml(location)}</text>

      <!-- Meeting Point if available -->
      ${
        meetingPoint
          ? `<text x="0" y="130" fill="#fbbf24" font-family="sans-serif" font-size="11" text-transform="uppercase">PUNTO DE ENCUENTRO</text>
             <text x="0" y="150" fill="#fef3c7" font-family="sans-serif" font-size="12">${escapeXml(meetingPoint)}</text>`
          : ''
      }
    </g>
    
    <!-- Perforation line -->
    <line x1="560" y1="20" x2="560" y2="380" stroke="#57534e" stroke-width="2" stroke-dasharray="8 8" />
    <circle cx="560" cy="0" r="16" fill="#0c0a09" />
    <circle cx="560" cy="400" r="16" fill="#0c0a09" />
    
    <!-- Right Stub (QR Code & Reference) -->
    <g transform="translate(580, 40)">
      <rect x="25" y="20" width="150" height="150" rx="8" fill="#ffffff" />
      
      <!-- Stylized Simulated QR Code pattern -->
      <g fill="#000000" transform="translate(35, 30)">
        <!-- Corners -->
        <rect x="0" y="0" width="36" height="36" />
        <rect x="6" y="6" width="24" height="24" fill="#ffffff" />
        <rect x="11" y="11" width="14" height="14" />
        
        <rect x="94" y="0" width="36" height="36" />
        <rect x="100" y="6" width="24" height="24" fill="#ffffff" />
        <rect x="105" y="11" width="14" height="14" />
        
        <rect x="0" y="94" width="36" height="36" />
        <rect x="6" y="100" width="24" height="24" fill="#ffffff" />
        <rect x="11" y="105" width="14" height="14" />
        
        <!-- Random QR squares -->
        <rect x="44" y="8" width="8" height="24" />
        <rect x="60" y="16" width="24" height="8" />
        <rect x="44" y="44" width="42" height="42" />
        <rect x="52" y="52" width="26" height="26" fill="#ffffff" />
        <rect x="60" y="60" width="10" height="10" />
        <rect x="12" y="48" width="16" height="8" />
        <rect x="100" y="48" width="20" height="12" />
        <rect x="48" y="96" width="14" height="24" />
        <rect x="72" y="96" width="20" height="14" />
        <rect x="102" y="76" width="18" height="24" />
      </g>
      
      <text x="100" y="200" fill="#a8a29e" font-family="monospace" font-size="11" text-anchor="middle">REF: ${escapeXml(cleanRef)}</text>
      <text x="100" y="225" fill="#f59e0b" font-family="sans-serif" font-size="11" font-weight="700" text-anchor="middle">ESCANEAR AL INGRESO</text>
      
      <!-- Barcode simulation -->
      <g transform="translate(10, 260)">
        <rect x="0" y="0" width="4" height="36" fill="#ffffff" />
        <rect x="8" y="0" width="6" height="36" fill="#ffffff" />
        <rect x="18" y="0" width="2" height="36" fill="#ffffff" />
        <rect x="24" y="0" width="8" height="36" fill="#ffffff" />
        <rect x="36" y="0" width="3" height="36" fill="#ffffff" />
        <rect x="44" y="0" width="7" height="36" fill="#ffffff" />
        <rect x="56" y="0" width="2" height="36" fill="#ffffff" />
        <rect x="62" y="0" width="5" height="36" fill="#ffffff" />
        <rect x="72" y="0" width="8" height="36" fill="#ffffff" />
        <rect x="84" y="0" width="3" height="36" fill="#ffffff" />
        <rect x="92" y="0" width="6" height="36" fill="#ffffff" />
        <rect x="104" y="0" width="2" height="36" fill="#ffffff" />
        <rect x="110" y="0" width="8" height="36" fill="#ffffff" />
        <rect x="122" y="0" width="4" height="36" fill="#ffffff" />
        <rect x="130" y="0" width="6" height="36" fill="#ffffff" />
        <rect x="142" y="0" width="2" height="36" fill="#ffffff" />
        <rect x="150" y="0" width="7" height="36" fill="#ffffff" />
        <rect x="162" y="0" width="4" height="36" fill="#ffffff" />
        <rect x="172" y="0" width="6" height="36" fill="#ffffff" />
      </g>
    </g>
  </svg>
  `.trim();

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
