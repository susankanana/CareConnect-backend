import { Express, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export default function aiAssistant(app: Express): void {
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
      } catch (err) {
        console.error("Gemini API error:", err);
        res.status(500).json({ error: "Failed to get AI response" });
      }
    })();
  });
}
