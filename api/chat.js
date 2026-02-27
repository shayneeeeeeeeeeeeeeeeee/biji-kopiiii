import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    console.log("BODY:", req.body);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash",
    });

    const result = await model.generateContent(req.body.message);

    console.log("RAW RESULT:", JSON.stringify(result, null, 2));

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
