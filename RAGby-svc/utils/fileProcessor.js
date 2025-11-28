import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import XLSX from 'xlsx';

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

      // Excel files (.xlsx, .xls)
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        const workbook = XLSX.readFile(filePath);
        let excelText = '';
        
        // Process each sheet
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          // Convert sheet to CSV format, then extract as text
          const sheetData = XLSX.utils.sheet_to_csv(worksheet);
          excelText += `\n--- Sheet: ${sheetName} ---\n${sheetData}\n`;
        });
        
        return excelText;

      // Google Sheets exported as Excel format
      case 'application/x-vnd.oasis.opendocument.spreadsheet':
        const odsWorkbook = XLSX.readFile(filePath);
        let odsText = '';
        
        odsWorkbook.SheetNames.forEach(sheetName => {
          const worksheet = odsWorkbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_csv(worksheet);
          odsText += `\n--- Sheet: ${sheetName} ---\n${sheetData}\n`;
        });
        
        return odsText;

      // CSV files (also used by Google Sheets export)
      case 'text/csv':
        const csvContent = fs.readFileSync(filePath, 'utf8');
        return csvContent;

      default:
        throw new Error(`Unsupported file type: ${fileType}. Supported types: PDF, DOCX, TXT, XLSX, XLS, CSV, ODS`);
    }
  } catch (error) {
    console.error('[fileProcessor + ExtractingText]: Error extracting text:', error);
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
