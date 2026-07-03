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
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('./dev.db')) {
    return process.env.DATABASE_URL;
  }
  const dbFile = path.join(getPersistRoot(), 'prod.db');
  return `file:${dbFile}`;
}

export function getUploadDir(): string {
  return path.join(getPersistRoot(), 'uploads', 'proofs');
}
