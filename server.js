const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env["api-key"]; // Read from environment variable

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

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Middleware to check API key if set
function checkApiKey(req, res, next) {
  // If no API_KEY is set in environment, allow all requests
  if (!API_KEY) {
    return next();
  }

  // Check for API key in header or query parameter
  const providedKey = req.headers["x-api-key"] || req.query.apiKey;
  
  if (providedKey === API_KEY) {
    return next();
  }

  return res.status(401).type("text/plain").send("Error: Invalid or missing API key.");
}

async function askAI(userMessage) {
  const response = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userMessage }
      ]
    })
  });

  if (!response.ok) throw new Error("HTTP " + response.status);
  const text = await response.text();
  return cleanResponse(text) || "No response received.";
}

app.get("/debug", checkApiKey, async (req, res) => {
  const prompt = req.query.prompt || "hello";
  try {
    const response = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt }
        ]
      })
    });
    const raw = await response.text();
    res.type("text/plain").send("STATUS: " + response.status + "\n\nRAW:\n" + raw);
  } catch (err) {
    res.type("text/plain").send("FETCH ERROR: " + err.message);
  }
});

app.get("/api", checkApiKey, async (req, res) => {
  if (req.query.prompt && req.query.prompt.trim()) {
    try {
      const text = await askAI(req.query.prompt.trim());
      return res.type("text/plain").send(text);
    } catch (err) {
      return res.status(500).type("text/plain").send("Error: " + err.message);
    }
  }

  const origin = `https://${req.get("host")}`;
  const authSection = API_KEY ? `
  <div class="section-label">Authentication</div>
  <div class="about-card" style="border-left-color:#8b6cf6">
    <p>
      <strong>API Key Required:</strong> This API requires authentication. Include your API key in one of two ways:
      <br><br>
      <strong>Header:</strong> <code style="background:#1e1e1e;padding:2px 6px;border-radius:4px;font-family:'Fira Code',monospace;color:#10a37f">X-API-Key: YOUR_API_KEY</code>
      <br>
      <strong>Query Param:</strong> <code style="background:#1e1e1e;padding:2px 6px;border-radius:4px;font-family:'Fira Code',monospace;color:#10a37f">?apiKey=YOUR_API_KEY</code>
    </p>
  </div>` : `
  <div class="about-card" style="border-left-color:#10a37f">
    <p>
      <strong>No Authentication Required:</strong> This API is completely free and open. No API key needed!
    </p>
  </div>`;

  const curlExample = API_KEY ? `curl "${origin}/api?prompt=Who+are+you" \\
  -H "X-API-Key: YOUR_API_KEY"

curl -X POST "${origin}/api" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"prompt":"Write a hello world script in Lua"}'` : `curl "${origin}/api?prompt=Who+are+you"

curl -X POST "${origin}/api" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Write a hello world script in Lua"}'`;

  const jsExample = API_KEY ? `const res = await fetch("${origin}/api?prompt=Explain+RemoteEvents", {
  headers: { "X-API-Key": "YOUR_API_KEY" }
});
const text = await res.text();
console.log(text);

const res2 = await fetch("${origin}/api", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY"
  },
  body: JSON.stringify({ prompt: "Write a Lua function" })
});
const text2 = await res2.text();
console.log(text2);` : `const res = await fetch("${origin}/api?prompt=Explain+RemoteEvents");
const text = await res.text();
console.log(text);

const res2 = await fetch("${origin}/api", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "Write a Lua function" })
});
const text2 = await res2.text();
console.log(text2);`;

  const pythonExample = API_KEY ? `import requests

headers = {"X-API-Key": "YOUR_API_KEY"}

r = requests.get("${origin}/api", params={"prompt": "Who are you?"}, headers=headers)
print(r.text)

r = requests.post("${origin}/api", json={"prompt": "Explain datastores"}, headers=headers)
print(r.text)` : `import requests

r = requests.get("${origin}/api", params={"prompt": "Who are you?"})
print(r.text)

r = requests.post("${origin}/api", json={"prompt": "Explain datastores"})
print(r.text)`;

  res.type("text/html").send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Orion — API Docs</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#212121;color:#ececec;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;min-height:100vh;padding:0;-webkit-font-smoothing:antialiased}
  .page-wrap{max-width:800px;margin:0 auto;padding:48px 28px 64px}
  .back-btn{display:inline-flex;align-items:center;gap:6px;font-size:.82rem;color:#8e8e8e;border:1px solid #444;padding:7px 16px;border-radius:8px;text-decoration:none;transition:all .15s;margin-bottom:32px;font-family:'Inter',sans-serif;}
  .back-btn:hover{color:#ececec;border-color:#666;background:#2f2f2f}
  .back-btn svg{width:14px;height:14px}
  .hero{display:flex;align-items:center;gap:16px;margin-bottom:8px}
  .hero-logo{width:40px;height:40px;flex-shrink:0}
  .hero-logo svg{width:40px;height:40px;animation:spin 8s linear infinite;filter:drop-shadow(0 0 6px rgba(255,255,255,0.2))}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  .hero-title{font-size:1.8rem;font-weight:700;color:#fff}
  .hero-sub{font-size:.82rem;color:#8e8e8e;margin-bottom:40px;margin-top:4px}
  .section-label{font-size:.7rem;font-weight:600;color:#10a37f;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;margin-top:36px;}
  .section-label:first-of-type{margin-top:0}
  .endpoint-card{background:#2f2f2f;border:1px solid #444;border-radius:10px;overflow:hidden;margin-bottom:12px;}
  .endpoint-header{display:flex;align-items:center;gap:10px;padding:12px 18px;border-bottom:1px solid #3a3a3a;}
  .method-badge{padding:3px 10px;border-radius:5px;font-size:.68rem;font-weight:700;flex-shrink:0;font-family:'Fira Code',monospace;}
  .method-get{background:rgba(16,163,127,0.15);color:#10a37f;border:1px solid rgba(16,163,127,0.3)}
  .method-post{background:rgba(84,54,218,0.15);color:#8b6cf6;border:1px solid rgba(84,54,218,0.3)}
  .endpoint-url{font-size:.82rem;color:#ececec;word-break:break-all;font-family:'Fira Code',monospace;}
  .endpoint-url span{color:#10a37f}
  .endpoint-body{padding:14px 18px;font-size:.82rem;color:#b4b4b4;line-height:1.7}
  .endpoint-body strong{color:#ececec}
  .code-block{background:#1e1e1e;border:1px solid #3a3a3a;border-radius:8px;overflow:hidden;margin-bottom:12px;}
  .code-block-head{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#2b2b2b;border-bottom:1px solid #3a3a3a;}
  .code-block-lang{font-size:.7rem;color:#8e8e8e;font-family:'Fira Code',monospace}
  .code-copy{display:flex;align-items:center;gap:4px;background:none;border:none;color:#8e8e8e;font-family:'Inter',sans-serif;font-size:.7rem;cursor:pointer;padding:3px 8px;border-radius:4px;transition:all .15s;}
  .code-copy:hover{color:#ececec;background:rgba(255,255,255,0.08)}
  .code-copy svg{width:13px;height:13px}
  .code-copy.copied{color:#10a37f}
  .code-block pre{margin:0;padding:16px 18px;overflow-x:auto;font-family:'Fira Code',monospace;font-size:.8rem;color:#abb2bf;line-height:1.65;white-space:pre;}
  .code-block pre::-webkit-scrollbar{height:4px}
  .code-block pre::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:4px}
  .try-link{display:block;padding:11px 18px;background:#2f2f2f;border:1px solid #444;border-radius:8px;color:#10a37f;font-size:.8rem;text-decoration:none;word-break:break-all;transition:all .15s;margin-bottom:8px;font-family:'Fira Code',monospace;}
  .try-link:hover{border-color:#10a37f;color:#34d399;background:#2a2f2a}
  .about-card{background:#2f2f2f;border:1px solid #444;border-left:3px solid #10a37f;border-radius:8px;padding:20px 22px;margin-top:12px;}
  .about-card p{margin:0;color:#b4b4b4;font-size:.84rem;line-height:1.9}
  .about-card strong{color:#ececec}
  .about-card a{color:#10a37f;text-decoration:none}
  .about-card a:hover{text-decoration:underline}
  .tag{display:inline-block;padding:3px 10px;background:rgba(16,163,127,0.1);border:1px solid rgba(16,163,127,0.25);border-radius:5px;color:#10a37f;font-size:.7rem;margin:3px 2px;}
  .divider{border:none;border-top:1px solid #3a3a3a;margin:28px 0}
  .model-badge{display:inline-block;padding:4px 12px;background:rgba(16,163,127,0.1);border:1px solid rgba(16,163,127,0.3);border-radius:20px;color:#10a37f;font-size:.72rem;font-family:'Fira Code',monospace;margin-top:6px;}
</style>
</head>
<body>
<div class="page-wrap">
  <a class="back-btn" href="${origin}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    Back to Orion
  </a>
  <div class="hero">
    <div class="hero-logo">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="18" cy="18" r="16" stroke="#fff" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.6"/>
        <circle cx="18" cy="18" r="9" stroke="#fff" stroke-width="1.5"/>
        <circle cx="18" cy="2" r="2.5" fill="#fff"/>
        <circle cx="18" cy="18" r="3" fill="#fff" opacity="0.9"/>
      </svg>
    </div>
    <div>
      <div class="hero-title">Orion API</div>
      <div class="model-badge">orion-aix model</div>
    </div>
  </div>
  <div class="hero-sub">Free AI API — plain text responses${API_KEY ? ', API key required' : ', no authentication required'}.</div>
  ${authSection}
  <div class="section-label">Endpoints</div>
  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method-badge method-get">GET</span>
      <span class="endpoint-url">${origin}/api?prompt=<span>{your prompt}</span></span>
    </div>
    <div class="endpoint-body">Returns <strong>raw plain text</strong>. Pass your prompt as a query parameter.</div>
  </div>
  <div class="endpoint-card">
    <div class="endpoint-header">
      <span class="method-badge method-post">POST</span>
      <span class="endpoint-url">${origin}/api</span>
    </div>
    <div class="endpoint-body">Send a JSON body with <strong>{ "prompt": "..." }</strong> — returns <strong>raw plain text</strong>.</div>
  </div>
  <div class="section-label">cURL Examples</div>
  <div class="code-block">
    <div class="code-block-head">
      <span class="code-block-lang">bash</span>
      <button class="code-copy" onclick="copyCode(this)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy
      </button>
    </div>
    <pre>${curlExample}</pre>
  </div>
  <div class="section-label">JavaScript</div>
  <div class="code-block">
    <div class="code-block-head">
      <span class="code-block-lang">javascript</span>
      <button class="code-copy" onclick="copyCode(this)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy
      </button>
    </div>
    <pre>${jsExample}</pre>
  </div>
  <div class="section-label">Python</div>
  <div class="code-block">
    <div class="code-block-head">
      <span class="code-block-lang">python</span>
      <button class="code-copy" onclick="copyCode(this)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        Copy
      </button>
    </div>
    <pre>${pythonExample}</pre>
  </div>
  <div class="section-label">Try It Live</div>
  <a class="try-link" href="${origin}/api?prompt=Who+are+you">${origin}/api?prompt=Who+are+you</a>
  <a class="try-link" href="${origin}/api?prompt=Write+a+hello+world+script+in+Lua">${origin}/api?prompt=Write+a+hello+world+script+in+Lua</a>
  <a class="try-link" href="${origin}/api?prompt=Explain+how+RemoteEvents+work">${origin}/api?prompt=Explain+how+RemoteEvents+work</a>
  <a class="try-link" href="${origin}/api?prompt=What+is+2+%2B+2">${origin}/api?prompt=What+is+2+%2B+2</a>
  <hr class="divider">
  <div class="section-label">About Orion</div>
  <div class="about-card">
    <p>
      <strong>Orion</strong> is a versatile AI assistant powered by the <strong>orion-aix model</strong>. It can help with coding, writing, debugging, math, and much more. Responds in clean plain text with markdown formatting — never JSON.
      <br><br>
      <span class="tag">Write code</span>
      <span class="tag">Debug scripts</span>
      <span class="tag">Write essays</span>
      <span class="tag">Explain concepts</span>
      <span class="tag">Solve math</span>
      <span class="tag">Answer anything</span>
      <br><br>
      Chat interface → <a href="${origin}">${origin}</a>
    </p>
  </div>
</div>
<script>
function copyCode(btn){
  const pre = btn.closest('.code-block').querySelector('pre');
  navigator.clipboard.writeText(pre.textContent).then(()=>{
    btn.classList.add('copied');
    btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
    setTimeout(()=>{
      btn.classList.remove('copied');
      btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
    },2000);
  });
}
</script>
</body>
</html>`);
});

app.post("/api", checkApiKey, async (req, res) => {
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
  if (API_KEY) {
    console.log(`API Key authentication: ENABLED`);
  } else {
    console.log(`API Key authentication: DISABLED (no api-key environment variable set)`);
  }
});
