import axios from 'axios';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();
class VectorService {
  constructor() {
    this.geminiApiKey = null;
    this.pinecone = null;
    this.index = null;
    this.indexName = process.env.PINECONE_INDEX_NAME ||  'rag-by'; 
    this.dimension = process.env.PINECONE_DIMENSIONs || 768; // text-embedding-004 produces 768-dimensional vectors
  }

  async initializeIfNeeded() {
    if (!this.geminiApiKey) {
      this.geminiApiKey = process.env.GEMINI_API_KEY;
      if (!this.geminiApiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }
    }

    if (!this.pinecone) {
      const pineconeApiKey = process.env.PINECONE_API_KEY;
      if (!pineconeApiKey) {
        throw new Error('PINECONE_API_KEY environment variable is not set');
      }

      this.pinecone = new Pinecone({
        apiKey: pineconeApiKey,
      });

      try {
        this.index = this.pinecone.index(this.indexName);
        console.log(`[VectorService Initialisation]: Connected to Pinecone index: ${this.indexName}`);
      } catch (error) {
        console.error('[VectorService Initialisation]: Failed to connect to Pinecone index:', error);
        throw new Error(`[VectorService Initialisation]: Failed to connect to Pinecone index: ${this.indexName}`);
      }
    }
  }

  // Generate embeddings using Google's Embedding API
  async generateEmbedding(text) {
    try {
      await this.initializeIfNeeded();
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent`;
      
      const response = await axios.post(`${url}?key=${this.geminiApiKey}`, {
        model: "models/text-embedding-004",
        content: {
          parts: [{ text: text }]
        }
      });

      return response.data.embedding.values;
    } catch (error) {
      console.error('[VectorService+generateEmbedding]: Error generating embedding:', error.response?.data || error.message);
      throw new Error('Failed to generate embedding');
    }
  }

  // Split text into chunks for better embedding
  chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    const words = text.split(' ');
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push({
          text: chunk.trim(),
          startIndex: i,
          endIndex: Math.min(i + chunkSize, words.length)
        });
      }
    }
    
    return chunks;
  }

  // Store document with embeddings in Pinecone
  async storeDocument(projectId, documentName, content) {
    try {
      await this.initializeIfNeeded();
      
      const chunks = this.chunkText(content);
      const documentChunks = [];
      const vectors = [];
      
      console.log(`[VectorService StoreDoc]: Chunking done. Processing ${chunks.length} chunks for document: ${documentName}`);
      
      // Generate embeddings for each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`[VectorService StoreDoc]: Generating embedding for chunk ${i + 1}/${chunks.length}`);
        
        const embedding = await this.generateEmbedding(chunk.text);
        const chunkId = `${projectId}_${documentName.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`;
        
        const chunkData = {
          id: chunkId,
          projectId,
          documentName,
          text: chunk.text,
          embedding,
          metadata: {
            projectId,
            documentName,
            chunkIndex: i,
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex,
            length: chunk.text.length,
            text: chunk.text.substring(0, 1000) // Pinecone metadata has size limits
          }
        };
        
        documentChunks.push(chunkData);
        
        // Prepare vector for Pinecone upsert
        vectors.push({
          id: chunkId,
          values: embedding,
          metadata: chunkData.metadata
        });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Batch upsert vectors to Pinecone
      console.log(`[VectorService StoreDoc]: Embedding done. Upserting ${vectors.length} vectors to Pinecone...`);

      // Pinecone recommends batching upserts in groups of 100
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await this.index.upsert(batch);
        console.log(`[VectorService StoreDoc]:Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
      }

      console.log(`[VectorService StoreDoc]: Stored ${documentChunks.length} chunks for document: ${documentName} in Pinecone`);
      return documentChunks;
    } catch (error) {
      console.error('[VectorService StoreDoc]: Error storing document in Pinecone:', error);
      throw error;
    }
  }



  // Search for similar documents using Pinecone vector similarity
  async searchSimilarDocuments(projectId, query, topK = 5) {
    try {
      await this.initializeIfNeeded();

      console.log(`[VectorService SearchSimilarDocs]: Searching for similar documents in project and started generating embedding for question: ${projectId}`);

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      console.log("[VectorService SearchSimilarDocs]: Query embedding generated for question:", queryEmbedding);

      console.log("[VectorService SearchSimilarDocs]: Querying Pinecone for similar document chunks... filtering by projectID");
      // Query Pinecone with project filter
      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true,
        filter: {
          projectId: { $eq: projectId }
        }
      });

      console.log("[VectorService SearchSimilarDocs]: Pinecone query response:", queryResponse);

      if (!queryResponse.matches || queryResponse.matches.length === 0) {
        console.log('[VectorService SearchSimilarDocs]: No document chunks found for project:', projectId);
        return [];
      }
      
      // Transform Pinecone results to our format
      const results = queryResponse.matches.map(match => ({
        id: match.id,
        projectId: match.metadata.projectId,
        documentName: match.metadata.documentName,
        text: match.metadata.text,
        similarity: match.score,
        metadata: {
          chunkIndex: match.metadata.chunkIndex,
          startIndex: match.metadata.startIndex,
          endIndex: match.metadata.endIndex,
          length: match.metadata.length
        }
      }));

      console.log(`[VectorService SearchSimilarDocs]: Found ${results.length} similar chunks with similarities:`,
        results.map(r => ({
          doc: r.documentName,
          similarity: r.similarity.toFixed(3),
          chunk: r.metadata.chunkIndex 
        })));
      
      return results;
    } catch (error) {
      console.error('[VectorService SearchSimilarDocs]: Error searching similar documents in Pinecone:', error);
      throw error;
    }
  }

  // Delete all vectors for a specific project from Pinecone
  async deleteProjectVectors(projectId) {
    try {
      await this.initializeIfNeeded();

      console.log(`[VectorService DeleteProjectVectors]: Starting cleanup of vectors for project: ${projectId}`);

      // First, query to get all vector IDs for this project
      const queryResponse = await this.index.query({
        vector: new Array(this.dimension).fill(0), // Dummy vector
        topK: 10000, // Large number to get all vectors
        includeMetadata: false,
        includeValues: false,
        filter: {
          projectId: { $eq: projectId }
        }
      });

      if (queryResponse.matches && queryResponse.matches.length > 0) {
        const vectorIds = queryResponse.matches.map(match => match.id);
        console.log(`[VectorService DeleteProjectVectors]: Found ${vectorIds.length} vectors to delete for project: ${projectId}`);

        // Delete by IDs in batches
        const batchSize = 1000;
        for (let i = 0; i < vectorIds.length; i += batchSize) {
          const batch = vectorIds.slice(i, i + batchSize);
          await this.index.deleteMany(batch);
          console.log(`[VectorService DeleteProjectVectors]: Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectorIds.length / batchSize)}`);
        }

        console.log(`[VectorService DeleteProjectVectors]: Successfully deleted ${vectorIds.length} vectors for project: ${projectId}`);
        return { deletedCount: vectorIds.length };
      } else {
        console.log(`[VectorService DeleteProjectVectors]: No vectors found for project: ${projectId}`);
        return { deletedCount: 0 };
      }
    } catch (error) {
      console.error('[VectorService DeleteProjectVectors]: Error deleting project vectors from Pinecone:', error);
      throw error;
    }
  }

}

export default new VectorService();
