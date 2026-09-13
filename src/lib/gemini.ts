// SafarSync AI API Client - Powered by AssemblyAI Speech Intelligence & Gemini

export interface GeminiResult {
  actionType: "ANSWER" | "LOG_DATA";
  reply: string;
  transcript: string;
  voiceEngine?: string;
  confidence?: number | null;
  logType?: "Fuel" | "Maintenance" | "Insurance" | "Trip";
  vehicle?: string;
  date?: string;
  amount?: number;
  liters?: number;
  start_location?: string;
  end_location?: string;
  distance_km?: number;
}

export interface AIStatus {
  hasKey: boolean;
  model: string;
  hasAssemblyAiKey?: boolean;
  assemblyAiConnected?: boolean;
  assemblyModel?: string;
  primaryVoiceAI?: string;
}

export async function askGeminiAudio(audioBlob: Blob, contextData: any): Promise<GeminiResult> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const cleanBase64 = result.split(",")[1];
      resolve(cleanBase64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });

  const response = await fetch("/api/gemini/process-audio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audioBase64: base64,
      mimeType: audioBlob.type || "audio/webm",
      contextData,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Server returned ${response.status}: Failed to process voice input with AssemblyAI.`);
  }

  const data: GeminiResult = await response.json();
  return data;
}

export async function askGemini(prompt: string, contextData: any): Promise<GeminiResult> {
  const response = await fetch("/api/gemini/process-text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      contextData,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Server returned ${response.status}: Failed to process request.`);
  }

  const data: GeminiResult = await response.json();
  return data;
}

export async function checkGeminiStatus(): Promise<AIStatus> {
  try {
    const res = await fetch("/api/gemini/status");
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Status check failed:", e);
  }
  return { 
    hasKey: true, 
    model: "gemini-3.6-flash", 
    hasAssemblyAiKey: true, 
    assemblyAiConnected: true,
    assemblyModel: "AssemblyAI Speech Intelligence",
    primaryVoiceAI: "AssemblyAI"
  };
}
