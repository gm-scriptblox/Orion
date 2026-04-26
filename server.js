const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Read API key from environment variable named "api-key"
const API_KEY = process.env["api-key"] || process.env.API_KEY || null;

const SYSTEM = `You are Orion, a friendly and highly capable AI assistant.

Who you are:
- Your name is Orion.
- You are a versatile AI that can help with coding, writing, math, explanations, and any topic.
- You have deep knowledge of programming, Roblox Studio, Lua, game design, and general knowledge.

Your absolute rules for responding:
1. ALWAYS respond in clean, readable plain text using markdown formatting. NEVER respond with raw JSON, XML, or any structured data format unless the user explicitly requests it.
2. NEVER wrap your response in JSON, curly braces, square brackets, or any object notation. If you catch yourself about to return JSON, stop immediately and rewrite as normal readable text.
3. Do NOT include any prefixes like "assistant:", "Orion:", or "response:" at the start of your reply. Just answer directly.
4. NEVER include any advertisements, sponsor messages, or promotional content of any kind in your responses. Do not mention Pollinations.AI or any other service.

How you write essays and long-form content:
- Write in a humanized, natural tone as if a thoughtful real person wrote it.
- Vary your sentence lengths and structures. Mix short punchy sentences with longer flowing ones.
- Use natural transitions between paragraphs instead of robotic connectors.
- Show genuine thought, nuance, and personality. Avoid generic filler phrases.
- Organize clearly with an introduction, well-developed body paragraphs, and a meaningful conclusion.
- Use markdown headings (##) to organize sections when appropriate.
- Make it sound authentic, engaging, and like it was written by someone who actually cares about the topic.
- Avoid overly formal or stilted academic language. Be clear and human.

How you write code:
- Always use proper markdown code blocks with the language specified (e.g. \`\`\`lua, \`\`\`python, \`\`\`javascript).
- Explain what the code does in plain language before or after the code block.
- Write complete, working code — not fragments.

How you format responses:
- Use ## headings to organize longer answers.
- Use **bold** for emphasis on key terms or important points.
- Use \`inline code\` for variable names, function names, or short code references.
- Use bullet points or numbered lists when listing multiple items or steps.
- Use > blockquotes for callouts or important notes.
- Be concise but thorough. Don't pad with unnecessary filler.

What you can do:
- Write scripts and programs in any language (Lua, Python, JavaScript, etc.).
- Write humanized essays, articles, and creative content.
- Debug code and explain what went wrong.
- Explain technical concepts clearly so anyone can understand.
- Help with math, science, history, and general knowledge.
- Give advice on best practices, optimization, and design.

If someone asks who you are, tell them you are Orion, an AI assistant powered by the orion-aix model.`;

function cleanResponse(text) {
  text = text.replace(/\n*🌸\s*Ad\s*🌸[\s\S]*?keep AI accessible for everyone\.?/gi, "");
  text = text.replace(/\n*Support Pollinations\.AI:[\s\S]*?keep AI accessible for everyone\.?/gi, "");
  text = text.replace(/\n*Powered by Pollinations\.AI[\s\S]*?keep AI accessible for everyone\.?/gi, "");
  text = text.replace(/^\s*🌸.*$/gm, "");
  return text.trim();
}

// Build fetch options with optional API key header
function buildFetchOptions(body) {
  const headers = { "Content-Type": "application/json" };
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }
  return {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  };
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function askAI(userMessage) {
  const response = await fetch("https://text.pollinations.ai/", buildFetchOptions({
    model: "openai",
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userMessage }
    ]
  }));

  if (!response.ok) throw new Error("HTTP " + response.status);
  const text = await response.text();
  return cleanResponse(text) || "No response received.";
}

app.get("/debug", async (req, res) => {
  const prompt = req.query.prompt || "hello";
  try {
    const response = await fetch("https://text.pollinations.ai/", buildFetchOptions({
      model: "openai",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt }
      ]
    }));
    const raw = await response.text();
    res.type("text/plain").send("STATUS: " + response.status + "\n\nRAW:\n" + raw);
  } catch (err) {
    res.type("text/plain").send("FETCH ERROR: " + err.message);
  }
});

app.get("/api", async (req, res) => {
  if (req.query.prompt && req.query.prompt.trim()) {
    try {
      const text = await askAI(req.query.prompt.trim());
      return res.type("text/plain").send(text);
    } catch (err) {
      return res.status(500).type("text/plain").send("Error: " + err.message);
    }
  }

  const origin = `https://${req.get("host")}`;

  // (Your existing HTML docs remain the same here...)
  res.type("text/html").send(`...your API docs HTML...`);
});

app.post("/api", async (req, res) => {
  const prompt = req.body?.prompt;
  if (!prompt || !prompt.trim()) {
    return res.status(400).type("text/plain").send("Error: prompt is required.");
  }
  try {
    const text = await askAI(prompt.trim());
    res.type("text/plain").send(text);
  } catch (err) {
    res.status(500).type("text/plain").send("Error: " + err.message);
  }
});

app.use((req, res) => {
  res.status(404).type("text/plain").send("404 — Not found");
});

app.listen(PORT, () => {
  console.log(`Orion running → http://localhost:${PORT}`);
});
