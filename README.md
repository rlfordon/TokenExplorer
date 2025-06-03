# LLM Token Explorer

An interactive web application for exploring OpenAI language model token probabilities and generation alternatives. This tool provides real-time visualization of how AI models make token choices during text generation.

![LLM Token Explorer](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

## Features

### Core Functionality
- **Token Probability Visualization**: View actual token probabilities returned by OpenAI's API using the `logprobs` parameter
- **Interactive Token Exploration**: Click on any generated token to see alternative choices the model considered
- **Color-coded Probability Display**: Visual representation of token confidence levels from high (green) to low (red)
- **Real-time Generation**: Watch as the model generates text with visible probability distributions

### Model Controls
- **Temperature Adjustment**: Control randomness in token selection (0.0 to 2.0)
- **Max Tokens Setting**: Limit response length
- **Model Selection**: Choose between GPT-3.5 Turbo and GPT-4
- **Token Counter**: Estimate API usage before generation

### Security & Access
- **Passkey Authentication**: Secure access control for shared environments
- **Environment-based Configuration**: API keys and secrets managed through environment variables
- **Session Persistence**: Login state remembered across browser sessions

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Compact Interface**: Side-by-side prompt and response layout
- **Copy Functionality**: Easy copying of generated responses
- **Performance Metrics**: Response time and token usage tracking

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI primitives
- **Styling**: Tailwind CSS with custom theming
- **Backend**: Node.js, Express, TypeScript
- **API Integration**: OpenAI API with logprobs support
- **State Management**: TanStack Query for data fetching
- **Build & Dev**: Vite with HMR support

## Quick Start

### Prerequisites
- Node.js 18+ installed
- OpenAI API account and key
- Git (for cloning)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd llm-token-explorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   EXPLORER_PASSKEY=your_custom_passkey_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open your browser to `http://localhost:5000`

## Usage

### Authentication
1. Enter your custom passkey on the login screen
2. The passkey is set via the `EXPLORER_PASSKEY` environment variable

### Exploring Token Probabilities
1. **Enter a prompt** in the left panel
2. **Adjust model parameters** (temperature, max tokens, model)
3. **Click "Generate"** to get the response
4. **View color-coded tokens** in the response panel
5. **Click any token** to see alternative choices and their probabilities

### Understanding the Interface
- **Green tokens**: High probability (>70%)
- **Yellow tokens**: Medium probability (30-70%)
- **Red tokens**: Low probability (<30%)
- **Token alternatives panel**: Shows top 5 alternative tokens with probability bars

## API Integration

The application leverages OpenAI's chat completions API with specific parameters:

```javascript
{
  model: "gpt-4", // or "gpt-3.5-turbo"
  messages: [...],
  temperature: 0.7,
  max_tokens: 150,
  logprobs: true,
  top_logprobs: 5
}
```

The `logprobs` parameter returns probability information for each token, which is then processed and visualized in the interface.

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/           # Utility functions and API calls
│   │   └── hooks/         # Custom React hooks
├── server/                # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── openai.ts          # OpenAI integration
│   └── storage.ts         # Data persistence layer
├── shared/                # Shared TypeScript types and schemas
└── package.json           # Dependencies and scripts
```

## Development

### Available Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run type-check`: Run TypeScript type checking

### Key Components
- **InputPanel**: Prompt input and model parameter controls
- **ResultsPanel**: Token visualization and probability display
- **Home**: Main application logic and state management

## Deployment

### Environment Variables
Set these in your deployment environment:
- `OPENAI_API_KEY`: Your OpenAI API key
- `EXPLORER_PASSKEY`: Custom passkey for access control

### Production Build
```bash
npm run build
```

The application serves both frontend and backend from a single Express server, making deployment straightforward.

## Use Cases

### Educational
- **AI/ML Courses**: Demonstrate how language models make token choices
- **Research Projects**: Analyze model behavior and confidence patterns
- **Interactive Learning**: Hands-on exploration of AI text generation

### Professional
- **Model Evaluation**: Compare token probability distributions across models
- **Prompt Engineering**: Understand how different prompts affect model confidence
- **AI Transparency**: Show clients/stakeholders how AI systems make decisions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the API with logprobs support
- shadcn/ui for the excellent component library
- The React and TypeScript communities for robust tooling

## Support

If you encounter issues or have questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

---

Built with dedication for exploring the inner workings of AI language models.