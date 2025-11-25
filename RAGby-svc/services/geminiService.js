import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.apiKey = null;
  }

  initializeIfNeeded() {
    if (!this.genAI) {
      this.apiKey = process.env.GEMINI_API_KEY;
      console.log('Gemini API Key loaded:', this.apiKey ? `${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}` : 'NOT FOUND');
      
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }
      
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  // Direct REST API call as fallback
  

  async generateResponse(prompt, context = "", systemPrompt = "") {
    try {
      this.initializeIfNeeded();
      
      // Construct the full prompt with system instructions and context
      let fullPrompt = "";
      
      if (systemPrompt) {
        fullPrompt += `System Instructions: ${systemPrompt}

`;
      }
      
      if (context) {
        fullPrompt += `Context from documents:
${context}

`;
      }
      
      fullPrompt += `User Question: ${prompt}`;

      // Use the working approach from your other project
      const modelNames = [
        "models/gemini-2.5-flash",
        "models/gemini-2.5-pro",
        "models/gemini-2.0-flash",
        "models/gemini-flash-latest",
        "models/gemini-pro-latest",
        "models/gemini-1.5-flash",
        "models/gemini-1.5-pro",
        "models/gemini-pro"
      ];
      
      for (const modelName of modelNames) {
        try {
          console.log(`Trying model: ${modelName}`);
          const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`;
          const response = await fetch(`${url}?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }]
            })
          });

          if (!response.ok) {
            console.log(`Model ${modelName} failed: HTTP ${response.status}`);
            continue;
          }

          const data = await response.json();
          console.log(`Successfully used model: ${modelName}`);
          return data.candidates[0].content.parts[0].text;
        } catch (error) {
          console.log(`Model ${modelName} failed:`, error.message);
          continue;
        }
      }

      throw new Error('All Gemini models failed to generate response');
    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error('Failed to generate AI response');
    }
  }
//if you dont give any name to your chat session, generate one based on messages
  async generateTitle(messages) {
    try {
      this.initializeIfNeeded();
      
      const lastUserMessage = messages.find(msg => msg.role === 'user')?.content || 'New Chat';
      const prompt = `Generate a short, descriptive title (max 4 words) for this conversation: "${lastUserMessage}"`;
      
      // Use the same working approach for title generation
      const modelNames = [
        "models/gemini-2.5-flash",
        "models/gemini-2.5-pro",
        "models/gemini-2.0-flash",
        "models/gemini-flash-latest",
        "models/gemini-pro-latest"
      ];
      
      for (const modelName of modelNames) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`;
          const response = await fetch(`${url}?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });

          if (!response.ok) {
            continue;
          }

          const data = await response.json();
          return data.candidates[0].content.parts[0].text.replace(/['"]/g, '').trim();
        } catch (error) {
          continue;
        }
      }

      return 'New Chat';
    } catch (error) {
      console.error('Error generating title:', error);
      return 'New Chat';
    }
  }
}

export default new GeminiService();
