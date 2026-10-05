/*
  Warnings:

  - You are about to drop the column `embeddings` on the `Chunk` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chunk" DROP COLUMN "embeddings",
ADD COLUMN     "embedding" vector(1536);
