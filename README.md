# DocuChat: AI-Powered Document Q&A System
DocuChat is an AI-powered backend for document-based question answering, inspired by systems like Notion AI and ChatGPT with file upload support.

Users can upload PDF or text documents, which are split into chunks, converted into vector embeddings, and stored in PostgreSQL using pgvector. When a user asks a question, the system retrieves the most relevant chunks through semantic similarity search, combines them as context, and sends them to an LLM to generate a grounded answer with citations to the exact source material.