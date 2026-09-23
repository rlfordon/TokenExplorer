// Shared API proxy for rlfordon.github.io teaching tools (TokenExplorer, Prompt Coach).
//
// The static pages on GitHub Pages can't hold an API key, so they call this Worker,
// which adds the OpenRouter key and forwards the request. Guard rails, in order:
//   1. Only browser requests from ALLOWED_ORIGINS get CORS headers.
//   2. If the CLASS_PASSKEY secret is set, requests must send it in X-Class-Passkey.
//   3. Only whitelisted models, with capped input size and output tokens.
// The real spending ceiling is the credit limit set on the OpenRouter key itself.
//
// Adapted from Nick Hafen's ai-law-lab Token Explorer worker (MIT):
// https://github.com/nickhafen/ai-law-lab/tree/main/cf-worker
//
// Routes:
//   GET  /health  -> { ok, passkeyRequired }
//   POST /verify  -> 200 if the passkey is right (or none is required), else 401
//   POST /token   -> chat completion with logprobs (TokenExplorer)
//   POST /chat    -> plain chat completion (Prompt Coach)

const ALLOWED_ORIGINS = [
  'https://rlfordon.github.io',
];

// Models that return logprobs through OpenRouter.
const TOKEN_MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'openai/gpt-4.1-mini',
  'openai/gpt-4.1',
];

// Models Prompt Coach may use. Keep in sync with MODELS in prompt-coach/services/aiService.ts.
const CHAT_MODELS = [
  'google/gemini-3.8-flash',
  'google/gemini-3.1-pro-preview',
  'openai/gpt-5.4-mini',
  'openai/gpt-5.5',
  'anthropic/claude-haiku-4.5',
  'anthropic/claude-sonnet-5',
];

const LIMITS = {
  token: { promptChars: 8000, systemChars: 2000, maxTokensDefault: 150, maxTokensCeiling: 500, topLogprobs: 10 },
  // Prompt Coach pastes whole conversations and sends a ~9k-character coaching prompt.
  chat: { promptChars: 60000, systemChars: 20000, maxTokensDefault: 4096, maxTokensCeiling: 4096 },
};

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Class-Passkey',
    'Access-Control-Expose-Headers': 'Retry-After',
  };
  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

// `Number(x) || fallback` would turn a meaningful 0 (temperature 0) into the fallback.
function toFiniteNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function clamp(value, min, max, fallback) {
  const parsed = toFiniteNumber(value);
  if (parsed === null) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function passkeyOk(request, env) {
  if (!env.CLASS_PASSKEY) return true;
  return request.headers.get('X-Class-Passkey') === env.CLASS_PASSKEY;
}

// Validates messages/system against the route's limits. Returns an error string or null.
function checkInput(messages, system, limits) {
  if (!Array.isArray(messages) || messages.length === 0) return 'messages is required';
  for (const m of messages) {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') {
      return 'Each message needs a role of "user" or "assistant" and string content';
    }
  }
  const promptChars = messages.reduce((n, m) => n + m.content.length, 0);
  if (promptChars > limits.promptChars) {
    return `Prompt is too long (${promptChars} characters, limit ${limits.promptChars})`;
  }
  if (system != null && typeof system !== 'string') return 'system must be a string';
  if (system && system.length > limits.systemChars) {
    return `System prompt is too long (${system.length} characters, limit ${limits.systemChars})`;
  }
  return null;
}

async function forward(payload, env, headers, title) {
  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://rlfordon.github.io/',
        'X-Title': title,
      },
      body: JSON.stringify(payload),
    });
    const responseHeaders = { ...headers, 'Content-Type': 'application/json' };
    const retryAfter = upstream.headers.get('Retry-After');
    if (retryAfter) responseHeaders['Retry-After'] = retryAfter;
    return new Response(await upstream.text(), { status: upstream.status, headers: responseHeaders });
  } catch (err) {
    return json({ error: 'Upstream request failed', detail: String(err) }, 502, headers);
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = corsHeaders(origin);
    const path = new URL(request.url).pathname.replace(/\/+$/, '');

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!isAllowedOrigin(origin)) return json({ error: 'Origin not allowed' }, 403, headers);

    if (request.method === 'GET' && path === '/health') {
      return json({ ok: true, passkeyRequired: Boolean(env.CLASS_PASSKEY) }, 200, headers);
    }
    if (request.method !== 'POST') return json({ error: 'Not found' }, 404, headers);

    if (!passkeyOk(request, env)) return json({ error: 'Invalid class passkey' }, 401, headers);
    if (path === '/verify') return json({ ok: true }, 200, headers);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, headers);
    }
    const { model, messages, system, temperature, max_tokens, top_logprobs } = body || {};
    const systemText = typeof system === 'string' ? system.trim() : system;

    if (path === '/token') {
      const limits = LIMITS.token;
      if (!TOKEN_MODELS.includes(model)) return json({ error: `Model not allowed: ${model}` }, 400, headers);
      const error = checkInput(messages, systemText, limits);
      if (error) return json({ error }, 400, headers);
      return forward({
        model,
        messages: systemText ? [{ role: 'system', content: systemText }, ...messages] : messages,
        temperature: clamp(temperature, 0, 2, 0.7),
        max_tokens: Math.trunc(clamp(max_tokens, 1, limits.maxTokensCeiling, limits.maxTokensDefault)),
        logprobs: true,
        top_logprobs: Math.trunc(clamp(top_logprobs, 1, limits.topLogprobs, 5)),
      }, env, headers, 'TokenExplorer');
    }

    if (path === '/chat') {
      const limits = LIMITS.chat;
      if (!CHAT_MODELS.includes(model)) return json({ error: `Model not allowed: ${model}` }, 400, headers);
      const error = checkInput(messages, systemText, limits);
      if (error) return json({ error }, 400, headers);
      const payload = {
        model,
        messages: systemText ? [{ role: 'system', content: systemText }, ...messages] : messages,
        max_tokens: Math.trunc(clamp(max_tokens, 1, limits.maxTokensCeiling, limits.maxTokensDefault)),
      };
      const temp = clamp(temperature, 0, 2, null);
      if (temp !== null) payload.temperature = temp;
      return forward(payload, env, headers, 'Prompt Coach');
    }

    return json({ error: 'Not found' }, 404, headers);
  },
};
