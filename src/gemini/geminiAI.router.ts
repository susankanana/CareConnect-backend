import { Express, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch'; // only if needed in older Node environments

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export default function aiAssistant(app: Express): void {
  // POST: Chat endpoint
  app.post('/api/ai-assistant', (req: Request, res: Response): void => {
    (async () => {
      const { message } = req.body;

      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ reply: text });
      } catch (err: any) {
          console.error("Gemini API error:", err?.response?.data || err.message || err);
          res.status(500).json({ error: "Failed to get AI response" });
        }
      
    })();
  });

  // GET: Model listing endpoint
  app.get('/api/ai-models', (_req: Request, res: Response): void => {
  (async () => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch models:", errorText);
        res.status(response.status).json({ error: errorText });
        return;
      }

      type ModelListResponse = {
        models: {
          name: string;
          displayName?: string;
          description?: string;
        }[];
      };

      const data = await response.json() as ModelListResponse;
      res.status(200).json({ models: data.models });
    } catch (error) {
      console.error("Error fetching model list:", error);
      res.status(500).json({ error: "Failed to fetch model list" });
    }
  })();
  });

}
