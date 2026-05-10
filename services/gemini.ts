import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIInsights {
  summary: string;
  suggestedReply: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  priority: 'low' | 'medium' | 'high';
}

export async function getLeadInsights(leadData: { name: string; email: string; source: string; notes?: string[] }): Promise<AIInsights> {
  const prompt = `Analyze this business lead and provide insights:
    Name: ${leadData.name}
    Source: ${leadData.source}
    Email: ${leadData.email}
    Recent Notes: ${leadData.notes?.join('; ') || 'No notes available'}
    
    Provide a professional summary of the situation, a suggested personalized follow-up message, and categorize the sentiment and priority.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "A brief summary of the lead's status and context." },
          suggestedReply: { type: Type.STRING, description: "A highly personalized follow-up email or message suggestion." },
          sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
          priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
        },
        required: ["summary", "suggestedReply", "sentiment", "priority"]
      }
    }
  });

  return JSON.parse(response.text);
}
