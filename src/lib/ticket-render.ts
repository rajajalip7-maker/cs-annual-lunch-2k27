import { readFile } from 'fs/promises';
import path from 'path';
import QRCode from 'qrcode';
import { EVENT } from './event';

export interface TicketRenderData {
  name: string;
  rollNo: string;
  ticketUid: string;
  entryCode: string;
  accommodationType: string;
  qrSignature: string;
}

const TICKET_FONT = 'TicketSans';
const TICKET_FONT_BOLD = 'TicketSans';
const TICKET_FONT_MONO = 'TicketMono';

let fontStyleCache: string | null = null;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadEmbeddedFontStyles(): Promise<string> {
  if (fontStyleCache) return fontStyleCache;

  const fontDir = path.join(process.cwd(), 'assets', 'fonts');
  const [regular, bold, mono] = await Promise.all([
    readFile(path.join(fontDir, 'DejaVuSans.ttf')),
    readFile(path.join(fontDir, 'DejaVuSans-Bold.ttf')),
    readFile(path.join(fontDir, 'DejaVuSansMono.ttf')),
  ]);

  fontStyleCache = `
    @font-face {
      font-family: '${TICKET_FONT}';
      src: url(data:font/ttf;base64,${regular.toString('base64')}) format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: '${TICKET_FONT_BOLD}';
      src: url(data:font/ttf;base64,${bold.toString('base64')}) format('truetype');
      font-weight: bold;
      font-style: normal;
    }
    @font-face {
      font-family: '${TICKET_FONT_MONO}';
      src: url(data:font/ttf;base64,${mono.toString('base64')}) format('truetype');
      font-weight: normal;
      font-style: normal;
    }
  `;

  return fontStyleCache;
}

async function loadBackgroundBuffer(): Promise<Buffer> {
  const jpgPath = path.join(process.cwd(), 'public', 'images', 'cs-department-bg.jpg');
  const svgPath = path.join(process.cwd(), 'public', 'images', 'cs-department-bg.svg');
  try {
    return await readFile(jpgPath);
  } catch {
    return await readFile(svgPath);
  }
}

