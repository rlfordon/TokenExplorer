import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clipboard, Clock, Tag, X } from "lucide-react";
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

// Get token color based on probability
const getTokenColorClass = (probability: number): string => {
  if (probability >= 0.9) return "bg-green-100 hover:bg-green-200 border-green-300"; // Very high probability
  if (probability >= 0.7) return "bg-teal-100 hover:bg-teal-200 border-teal-300"; // High probability  
  if (probability >= 0.5) return "bg-blue-100 hover:bg-blue-200 border-blue-300"; // Medium probability
  if (probability >= 0.3) return "bg-yellow-100 hover:bg-yellow-200 border-yellow-300"; // Low probability
  if (probability >= 0.1) return "bg-orange-100 hover:bg-orange-200 border-orange-300"; // Very low probability
  return "bg-red-100 hover:bg-red-200 border-red-300"; // Extremely low probability
};

// Color key for reference
const probabilityColorKey = [
  { label: "90-100%", colorClass: "bg-green-100 border-green-300", probability: "Very High" },
  { label: "70-89%", colorClass: "bg-teal-100 border-teal-300", probability: "High" },
  { label: "50-69%", colorClass: "bg-blue-100 border-blue-300", probability: "Medium" },
  { label: "30-49%", colorClass: "bg-yellow-100 border-yellow-300", probability: "Low" },
  { label: "10-29%", colorClass: "bg-orange-100 border-orange-300", probability: "Very Low" },
  { label: "0-9%", colorClass: "bg-red-100 border-red-300", probability: "Extremely Low" },
];

export default function ResultsPanel({
  response,
  tokenViewEnabled,
  autoContinueEnabled,
  isLoading,
  onTokenViewToggle,
  onAutoContinueToggle,
}: ResultsPanelProps) {
  const { toast } = useToast();
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Handle token click
  const handleTokenClick = (index: number) => {
    setSelectedTokenIndex(index === selectedTokenIndex ? null : index);
  };

  // Close probability panel
  const closeProbabilityPanel = () => {
    setSelectedTokenIndex(null);
  };
  
  // Check if response has token probabilities
  const hasTokenProbabilities = response && 
    response.tokenProbabilities && 
    response.tokenProbabilities.length > 0;

  return (
    <Card className="lg:w-1/2 p-6 shadow-sm min-h-[600px] flex flex-col">
      {/* Results Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
              Enter a prompt on the left and click "Generate" to see the model's response. Click on any token to see alternatives.
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
          <div className="space-y-6">
            {/* Probability Color Key */}
            <div className="mb-4 p-3 border rounded-lg bg-muted/30">
              <div className="text-sm font-medium mb-2">Token Probability Key:</div>
              <div className="flex flex-wrap gap-2">
                {probabilityColorKey.map((key, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className={`w-4 h-4 rounded border ${key.colorClass}`}></div>
                    <span className="text-xs">{key.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Interactive Tokens Display */}
            <Card className="p-6">
              <div className="font-medium whitespace-pre-wrap leading-relaxed">
                {response.tokenProbabilities.map((tokenData, index) => (
                  <span
                    key={index}
                    className={`cursor-pointer rounded px-1 py-0.5 inline-block border ${
                      getTokenColorClass(tokenData.probability)
                    } ${selectedTokenIndex === index ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleTokenClick(index)}
                    title={`${(tokenData.probability * 100).toFixed(1)}% probability`}
                  >
                    {tokenData.token}
                  </span>
                ))}
              </div>
            </Card>
            
            {/* Token Probability Panel (Shows when a token is clicked) */}
            {selectedTokenIndex !== null && response.tokenProbabilities[selectedTokenIndex] && (
              <Card className="border-primary">
                <div className="bg-muted p-4 border-b flex justify-between items-center">
                  <h3 className="font-medium">
                    Token Alternatives for "{response.tokenProbabilities[selectedTokenIndex].token}"
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeProbabilityPanel}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    {(() => {
                      const token = response.tokenProbabilities[selectedTokenIndex];
                      
                      // Create array with all alternatives including the main token
                      const allTokens = [
                        { token: token.token, probability: token.probability },
                        ...token.alternatives
                      ].sort((a, b) => b.probability - a.probability);
                      
                      return allTokens.map((alt, index) => {
                        const percentValue = (alt.probability * 100).toFixed(2);
                        const isSelected = alt.token === token.token;
                        
                        return (
                          <li 
                            key={index} 
                            className={`flex items-center gap-4 p-2 rounded ${
                              isSelected ? 'bg-primary/10' : ''
                            }`}
                          >
                            <div className="w-24 font-mono font-medium">
                              {isSelected ? <strong>{alt.token}</strong> : alt.token}
                            </div>
                            <div className="w-24 text-right text-sm text-muted-foreground">
                              ({percentValue}%)
                            </div>
                            <div className="flex-grow h-6 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isSelected ? 'bg-primary' : 'bg-primary/50'
                                }`}
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
          </div>
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