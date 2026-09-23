import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import InputPanel from "@/components/InputPanel";
import ResultsPanel from "@/components/ResultsPanel";
import { checkHealth, generate, getStoredPasskey, storePasskey, verifyPasskey } from "@/lib/api";
import { DEFAULT_MODEL } from "@/lib/config";
import type { GenerateRequest, GenerateResponse } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { toast } = useToast();
  
  // Authentication state. "checking" until the proxy says whether a class passkey is required.
  const [authState, setAuthState] = useState<"checking" | "needsPasskey" | "ready" | "unreachable">("checking");
  const [passkeyRequired, setPasskeyRequired] = useState<boolean>(false);
  const isAuthenticated = authState === "ready";
  const [passkey, setPasskey] = useState<string>("");
  
  // Application state
  const [prompt, setPrompt] = useState<string>("");
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(150);
  const [tokenViewEnabled, setTokenViewEnabled] = useState<boolean>(true);
  const [autoContinueEnabled, setAutoContinueEnabled] = useState<boolean>(true);
  const [response, setResponse] = useState<GenerateResponse | null>(null);

  // API mutation
  const mutation = useMutation({
    mutationFn: generate,
    onSuccess: (data) => {
      setResponse(data);
    },
    onError: (error: Error) => {
      if (/passkey/i.test(error.message)) {
        storePasskey(null);
        setAuthState("needsPasskey");
      }
      toast({
        title: "API Error",
        description: error.message || "Failed to get a response from the model",
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

    const request: GenerateRequest = { prompt, model, temperature, maxTokens };
    mutation.mutate(request);
  };

  // Clear response
  const handleClearResponse = () => {
    setResponse(null);
  };

  // Handle passkey authentication
  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await verifyPasskey(passkey);
      storePasskey(passkey);
      setAuthState("ready");
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

  // On load, ask the proxy whether a passkey is required, and try any saved passkey.
  useEffect(() => {
    (async () => {
      try {
        const { passkeyRequired } = await checkHealth();
        setPasskeyRequired(passkeyRequired);
        if (!passkeyRequired) return setAuthState("ready");
        const saved = getStoredPasskey();
        if (saved) {
          try {
            await verifyPasskey(saved);
            return setAuthState("ready");
          } catch {
            storePasskey(null);
          }
        }
        setAuthState("needsPasskey");
      } catch {
        setAuthState("unreachable");
      }
    })();
  }, []);

  // Logout function
  const handleLogout = () => {
    setAuthState("needsPasskey");
    storePasskey(null);
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
                        description: "Explore token probabilities in OpenAI language models. Type a prompt, and see not just the final response, but the probability of each token the model considered.",
                      });
                    }}
                    className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary hover:bg-opacity-10 transition-colors"
                  >
                    HELP
                  </button>
                  {passkeyRequired && <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    LOGOUT
                  </button>}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Passkey Authentication Screen */}
        {authState === "checking" ? (
          <div className="flex justify-center items-center min-h-[70vh] text-gray-500">Connecting…</div>
        ) : authState === "unreachable" ? (
          <div className="flex justify-center items-center min-h-[70vh]">
            <Card className="w-full max-w-md p-6">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Can't reach the model service</CardTitle>
                <CardDescription className="text-center">
                  The API proxy didn't respond. Check your connection and reload the page.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : !isAuthenticated ? (
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