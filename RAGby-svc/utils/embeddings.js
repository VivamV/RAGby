// server/utils/embeddings.js
import fetch from "node-fetch";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
//i dont think we are using this file anywhere but keeping it for reference
export async function generateEmbedding(text){
  if(!GEMINI_API_KEY) {
    // demo fallback: generate deterministic pseudo-vector (not useful for production)
    const hash = Array.from(Buffer.from(text)).slice(0,128).map((v,i)=> (v/255));
    return hash;
  }

  // Example call shape for Google Generative embeddings
  const url = `https://us-central1-aiplatform.googleapis.com/v1/embeddings:generateEmbeddings?key=${GEMINI_API_KEY}`;
  // NOTE: adjust endpoint / payload as per up-to-date Gemini docs
  const payload = {
    model: "models/text-embedding-gecko-001", // example — replace with actual embedding model name
    input: text
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  if(!r.ok) {
    console.error("Embedding error", await r.text());
    throw new Error("Embedding generation failed");
  }
  const j = await r.json();
  // adapt to provider's response shape:
  // suppose j.data[0].embedding exists
  const vector = j.data?.[0]?.embedding || j.embedding || j?.data?.[0]?.embedding;
  return vector;
}
