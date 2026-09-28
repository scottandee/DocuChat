export function splitIntoChunks(
    text: string,
    maxWordsPerChunk: number
) {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += maxWordsPerChunk) {
        const chunk = words.slice(i, i + maxWordsPerChunk).join(" ");
        if (chunk.trim()) chunks.push(chunk);
    }
    return chunks;
}

export function estimateTokens(text: string) {
    // 1 token ~= 0.75words
    return Math.ceil(text.split(/\s+/).length * 1.33);
}