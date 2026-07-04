import { mkdir, writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';
import { hashFileContent } from './crypto';
import { getUploadDir } from './paths';

function uploadDir() {
  return getUploadDir();
}
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.pdf'];

export function getMaxUploadBytes(): number {
  return parseInt(process.env.MAX_UPLOAD_MB || '5', 10) * 1024 * 1024;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and PDF files are allowed' };
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return { valid: false, error: 'Invalid file extension' };
  }
  if (file.size > getMaxUploadBytes()) {
    return { valid: false, error: `File must be under ${process.env.MAX_UPLOAD_MB || 5}MB` };
  }
  return { valid: true };
}

export async function savePaymentProof(
  file: File,
  userId: string
): Promise<{ filePath: string; fileHash: string; fileName: string }> {
  await mkdir(uploadDir(), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileHash = hashFileContent(buffer);
  const ext = path.extname(file.name).toLowerCase() || '.jpg';
  const timestamp = Date.now();
  const fileName = `screenshot_${userId}_${timestamp}${ext}`;
  const filePath = path.join(uploadDir(), fileName);
  await writeFile(filePath, buffer);
  return { filePath, fileHash, fileName };
}

export async function readPaymentProof(fileName: string): Promise<Buffer | null> {
  const safeName = path.basename(fileName);
  const filePath = path.join(uploadDir(), safeName);
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export async function deletePaymentProof(fileName: string) {
  const safeName = path.basename(fileName);
  const filePath = path.join(uploadDir(), safeName);
  try {
    await unlink(filePath);
  } catch {
    // file may already be missing
  }
}

export async function deleteExpiredProofs(retentionDays?: number) {
  const days = retentionDays ?? parseInt(process.env.RETENTION_DAYS || '90', 10);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // Handled via cron API - deletes files for old rejected/approved payments
  return { cutoff, message: 'Retention purge endpoint available at /api/cron/retention' };
}
