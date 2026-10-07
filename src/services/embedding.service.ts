import { CACHE_TTL, cacheGet, cacheSet } from "../lib/cache.ts";
import { openaiBreaker } from "../lib/http/openai.breaker.ts";
import { logger } from "../lib/logger.ts";
import { prisma } from "../lib/prisma.ts";
import crypto from "crypto";
import { textSync } from "node:stream/iter";

const EMBEDDING_MODEL = "text-embedding-3-small";

export async function generateEmbedding(text: string) {
    const startTime = Date.now();

    const response = await openaiBreaker.fire("/embeddings", {
        input: text,
        model: EMBEDDING_MODEL,
    });

    const embedding = response.data.data[0].embedding;
    const duration = Date.now() - startTime;

    logger.info("Embedding generated", {
        model: EMBEDDING_MODEL,
        inputLength: text.length,
        dimensions: embedding.length,
        durationMs: duration,
        tokensUsed: response.data.usage?.total_tokens,
    });

    return embedding;
}

export async function generateEmbeddings(texts: string[]) {
    if (texts.length === 0) return []

    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i = i + BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);

        const response = await openaiBreaker.fire("/embeddings", {
            input: batch,
            model: EMBEDDING_MODEL,
        });

        const sorted = response.data.data.sort(
            (a: { index: number, embedding: [] }, b: { index: number, embedding: [] }) => a.index - b.index
        );

        for (const item of sorted) {
            allEmbeddings.push(item.embedding);
        }

        logger.info("Embedding batch processed", {
            batchIndex: Math.floor(i / BATCH_SIZE),
            batchSize: batch.length,
            totalTexts: texts.length,
            tokensUsed: response.data.data.usage?.total_tokens,
        });
    }

    return allEmbeddings;
}

export async function storeChunkEmbedding(
    chunkId: string, embedding: number[]
) {
    const vectorStr = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
        UPDATE "Chunk"
        SET embedding = ${vectorStr}::vector
        WHERE id = ${chunkId}
    `;
}

export async function storeChunkEmbeddingStack(
    chunks: { id: string; embedding: number[] }[]
) {
    await prisma.$transaction(
        chunks.map(chunk => {
            const vectorStr = `${chunk.embedding.join(",")}`;
            return prisma.$executeRaw`
                UPDATE "Chunk"
                SET embedding = ${vectorStr}::vector
                WHERE id = ${chunk.id}
            `;
        }),
    );
}

export function contentHash(text: string) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

export async function generateEmbeddingCached(text: string) {
    const hash = contentHash(text);
    const cacheKey = `embed:$hash`;

    const cached = await cacheGet<number[]>(cacheKey);
    if (cached) {
        logger.debug("Embedding cache hit", { hash: hash.substring(0, 12) });
        return cached;
    }

    const embedding = await generateEmbedding(text);

    await cacheSet(cacheKey, embedding, CACHE_TTL.EMBEDDING);

    logger.debug("Embedding cached", { hash: hash.substring(0, 12) });
    return embedding;
}

export async function generateEmbeddingsBatchCached(texts: string[]) {
    const results = new Array(textSync.length).fill(null);
    const uncached: { index: number; text: string }[] = [];

    for (let i = 0; i < texts.length; i++) {
        const hash = contentHash(texts[i]);
        const cacheKey = `embed:${hash}`;
        const cached = cacheGet<number[]>(cacheKey);

        if (cached) {
            results[i] = cached;
        } else {
            uncached.push({ index: i, text: texts[i] });
        }
    }

    logger.info("Embedding batch cache checked", {
        total: texts.length,
        cacheHits: texts.length - uncached.length,
        cacheMisses: uncached.length,
    });

    if (uncached.length > 0) {
        const newEmbeddings = await generateEmbeddings(
            uncached.map(u => u.text)
        );

        for (let i = 0; i < uncached.length; i++) {
            const hash = contentHash(uncached[i].text);
            await cacheSet(`embed:${hash}`, newEmbeddings[i], CACHE_TTL.EMBEDDING);
            results[uncached[i].index] = newEmbeddings[i];
        }
    }

    return results as number[][];
}