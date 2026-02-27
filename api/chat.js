import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const knowledgeText = fs.readFileSync(
  path.join(process.cwd(), "data/knowledge.txt"),
  "utf-8"
);

export default async function handler(req, res) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
    });

    const { message } = req.body;

    const prompt = `
Kamu adalah chatbot berbasis knowledge internal.

ATURAN:
- Jawab hanya berdasarkan knowledge.
- Jika tidak ada di knowledge, katakan:
  "Maaf, informasi tidak tersedia dalam knowledge."

=== KNOWLEDGE ===
${knowledgeText}

=== PERTANYAAN ===
${message}
`;

    const result = await model.generateContent(prompt);

    const text =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      result?.response?.text?.() ||
      "Tidak ada respon dari AI.";

    return res.status(200).json({ reply: text });

  } catch (err) {
    console.error("RUNTIME ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}