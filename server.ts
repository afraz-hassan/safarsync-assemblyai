import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { AssemblyAI } from "assemblyai";
import dotenv from "dotenv";

dotenv.config();

const __filename_compat = typeof __filename !== "undefined" ? __filename : "";
const appDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

const app = express();
const PORT = 3000;

// Support large audio base64 payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper to resolve AssemblyAI API Key
function getResolvedAssemblyKey(): string {
  let key = process.env.ASSEMBLYAI_API_KEY || process.env.VITE_ASSEMBLYAI_API_KEY;
  if (!key) {
    try {
      if (fs.existsSync(".env.example")) {
        const content = fs.readFileSync(".env.example", "utf8");
        const match = content.match(/ASSEMBLYAI_API_KEY=["']?([^"'\r\n]+)/);
        if (match) {
          key = match[1].trim();
        }
      }
    } catch (e) {
      console.warn("Could not read .env.example fallback for AssemblyAI:", e);
    }
  }
  return key || "";
}

// Lazy AssemblyAI client
let _assemblyAI: AssemblyAI | null = null;
function getAssemblyAI(): AssemblyAI | null {
  const key = getResolvedAssemblyKey();
  if (!key) return null;
  if (!_assemblyAI) {
    _assemblyAI = new AssemblyAI({ apiKey: key });
  }
  return _assemblyAI;
}

// Helper to resolve Gemini API Key
function getResolvedApiKey(): string {
  let key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key || key.includes("MY_GEMINI_API_KEY")) {
    try {
      if (fs.existsSync(".env.example")) {
        const content = fs.readFileSync(".env.example", "utf8");
        const match = content.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
        if (match && !match[1].includes("MY_GEMINI_API_KEY")) {
          key = match[1].trim();
        }
      }
    } catch (e) {
      console.warn("Could not read .env.example fallback:", e);
    }
  }
  return key || "";
}

// Lazy GenAI client
let _genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const key = getResolvedApiKey();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  if (!_genAI) {
    _genAI = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return _genAI;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// System AI Status endpoint
app.get("/api/gemini/status", (req, res) => {
  const aaiKey = getResolvedAssemblyKey();
  const geminiKey = getResolvedApiKey();
  res.json({
    hasKey: Boolean(geminiKey && !geminiKey.includes("MY_GEMINI_API_KEY")),
    model: "gemini-3.6-flash",
    hasAssemblyAiKey: Boolean(aaiKey),
    assemblyAiConnected: Boolean(aaiKey),
    assemblyModel: "AssemblyAI Speech Intelligence",
    primaryVoiceAI: "AssemblyAI",
  });
});

app.get("/api/ai/status", (req, res) => {
  const aaiKey = getResolvedAssemblyKey();
  const geminiKey = getResolvedApiKey();
  res.json({
    assemblyAi: {
      hasKey: Boolean(aaiKey),
      connected: Boolean(aaiKey),
      model: "AssemblyAI Universal-3 Speech Intelligence",
      role: "Primary Voice Input & Transcription AI",
    },
    gemini: {
      hasKey: Boolean(geminiKey && !geminiKey.includes("MY_GEMINI_API_KEY")),
      connected: true,
      model: "gemini-3.6-flash",
      role: "Multi-Modal Reasoning & Schema Extraction",
    },
  });
});

const SYSTEM_INSTRUCTION = `
You are SafarSync AI, an intelligent vehicle and fleet management assistant built for the AssemblyAI Hackathon.
Analyze the transcribed speech or text input in the context of the user's vehicles, expenses, and trips.

Determine if the user is asking a question/seeking advice OR logging an expense or trip.

If asking a question or conversational query:
- actionType: "ANSWER"
- reply: A helpful, natural, and concise answer based on their fleet/vehicle context.

If logging data (e.g., fuel expense, maintenance bill, insurance payment, or trip distance):
- actionType: "LOG_DATA"
- logType: "Fuel" | "Maintenance" | "Insurance" | "Trip"
- vehicle: string (Try to match a vehicle from context by make/model/plate, e.g., "Corolla")
- date: string (If mentioned in past, return "YYYY-MM-DD HH:mm", otherwise leave empty)
- amount: number (cost in PKR, or 0 if not applicable)
- liters: number (volume of fuel in liters if Fuel, else 0)
- start_location: string (origin city or location if Trip)
- end_location: string (destination city or location if Trip)
- distance_km: number (trip distance in km if Trip)
- reply: A friendly conversational confirmation of what was recorded.

Also return the 'transcript' representing the transcribed text of what the user said.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    actionType: { type: Type.STRING, enum: ["ANSWER", "LOG_DATA"] },
    logType: { type: Type.STRING, enum: ["Fuel", "Maintenance", "Insurance", "Trip"] },
    vehicle: { type: Type.STRING, description: "Identified vehicle from context" },
    date: { type: Type.STRING, description: "YYYY-MM-DD HH:mm format if specified" },
    amount: { type: Type.NUMBER },
    liters: { type: Type.NUMBER },
    start_location: { type: Type.STRING },
    end_location: { type: Type.STRING },
    distance_km: { type: Type.NUMBER },
    reply: { type: Type.STRING },
    transcript: { type: Type.STRING, description: "Transcription of user input" },
  },
  required: ["actionType", "reply", "transcript"],
};

// Process Audio Route - AssemblyAI as PRIMARY Voice Input AI
app.post("/api/gemini/process-audio", async (req, res) => {
  try {
    const { audioBase64, mimeType, contextData } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "Missing audioBase64 in request body." });
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");
    const aai = getAssemblyAI();
    let transcriptText = "";
    let confidence: number | null = null;
    let voiceEngine = "AssemblyAI";

    // 1. PRIMARY: Transcribe using AssemblyAI Speech-to-Text
    if (aai) {
      try {
        console.log("[AssemblyAI] Transcribing user voice input...");
        const aaiResult = await aai.transcripts.transcribe({
          audio: audioBuffer,
          word_boost: [
            "rupees", "petrol", "diesel", "liters", "maintenance", "insurance",
            "oil change", "brakes", "filter", "battery", "tyre", "tire",
            "Lahore", "Karachi", "Islamabad", "Faisalabad", "Rawalpindi",
            "Peshawar", "Multan", "Gujranwala", "Sialkot", "Corolla", "Civic",
            "Alto", "Mehran", "PKR", "SafarSync", "litres"
          ],
          boost_param: "high",
        });

        if (aaiResult.status === "completed") {
          transcriptText = (aaiResult.text || "").trim();
          confidence = aaiResult.confidence ?? null;
          console.log("[AssemblyAI] Voice transcribed successfully:", transcriptText);
        } else if (aaiResult.status === "error") {
          console.warn("[AssemblyAI] Transcription returned error:", aaiResult.error);
        }
      } catch (aaiErr) {
        console.warn("[AssemblyAI] Failed during transcription call:", aaiErr);
      }
    }

    // If AssemblyAI returned completely silent / empty audio
    if (aai && !transcriptText) {
      return res.json({
        actionType: "ANSWER",
        reply: "AssemblyAI didn't detect any spoken words in the audio. Please tap the microphone and speak your vehicle expense or trip command.",
        transcript: "",
        voiceEngine: "AssemblyAI",
        confidence: null,
      });
    }

    // 2. INTELLIGENCE & REASONING: Use Gemini to parse the AssemblyAI transcript into structured data
    const ai = getGenAI();
    const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.8-flash"];
    let lastError: any = null;

    // If AssemblyAI successfully transcribed
    if (transcriptText) {
      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `User spoken command (Transcribed by AssemblyAI): "${transcriptText}"\n\nCurrent App Context (Vehicles, Expenses, Trips):\n${JSON.stringify(contextData || {})}`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
            },
          });

          const text = response.text;
          if (!text) throw new Error("Empty response from reasoning model.");
          const parsed = JSON.parse(text);
          parsed.transcript = transcriptText;
          parsed.voiceEngine = "AssemblyAI";
          parsed.confidence = confidence;
          return res.json(parsed);
        } catch (err: any) {
          console.warn(`Reasoning attempt with model ${model} failed:`, err?.message || err);
          lastError = err;
        }
      }
    } else {
      // Direct Multi-Modal fallback if AssemblyAI transcription was unavailable
      console.log("[Fallback] Utilizing multi-modal audio analysis as secondary backup...");
      const cleanMime = (mimeType || "audio/webm").split(";")[0];
      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      data: audioBase64,
                      mimeType: cleanMime,
                    },
                  },
                  {
                    text: `\nCurrent App Context (Vehicles, Expenses, Trips):\n${JSON.stringify(contextData || {})}`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
            },
          });

          const text = response.text;
          if (!text) throw new Error("Empty response from Gemini.");
          const parsed = JSON.parse(text);
          parsed.voiceEngine = "Gemini Multi-modal Fallback";
          return res.json(parsed);
        } catch (err: any) {
          console.warn(`Fallback attempt with model ${model} failed:`, err?.message || err);
          lastError = err;
        }
      }
    }

    throw lastError || new Error("Failed to process voice input.");
  } catch (err: any) {
    console.error("Audio processing API error:", err);
    res.status(500).json({
      error: err?.message || "Failed to process audio with AssemblyAI",
    });
  }
});

// Process Text Route
app.post("/api/gemini/process-text", async (req, res) => {
  try {
    const { prompt, contextData } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt in request body." });
    }

    const ai = getGenAI();
    const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.8-flash"];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `User input: "${prompt}"\n\nCurrent App Context (Vehicles, Expenses, Trips):\n${JSON.stringify(contextData || {})}`,
                },
              ],
            },
          ],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        });

        const text = response.text;
        if (!text) throw new Error("Empty response from Gemini.");
        const parsed = JSON.parse(text);
        if (!parsed.transcript) {
          parsed.transcript = prompt;
        }
        parsed.voiceEngine = "Text Engine";
        return res.json(parsed);
      } catch (err: any) {
        console.warn(`Text attempt with model ${model} failed:`, err?.message || err);
        lastError = err;
      }
    }

    throw lastError || new Error("Failed to process text with Gemini.");
  } catch (err: any) {
    console.error("Text processing API error:", err);
    res.status(500).json({
      error: err?.message || "Failed to process text",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
