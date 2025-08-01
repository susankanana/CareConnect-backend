import { Express, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function aiAssistant(app: Express) {
  app.post('https://careconnect-backend-c2he.onrender.com/api/ai-assistant', async (req: Request, res: Response) => {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not set.");
      res.status(500).json({ error: "Server configuration error: Gemini API key is missing." });
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-preview-05-20",
      });

      const chat = model.startChat({ history: [] });

      const result = await chat.sendMessage(message);
      const reply = result.response.text() || "Sorry, I couldn't understand that.";

      res.status(200).json({ reply });
    } catch (err) {
      console.error("Gemini API error:", err);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });
}
