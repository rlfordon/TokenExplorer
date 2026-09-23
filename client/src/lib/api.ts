import { PROXY_URL } from "./config";
import type { GenerateRequest, GenerateResponse, TokenProbability } from "./types";

const PASSKEY_STORAGE_KEY = "token-explorer-passkey";

export function getStoredPasskey(): string {
  try {
    return localStorage.getItem(PASSKEY_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function storePasskey(passkey: string | null) {
  try {
    if (passkey) localStorage.setItem(PASSKEY_STORAGE_KEY, passkey);
    else localStorage.removeItem(PASSKEY_STORAGE_KEY);
  } catch {
    // Storage blocked (private window etc.); the user just re-enters the passkey next visit.
  }
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    const err = data?.error;
    return (typeof err === "string" ? err : err?.message) || data?.message || `${fallback} (${res.status})`;
  } catch {
    return `${fallback} (${res.status})`;
  }
}

// Whether the worker requires a class passkey.
export async function checkHealth(): Promise<{ passkeyRequired: boolean }> {
  const res = await fetch(`${PROXY_URL}/health`);
  if (!res.ok) throw new Error(await errorMessage(res, "Could not reach the API proxy"));
  return res.json();
}

export async function verifyPasskey(passkey: string): Promise<void> {
  const res = await fetch(`${PROXY_URL}/verify`, {
    method: "POST",
    headers: { "X-Class-Passkey": passkey },
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Invalid passkey"));
}

type OpenRouterLogprob = { token: string; logprob: number; top_logprobs?: { token: string; logprob: number }[] };

export async function generate(req: GenerateRequest): Promise<GenerateResponse> {
  const startTime = Date.now();
  const res = await fetch(`${PROXY_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Class-Passkey": getStoredPasskey() },
    body: JSON.stringify({
      model: req.model,
      messages: [{ role: "user", content: req.prompt }],
      temperature: req.temperature,
      max_tokens: req.maxTokens,
      top_logprobs: 5,
    }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Request failed"));
  const data = await res.json();
  if (data?.error) throw new Error(data.error.message || "Request failed");

  const choice = data?.choices?.[0];
  const text: string = choice?.message?.content || "";
  const contentLogprobs: OpenRouterLogprob[] = choice?.logprobs?.content || [];

  const tokenProbabilities: TokenProbability[] = contentLogprobs
    .filter((lp) => lp.top_logprobs)
    .map((lp) => ({
      token: lp.token,
      probability: Math.exp(lp.logprob),
      alternatives: (lp.top_logprobs || [])
        .filter((alt) => alt.token !== lp.token)
        .map((alt) => ({ token: alt.token, probability: Math.exp(alt.logprob) }))
        .sort((a, b) => b.probability - a.probability),
    }));

  return {
    text,
    tokenProbabilities,
    usage: {
      promptTokens: data?.usage?.prompt_tokens || 0,
      completionTokens: data?.usage?.completion_tokens || 0,
      totalTokens: data?.usage?.total_tokens || 0,
    },
    responseTime: ((Date.now() - startTime) / 1000).toFixed(2),
    model: data?.model || req.model,
  };
}
