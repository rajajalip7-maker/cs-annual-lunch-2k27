import path from 'path';

/** Persistent data root — use one Railway volume mounted at /app/data */
export function getPersistRoot(): string {
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    return process.env.RAILWAY_VOLUME_MOUNT_PATH;
  }
  if (process.env.PERSIST_DIR) {
    return process.env.PERSIST_DIR;
  }
  if (process.env.NODE_ENV === 'production') {
    return '/app/data';
  }
  return path.join(process.cwd(), 'data');
}

export function getDatabaseUrl(): string {
  const dbFile = path.join(getPersistRoot(), 'prod.db');
  const volumeUrl = `file:${dbFile}`;

  const configured = process.env.DATABASE_URL?.trim();
  if (!configured || configured.includes('./dev.db')) {
    return volumeUrl;
  }

  // file:./prisma/prod.db writes inside the container, not on the volume
  if (configured.includes('./') || configured.includes('.\\')) {
    console.warn(`DATABASE_URL uses a relative path (${configured}); using ${volumeUrl}`);
    return volumeUrl;
  }

  return configured;
}

export function getUploadDir(): string {
  return path.join(getPersistRoot(), 'uploads', 'proofs');
}
