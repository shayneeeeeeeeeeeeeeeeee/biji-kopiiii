require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // untuk load h  tml

// ==============================
// Load Knowledge TXT
// ==============================
const knowledgeText = fs.readFileSync("./data/knowledge.txt", "utf-8");

// ==============================
// Setup Gemini
// ==============================
if (!process.env.GEMINI_API_KEY) {
  console.error("API key tidak ditemukan.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "models/gemini-2.5-flash",
});

// ==============================
// Memory
// ==============================
let conversationHistory = [];

// ==============================
// Build Prompt
// ==============================
function buildPrompt(question) {
  const historyText = conversationHistory
    .map((msg) => `${msg.role}: ${msg.text}`)
    .join("\n");

  return `
Kamu adalah chatbot berbasis knowledge internal.

ATURAN:
- Jawab hanya berdasarkan knowledge.
- Jika tidak ada di knowledge, katakan:
  "Maaf, informasi tidak tersedia dalam knowledge."
- Jika ada yang bertanya kamu siapa, katakan:
  "Saya adalah BeanMind AI, tanyalah saya tentang biji kopi!"
- Jika disapa, katakan:
  "Halo, Selamat datang! Tanya saya tentang biji Kopi!"
- Setiap akhir pesan, kasih tawaran untuk beri informasi knowledge yang user belum tanya
- Sebutan yang dia panggil, pakai itu untuk balas ke user
- Jika dia menunjukan perasaan melalui kata-kata, maka balas dengan perasaan itu dalam kata-kata juga
- Jawab pertanyaan user dengan jawaban yang penting-penting saja, lalu tawarkan untuk di jelaskan dgn detail.

=== KNOWLEDGE ===
${knowledgeText}

=== PERCAKAPAN ===
${historyText}

=== PERTANYAAN ===
${question}
`;
}

// ==============================
// API Endpoint
// ==============================
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "Message kosong." });
    }

    const prompt = buildPrompt(userMessage);

    const result = await model.generateContent(prompt);

    console.log("RAW RESULT:", JSON.stringify(result, null, 2));

    // Cara aman ambil text (support Gemini terbaru)
    const responseText =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      result?.response?.text?.() ||
      "Maaf, tidak ada respon dari AI.";

    conversationHistory.push({ role: "User", text: userMessage });
    conversationHistory.push({ role: "Bot", text: responseText });

    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }

    res.json({ reply: responseText });

  } catch (error) {
    console.error("ERROR GEMINI:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
});

// ==============================
// Run Server
// ==============================
app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
}); 
