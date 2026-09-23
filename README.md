# LLM Token Explorer

An interactive web application for exploring OpenAI language model token probabilities and generation alternatives. This tool provides real-time visualization of how AI models make token choices during text generation.

**Live:** [https://rlfordon.github.io/TokenExplorer/](https://rlfordon.github.io/TokenExplorer/)

## Features

### Core Functionality
- **Token Probability Visualization**: View actual token probabilities returned by the model using the `logprobs` parameter
- **Interactive Token Exploration**: Click on any generated token to see alternative choices the model considered
- **Color-coded Probability Display**: Visual representation of token confidence levels from high (green) to low (red)

### Model Controls
- **Temperature Adjustment**: Control randomness in token selection (0.0 to 2.0)
- **Max Tokens Setting**: Limit response length (up to 500 tokens)
- **Model Selection**: GPT-4o, GPT-4o Mini, GPT-4.1, GPT-4.1 Mini
- **Token Counter**: Estimate prompt size before generation

### Access
- **Optional class passkey**: If the proxy has a `CLASS_PASSKEY` set, students enter it once; it is remembered in the browser

## How it works

The site is a static React app hosted on GitHub Pages. Pages can't keep an API key secret, so the app sends requests to a small Cloudflare Worker (`worker/`) that adds the OpenRouter API key and forwards them:

```
Browser (GitHub Pages)  ──POST /token──▶  Cloudflare Worker  ──▶  OpenRouter  ──▶  OpenAI model
                                          (holds the API key,
                                           checks origin, passkey,
                                           model list and size caps)
```

The Worker is shared with [Prompt Coach](https://github.com/rlfordon/prompt-coach), which uses its `/chat` route. It only accepts requests from `https://rlfordon.github.io` (and localhost), only allows whitelisted models, and caps prompt length and output tokens. Set a credit limit on the OpenRouter key as the real spending ceiling.

The Worker is adapted from Nick Hafen's [AI & Law Lab](https://github.com/nickhafen/ai-law-lab) Token Explorer worker (MIT), which was itself inspired by this project.

## Deploying

### 1. The Worker (once)

Either paste `worker/src/index.js` into a new Worker in the Cloudflare dashboard (**Workers & Pages → Create → Worker → Edit code**), or from `worker/`:

```bash
npx wrangler deploy
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put CLASS_PASSKEY   # optional
```

Secrets:
- `OPENROUTER_API_KEY` (required): an OpenRouter key, ideally with a credit limit
- `CLASS_PASSKEY` (optional): if set, users must enter it before generating

Then put the Worker's URL in `client/src/lib/config.ts` (`PROXY_URL`).

### 2. The site

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/pages.yml`. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

## Development

```bash
npm install
npm run dev      # Vite dev server; localhost is allowed by the Worker's CORS check
npm run build    # outputs dist/
npm run check    # TypeScript type check
```

Models and limits live in `client/src/lib/config.ts` and must match `TOKEN_MODELS` / `LIMITS.token` in `worker/src/index.js`.

## Project Structure

```
├── client/                # Static React app (Vite root)
│   ├── public/            # favicon
│   └── src/
│       ├── components/    # InputPanel, ResultsPanel, shadcn/ui
│       ├── pages/         # Home (passkey flow + main view)
│       └── lib/           # config.ts, api.ts (Worker calls), types.ts
├── worker/                # Cloudflare Worker proxy (shared with Prompt Coach)
└── .github/workflows/     # GitHub Pages deploy
```

## Use Cases

- **AI/ML Courses**: Demonstrate how language models make token choices
- **Prompt Engineering**: Understand how different prompts affect model confidence
- **AI Transparency**: Show how AI systems make decisions

## License

MIT - see [LICENSE](LICENSE).
