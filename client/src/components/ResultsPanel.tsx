import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Clipboard, Clock, Tag } from "lucide-react";
import { TokenProbability } from "@shared/schema";

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

interface ResultsPanelProps {
  response: OpenAIResponse | null;
  tokenViewEnabled: boolean;
  autoContinueEnabled: boolean;
  isLoading: boolean;
  onTokenViewToggle: (enabled: boolean) => void;
  onAutoContinueToggle: (enabled: boolean) => void;
}

export default function ResultsPanel({
  response,
  tokenViewEnabled,
  autoContinueEnabled,
  isLoading,
  onTokenViewToggle,
  onAutoContinueToggle,
}: ResultsPanelProps) {
  const { toast } = useToast();
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [tabValue, setTabValue] = useState<string>("token-view");
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto set tab based on tokenViewEnabled
  useEffect(() => {
    setTabValue(tokenViewEnabled ? "token-view" : "text-view");
  }, [tokenViewEnabled]);

  // Copy response to clipboard
  const copyResponseToClipboard = () => {
    if (response) {
      navigator.clipboard.writeText(response.text)
        .then(() => {
          toast({
            title: "Copied",
            description: "Response copied to clipboard",
          });
        })
        .catch(() => {
          toast({
            title: "Failed to copy",
            description: "Could not copy to clipboard",
            variant: "destructive",
          });
        });
    }
  };

  // Navigate between tokens
  const goToPreviousToken = () => {
    if (currentTokenIndex > 0) {
      setCurrentTokenIndex(currentTokenIndex - 1);
    }
  };

  const goToNextToken = () => {
    if (response && currentTokenIndex < response.tokenProbabilities.length - 1) {
      setCurrentTokenIndex(currentTokenIndex + 1);
    }
  };

  // Reset current token index when response changes
  useEffect(() => {
    setCurrentTokenIndex(0);
  }, [response]);

  return (
    <Card className="lg:w-1/2 p-6 shadow-sm min-h-[600px] flex flex-col">
      {/* Results Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="toggleTokenView" className="text-sm font-medium">Token View</Label>
            <Switch
              id="toggleTokenView"
              checked={tokenViewEnabled}
              onCheckedChange={onTokenViewToggle}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="toggleAutoContinue" className="text-sm font-medium">Automatic Continuation</Label>
            <Switch
              id="toggleAutoContinue"
              checked={autoContinueEnabled}
              onCheckedChange={onAutoContinueToggle}
            />
          </div>
        </div>
        <div>
          {response && (
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Max Tokens</span>
              <span className="font-mono font-medium">{response.usage.completionTokens}</span>
            </div>
          )}
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-grow overflow-auto relative" ref={containerRef}>
        {/* Initial State / Empty State */}
        {!response && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-center max-w-md px-6">
              Enter a prompt on the left and click "Continue" to see the model's response and token probabilities.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-primary">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
            <p className="text-center">Generating response...</p>
          </div>
        )}

        {/* Results View */}
        {response && !isLoading && (
          <Tabs
            defaultValue="token-view"
            value={tabValue}
            onValueChange={(value) => {
              setTabValue(value);
              onTokenViewToggle(value === "token-view");
            }}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="token-view">Token Probabilities</TabsTrigger>
              <TabsTrigger value="text-view">Plain Text</TabsTrigger>
            </TabsList>
            
            <TabsContent value="token-view" className="space-y-6">
              {response.tokenProbabilities.length > 0 && (
                <Card>
                  <div className="bg-muted p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Response Token #{currentTokenIndex + 1}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={goToPreviousToken}
                          disabled={currentTokenIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={goToNextToken}
                          disabled={currentTokenIndex === response.tokenProbabilities.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2">
                      {(() => {
                        const token = response.tokenProbabilities[currentTokenIndex];
                        
                        if (!token) return null;
                        
                        // Create array with all alternatives including the main token
                        const allTokens = [
                          { token: token.token, probability: token.probability },
                          ...token.alternatives
                        ].sort((a, b) => b.probability - a.probability);
                        
                        return allTokens.map((alt, index) => {
                          const percentValue = (alt.probability * 100).toFixed(2);
                          return (
                            <li key={index} className="flex items-center gap-4">
                              <div className="w-24 font-mono font-medium">{alt.token}</div>
                              <div className="w-24 text-right text-sm text-muted-foreground">
                                ({percentValue}%)
                              </div>
                              <div className="flex-grow h-6 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${percentValue}%` }}
                                ></div>
                              </div>
                            </li>
                          );
                        });
                      })()}
                    </ul>
                  </div>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="text-view">
              <Card className="p-6">
                <p className="whitespace-pre-wrap font-medium">{response.text}</p>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Bottom Controls */}
      {response && (
        <div className="flex justify-between mt-6 pt-4 border-t border-muted text-sm">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary"
            onClick={copyResponseToClipboard}
          >
            <Clipboard className="mr-1 h-4 w-4" />
            Copy Response
          </Button>
          <div className="flex gap-6">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Response time: <span className="font-medium">{response.responseTime}s</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Tokens used: <span className="font-medium">{response.usage.totalTokens}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
