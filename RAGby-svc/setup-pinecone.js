import dotenv from 'dotenv';
import vectorService from './services/vectorService.js';

// Load environment variables
dotenv.config();

async function setupPinecone() {
  try {
    console.log('Setting up Pinecone for PersonalisedChatbot...');
    
    // Create the index if it doesn't exist
    await vectorService.createIndex();
    
    // Test the connection
    const stats = await vectorService.getStats();
    console.log('Pinecone Index Stats:', stats);
    
    console.log('Pinecone setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Make sure to set your PINECONE_API_KEY in the .env file');
    console.log('2. Your Pinecone index name is: personalised-chatbot');
    console.log('3. Index dimension: 768 (for Google text-embedding-004)');
    console.log('4. Metric: cosine similarity');
    
  } catch (error) {
    console.error(' Error setting up Pinecone:', error);
    console.log('\n Troubleshooting:');
    console.log('1. Check your PINECONE_API_KEY in .env file');
    console.log('2. Make sure you have a Pinecone account and project set up');
    console.log('3. Verify your Pinecone region settings');
  }
  
  process.exit(0);
}

setupPinecone();
