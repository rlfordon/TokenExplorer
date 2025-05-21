import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import InputPanel from "@/components/InputPanel";
import ResultsPanel from "@/components/ResultsPanel";
import { apiRequest } from "@/lib/queryClient";
import { verifyPasskey } from "@/lib/api";
import { OpenAIRequest, TokenProbability } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passkey, setPasskey] = useState<string>("");
  
  // Application state
  const [prompt, setPrompt] = useState<string>("");
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

  // Handle passkey authentication
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use server-side verification instead of hardcoded value
      await verifyPasskey(passkey);
      
      // If verification successful, set authenticated state
      setIsAuthenticated(true);
      localStorage.setItem("token-explorer-auth", "true"); // Store auth state
      toast({
        title: "Success",
        description: "Welcome to the LLM Token Explorer!",
      });
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Incorrect passkey. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check for existing auth on component mount
  useEffect(() => {
    const isAuth = localStorage.getItem("token-explorer-auth") === "true";
    if (isAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  // Logout function
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("token-explorer-auth");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
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
              {isAuthenticated && (
                <>
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
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    LOGOUT
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Passkey Authentication Screen */}
        {!isAuthenticated ? (
          <div className="flex justify-center items-center min-h-[70vh]">
            <Card className="w-full max-w-md p-6">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Access Required</CardTitle>
                <CardDescription className="text-center">
                  Please enter the passkey to access the LLM Token Explorer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuthenticate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="passkey">Passkey</Label>
                    <Input
                      id="passkey"
                      type="password"
                      placeholder="Enter your passkey"
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit" 
                    className="w-full"
                  >
                    Enter Explorer
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Main Content - Only shown when authenticated */
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
        )}
      </div>
    </div>
  );
}