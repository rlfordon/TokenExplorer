// Base URL of the shared Cloudflare Worker that holds the OpenRouter key (see worker/).
// Replace with the URL Cloudflare shows after you deploy the worker.
export const PROXY_URL = "https://rlfordon-ai-proxy.REPLACE_ME.workers.dev";

// Must match TOKEN_MODELS in worker/src/index.js.
export const MODELS = [
  { id: "openai/gpt-4o", label: "GPT-4o" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "openai/gpt-4.1", label: "GPT-4.1" },
  { id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini" },
];
export const DEFAULT_MODEL = "openai/gpt-4o";

// Must match LIMITS.token in worker/src/index.js.
export const MAX_TOKENS_CAP = 500;
export const PROMPT_CHAR_CAP = 8000;
