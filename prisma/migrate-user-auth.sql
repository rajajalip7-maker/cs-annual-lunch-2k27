-- Safe migration: add new User columns without wiping data
-- Run with: npx prisma db execute --file prisma/migrate-user-auth.sql

ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "gender" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "hostelName" TEXT;
ALTER TABLE "User" ADD COLUMN "profileComplete" INTEGER NOT NULL DEFAULT 0;

-- Update mobile, affiliation, accommodationType if missing (may already exist)
-- SQLite ignores duplicate column errors when run individually via script
