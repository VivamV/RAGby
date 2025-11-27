import dotenv from 'dotenv';
import vectorService from './services/vectorService.js';

dotenv.config();

async function setupPinecone() {
  try {
    console.log('Setting up Pinecone for PersonalisedChatbot...');
    
    // Create the index if it doesn't exist
    await vectorService.createIndex();
    
    // Test the connection
    const stats = await vectorService.getStats();
   
  } catch (error) {
    console.error(' Error setting up Pinecone:', error);
  }
  
  process.exit(0);
}

setupPinecone();
