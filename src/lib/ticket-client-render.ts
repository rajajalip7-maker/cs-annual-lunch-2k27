import { EVENT } from './event';

export interface ClientTicketData {
  name: string;
  rollNo: string;
  entryCode: string;
  ticketUid: string;
  accommodationType: string;
  qrDataUrl: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let dy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, dy);
      line = word;
      dy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, dy);
  return dy;
}

export async function renderTicketToBlob(data: ClientTicketData): Promise<Blob> {
  const width = 600;
  const height = 900;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(0.5, '#1e1b4b');
  bg.addColorStop(1, '#0f172a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const accent = ctx.createLinearGradient(0, 0, width, 0);
  accent.addColorStop(0, '#22d3ee');
  accent.addColorStop(1, '#a78bfa');
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, width, 6);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText(EVENT.subtitle.toUpperCase(), width / 2, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  wrapText(ctx, EVENT.name, width / 2, 82, width - 60, 30);

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '12px sans-serif';
  ctx.fillText(EVENT.tagline, width / 2, 118);

  ctx.strokeStyle = '#475569';
  ctx.fillStyle = 'rgba(30,41,59,0.85)';
  roundRect(ctx, 40, 135, 520, 175, 14);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('DATE', 70, 165);
  ctx.fillText('DAY', 310, 165);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(EVENT.dateShort, 70, 185);
  ctx.fillText(EVENT.day, 310, 185);

  ctx.strokeStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(70, 200);
  ctx.lineTo(530, 200);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('TIME', 70, 225);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(EVENT.timeRange, 70, 245);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('VENUE', 70, 275);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  wrapText(ctx, EVENT.venue, 70, 295, 460, 18);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '11px sans-serif';
  wrapText(ctx, EVENT.venueDetail, 70, 318, 460, 16);

  ctx.fillStyle = 'rgba(49,46,129,0.65)';
  ctx.strokeStyle = '#6366f1';
  roundRect(ctx, 40, 325, 520, 110, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a5b4fc';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('ATTENDEE', 70, 355);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(data.name, 70, 385);
  ctx.fillStyle = '#c7d2fe';
  ctx.font = '14px sans-serif';
  ctx.fillText(data.rollNo, 70, 408);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  const typeLabel = data.accommodationType === 'hostellite' ? 'Hostellite' : 'Day Scholar';
  ctx.fillText(typeLabel, 70, 426);

  ctx.fillStyle = '#fff';
  roundRect(ctx, 160, 455, 280, 280, 14);
  ctx.fill();
  const qrImg = await loadImage(data.qrDataUrl);
  ctx.drawImage(qrImg, 170, 465, 260, 260);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('TICKET ID', width / 2, 770);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(data.entryCode, width / 2, 795);
  ctx.fillStyle = '#64748b';
  ctx.font = '8px monospace';
  ctx.fillText(data.ticketUid, width / 2, 812);
  ctx.fillStyle = '#fbbf24';
  ctx.font = '10px sans-serif';
  ctx.fillText('Bring this ticket to the venue on event day', width / 2, 835);
  ctx.fillStyle = '#475569';
  ctx.font = '9px sans-serif';
  ctx.fillText('Valid for one entry at the gate', width / 2, 852);

  ctx.strokeStyle = 'rgba(34,211,238,0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, width - 2, height - 2, 22);
  ctx.stroke();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1));
  if (!blob) throw new Error('Could not create ticket image');
  return blob;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function downloadTicketImage(data: ClientTicketData, rollNo: string) {
  const blob = await renderTicketToBlob(data);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const filename = `ticket-${rollNo}.png`;
  const url = URL.createObjectURL(blob);

  if (isMobile && typeof navigator.share === 'function') {
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Event Ticket' });
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // fall through
    }
  }

  if (isMobile) {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Save Ticket</title></head>
        <body style="margin:0;background:#0f172a;text-align:center;padding:16px;">
        <p style="color:#fff;font-family:sans-serif;">Long-press the ticket image → Save image</p>
        <img src="${url}" style="max-width:100%;border-radius:16px;" alt="Ticket"/>
        </body></html>`);
      win.document.close();
      setTimeout(() => URL.revokeObjectURL(url), 120000);
      return;
    }
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
