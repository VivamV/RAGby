import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Extract text from different file types
export const extractTextFromFile = async (filePath, fileType) => {
  try {
    switch (fileType) {
      case 'application/pdf':
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        return pdfData.text;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docxResult = await mammoth.extractRawText({ path: filePath });
        return docxResult.value;

      case 'text/plain':
        return fs.readFileSync(filePath, 'utf8');

      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
};

// Simple text similarity function (cosine similarity alternative)
export const calculateSimilarity = (text1, text2) => {
  const words1 = text1.toLowerCase().split(/\W+/);
  const words2 = text2.toLowerCase().split(/\W+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
};

// Search for relevant content in documents
export const searchDocuments = (query, documents, threshold = 0.1) => {
  const results = [];
  
  for (const doc of documents) {
    if (!doc.content) continue;
    
    // Split document into chunks
    const chunks = doc.content.split('\n').filter(chunk => chunk.trim().length > 20);
    
    for (const chunk of chunks) {
      const similarity = calculateSimilarity(query, chunk);
      if (similarity > threshold) {
        results.push({
          documentName: doc.originalName,
          content: chunk,
          similarity
        });
      }
    }
  }
  
  // Sort by similarity and return top results
  return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
};
