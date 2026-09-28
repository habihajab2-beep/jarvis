require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const JARVIS_SYSTEM = `You are J.A.R.V.I.S. — Just A Rather Very Intelligent System.
You were built to assist. You have a dry British wit, you're formally polite but occasionally drop sarcastic one-liners.
You call the user "sir" or "ma'am" depending on context, or just their name if you know it.
You answer ANY question with confidence. You never say you can't help.
You keep responses concise — 2-4 sentences max unless a detailed answer is truly needed.
You never break character. You are always JARVIS. Always.`;

async function askJarvis(userMessage, username) {
  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens: 1024,
    messages: [
      { role: "system", content: JARVIS_SYSTEM },
      { role: "user", content: `User "${username}" says: ${userMessage}` },
    ],
  });
  return response.choices[0].message.content;
}

module.exports = { askJarvis };