import { Express } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const aiAssistant = (app: Express) => {
  app.route("/api/ai-assistant").post(async (req, res) => {
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

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      // Get the generative model
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-preview-05-20",
      });

      // In Gemini API, the system instructions are passed separately, and the chat history is an array of parts.
      const chat = model.startChat({
        // This is where you put your system instructions.
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: "You're an assistant for a hospital management app. Guide users through using the app. Give clear, friendly instructions and avoid mentioning admin-only routes if the user is a patient.",
            },
          ],
        },
        // The history is an array of turns, but for a single-turn request, we can just pass the user's message.
        history: [{ role: "user", parts: [{ text: message }] }],
      });

      // Call the generative model to generate content.
      // The `sendMessage` method is used for chat.
      const result = await chat.sendMessage(message);

      // Extract the text content from the response.
      const reply =
        result.response.text() || "Sorry, I couldn't understand that.";

      res.status(200).json({ reply });
    } catch (err) {
      console.error("Gemini API error:", err);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });
};

export default aiAssistant;
