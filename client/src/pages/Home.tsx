import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import InputPanel from "@/components/InputPanel";
import ResultsPanel from "@/components/ResultsPanel";
import { apiRequest } from "@/lib/queryClient";
import { OpenAIRequest, TokenProbability } from "@shared/schema";

// Response type from the server
type OpenAIResponse = {
  text: string;
  tokenProbabilities: TokenProbability[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  responseTime: string;
  model: string;
};

export default function Home() {
  const { toast } = useToast();
  
  // Application state
  const [prompt, setPrompt] = useState<string>("Enter a query here");
  const [model, setModel] = useState<string>("gpt-3.5-turbo");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(150);
  const [tokenViewEnabled, setTokenViewEnabled] = useState<boolean>(true);
  const [autoContinueEnabled, setAutoContinueEnabled] = useState<boolean>(true);
  const [response, setResponse] = useState<OpenAIResponse | null>(null);

  // API mutation
  const mutation = useMutation({
    mutationFn: async (data: OpenAIRequest) => {
      const res = await apiRequest("POST", "/api/openai", data);
      return res.json() as Promise<OpenAIResponse>;
    },
    onSuccess: (data) => {
      setResponse(data);
    },
    onError: (error: Error) => {
      toast({
        title: "API Error",
        description: error.message || "Failed to get response from OpenAI",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      prompt,
      model,
      temperature,
      maxTokens,
      // apiKey is now optional and managed by the server
    });
  };

  // Clear response
  const handleClearResponse = () => {
    setResponse(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-dark">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              LLM Explorer
            </h1>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  toast({
                    title: "LLM Explorer Help",
                    description: "Explore token probabilities in OpenAI's language models. Type a prompt, and see not just the final response, but the probability of each token the model considered.",
                  });
                }}
                className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary hover:bg-opacity-10 transition-colors"
              >
                HELP
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-col lg:flex-row gap-8">
          <InputPanel
            prompt={prompt}
            model={model}
            temperature={temperature}
            maxTokens={maxTokens}
            isPending={mutation.isPending}
            onPromptChange={setPrompt}
            onModelChange={setModel}
            onTemperatureChange={setTemperature}
            onMaxTokensChange={setMaxTokens}
            onSubmit={handleSubmit}
            onClearResponse={handleClearResponse}
          />

          <ResultsPanel
            response={response}
            tokenViewEnabled={tokenViewEnabled}
            autoContinueEnabled={autoContinueEnabled}
            isLoading={mutation.isPending}
            onTokenViewToggle={setTokenViewEnabled}
            onAutoContinueToggle={setAutoContinueEnabled}
          />
        </main>
      </div>
    </div>
  );
}