async function buildOverlaySvg(data: TicketRenderData, width: number, height: number): Promise<string> {
  const typeLabel = data.accommodationType === 'hostellite' ? 'Hostellite' : 'Day Scholar';
  const fontStyles = await loadEmbeddedFontStyles();

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style><![CDATA[${fontStyles}]]></style>
    <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.78"/>
      <stop offset="50%" stop-color="#1e1b4b" stop-opacity="0.88"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#overlay)"/>
  <rect x="0" y="0" width="${width}" height="6" fill="url(#accent)"/>

  <text x="${width / 2}" y="50" text-anchor="middle" fill="#94a3b8" font-family="${TICKET_FONT}" font-size="12" letter-spacing="3">${escapeXml(EVENT.subtitle.toUpperCase())}</text>
  <text x="${width / 2}" y="88" text-anchor="middle" fill="#ffffff" font-family="${TICKET_FONT_BOLD}" font-size="28" font-weight="bold">${escapeXml(EVENT.name)}</text>
  <text x="${width / 2}" y="112" text-anchor="middle" fill="#a5b4fc" font-family="${TICKET_FONT}" font-size="12">${escapeXml(EVENT.tagline)}</text>

  <rect x="40" y="135" width="520" height="185" rx="14" fill="#1e293b" fill-opacity="0.75" stroke="#475569" stroke-width="1"/>
  <text x="70" y="168" fill="#94a3b8" font-family="${TICKET_FONT_BOLD}" font-size="11" font-weight="bold">DATE</text>
  <text x="70" y="188" fill="#ffffff" font-family="${TICKET_FONT_BOLD}" font-size="14" font-weight="bold">${escapeXml(EVENT.date)}</text>
  <text x="310" y="168" fill="#94a3b8" font-family="${TICKET_FONT_BOLD}" font-size="11" font-weight="bold">DAY</text>
  <text x="310" y="188" fill="#ffffff" font-family="${TICKET_FONT_BOLD}" font-size="14" font-weight="bold">${escapeXml(EVENT.day)}</text>
  <line x1="70" y1="205" x2="530" y2="205" stroke="#475569" stroke-width="1"/>
  <text x="70" y="235" fill="#94a3b8" font-family="${TICKET_FONT_BOLD}" font-size="11" font-weight="bold">TIME</text>
  <text x="70" y="255" fill="#ffffff" font-family="${TICKET_FONT_BOLD}" font-size="14" font-weight="bold">${escapeXml(EVENT.timeRange)}</text>
  <text x="70" y="290" fill="#94a3b8" font-family="${TICKET_FONT_BOLD}" font-size="11" font-weight="bold">VENUE</text>
  <text x="70" y="310" fill="#ffffff" font-family="${TICKET_FONT_BOLD}" font-size="14" font-weight="bold">${escapeXml(EVENT.venue)}</text>
  <text x="70" y="328" fill="#cbd5e1" font-family="${TICKET_FONT}" font-size="11">${escapeXml(EVENT.venueDetail)}</text>

  <rect x="40" y="335" width="520" height="115" rx="14" fill="#312e81" fill-opacity="0.55" stroke="#6366f1" stroke-width="1"/>
  <text x="70" y="365" fill="#a5b4fc" font-family="${TICKET_FONT_BOLD}" font-size="10" font-weight="bold" letter-spacing="2">ATTENDEE</text>
  <text x="70" y="395" fill="#ffffff" font-family="${TICKET_FONT_BOLD}" font-size="22" font-weight="bold">${escapeXml(data.name)}</text>
  <text x="70" y="420" fill="#c7d2fe" font-family="${TICKET_FONT}" font-size="14">${escapeXml(data.rollNo)}</text>
  <text x="70" y="438" fill="#94a3b8" font-family="${TICKET_FONT}" font-size="12">${escapeXml(typeLabel)}</text>

  <rect x="160" y="470" width="280" height="280" rx="14" fill="#ffffff"/>
  <text x="${width / 2}" y="800" text-anchor="middle" fill="#22d3ee" font-family="${TICKET_FONT_BOLD}" font-size="10" font-weight="bold" letter-spacing="2">TICKET ID</text>
  <text x="${width / 2}" y="825" text-anchor="middle" fill="#ffffff" font-family="${TICKET_FONT_MONO}" font-size="16" font-weight="bold">${escapeXml(data.entryCode)}</text>
  <text x="${width / 2}" y="842" text-anchor="middle" fill="#64748b" font-family="${TICKET_FONT_MONO}" font-size="8">${escapeXml(data.ticketUid)}</text>
  <text x="${width / 2}" y="860" text-anchor="middle" fill="#fbbf24" font-family="${TICKET_FONT}" font-size="10">Bring this ticket to the venue on event day</text>
  <text x="${width / 2}" y="876" text-anchor="middle" fill="#475569" font-family="${TICKET_FONT}" font-size="9">Valid for one entry at the gate</text>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="22" fill="none" stroke="#22d3ee" stroke-width="2" stroke-opacity="0.4"/>
</svg>`;
}

async function buildFullTicketSvg(data: TicketRenderData): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(data.qrSignature, {
    width: 260,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  });

  const overlay = await buildOverlaySvg(data, 600, 900);
  return overlay.replace(
    '<rect x="160" y="470" width="280" height="280" rx="14" fill="#ffffff"/>',
    `<rect x="160" y="470" width="280" height="280" rx="14" fill="#ffffff"/>
  <image href="${qrDataUrl}" x="170" y="480" width="260" height="260"/>`
  );
}

function getFontFiles(): string[] {
  const fontDir = path.join(process.cwd(), 'assets', 'fonts');
  return ['DejaVuSans.ttf', 'DejaVuSans-Bold.ttf', 'DejaVuSansMono.ttf'].map((f) =>
    path.join(fontDir, f)
  );
}

export async function generateTicketPng(data: TicketRenderData): Promise<Buffer> {
  const width = 600;
  const height = 900;

  const [bgBuffer, svg] = await Promise.all([loadBackgroundBuffer(), buildFullTicketSvg(data)]);

  const sharp = (await import('sharp')).default;
  const background = await sharp(bgBuffer).resize(width, height, { fit: 'cover' }).png().toBuffer();

  const overlayPng = Buffer.from(
    new (await import('@resvg/resvg-js')).Resvg(svg, {
      fitTo: { mode: 'width', value: width },
      font: {
        fontFiles: getFontFiles(),
        loadSystemFonts: false,
        defaultFontFamily: TICKET_FONT,
      },
    }).render().asPng()
  );

  return sharp(background)
    .composite([{ input: overlayPng, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

export async function generateTicketSvg(data: TicketRenderData): Promise<string> {
  return buildFullTicketSvg(data);
}
