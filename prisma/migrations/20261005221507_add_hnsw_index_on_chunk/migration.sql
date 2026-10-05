CREATE INDEX "Chunk_embedding_hnsw_idx"
ON "Chunk"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);