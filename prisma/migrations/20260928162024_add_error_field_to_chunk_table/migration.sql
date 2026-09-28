/*
  Warnings:

  - Added the required column `error` to the `Chunk` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chunk" ADD COLUMN     "error" TEXT NOT NULL;
