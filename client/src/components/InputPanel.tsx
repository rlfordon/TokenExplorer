import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Play, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InputPanelProps {
  apiKey: string;
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isPending: boolean;
  onPromptChange: (prompt: string) => void;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temperature: number) => void;
  onMaxTokensChange: (maxTokens: number) => void;
  onShowApiKeyModal: () => void;
  onSaveApiKey: (key: string) => void;
  onSubmit: () => void;
  onClearResponse: () => void;
}

export default function InputPanel({
  apiKey,
  prompt,
  model,
  temperature,
  maxTokens,
  isPending,
  onPromptChange,
  onModelChange,
  onTemperatureChange,
  onMaxTokensChange,
  onShowApiKeyModal,
  onSaveApiKey,
  onSubmit,
  onClearResponse,
}: InputPanelProps) {
  const { toast } = useToast();
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [isApiKeyVisible, setIsApiKeyVisible] = useState<boolean>(false);
  const [tokenCount, setTokenCount] = useState<number>(0);

  // Update token count when prompt changes
  useEffect(() => {
    // Simple approximation: 1 token ≈ 4 characters
    const count = Math.ceil(prompt.length / 4);
    setTokenCount(count);
  }, [prompt]);

  // When apiKey changes, update the masked input
  useEffect(() => {
    if (apiKey && !isApiKeyVisible) {
      setApiKeyInput("•".repeat(Math.min(apiKey.length, 30)));
    } else if (apiKey && isApiKeyVisible) {
      setApiKeyInput(apiKey);
    } else {
      setApiKeyInput("");
    }
  }, [apiKey, isApiKeyVisible]);

  // Toggle API key visibility
  const toggleApiKeyVisibility = () => {
    setIsApiKeyVisible(!isApiKeyVisible);
    setApiKeyInput(isApiKeyVisible ? "•".repeat(Math.min(apiKey.length, 30)) : apiKey);
  };

  // Save API key
  const saveApiKey = () => {
    if (apiKeyInput && !apiKeyInput.includes("•")) {
      onSaveApiKey(apiKeyInput);
    } else if (apiKeyInput.includes("•")) {
      toast({
        title: "API Key Not Changed",
        description: "API key remains unchanged.",
      });
    } else {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
    }
  };

  // Clear prompt
  const clearPrompt = () => {
    onPromptChange("");
  };

  return (
    <div className="lg:w-1/2 space-y-6">
      {/* API Key Input */}
      <Card className="p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">OpenAI API Key</h2>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Input
              type={isApiKeyVisible ? "text" : "password"}
              id="apiKey"
              className="pr-10"
              placeholder="Enter your OpenAI API key"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5"
              onClick={toggleApiKeyVisibility}
            >
              {isApiKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <Button type="button" onClick={saveApiKey}>
            Save
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Your API key is stored securely in your browser and never sent to our servers.
        </p>
      </Card>

      {/* Prompt Input */}
      <Card className="p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Prompt</h2>
        <div className="space-y-4">
          <Textarea
            id="promptInput"
            rows={5}
            className="resize-none"
            placeholder="Enter your prompt here, e.g., 'Water, Tea or Coffee? Answer only in a single option of these'"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
          />
          <div className="flex justify-between">
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">~{tokenCount} tokens</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-primary"
              onClick={clearPrompt}
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Model Parameters */}
      <Card className="p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Model Parameters</h2>
        <div className="space-y-6">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="modelSelect">Model</Label>
            <Select value={model} onValueChange={onModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4-1106-preview">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="temperatureSlider">Temperature</Label>
              <Input
                type="number"
                id="temperatureInput"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                className="w-16 px-2 py-1 text-center"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">0</span>
              <Slider
                id="temperatureSlider"
                min={0}
                max={2}
                step={0.1}
                value={[temperature]}
                onValueChange={(values) => onTemperatureChange(values[0])}
                className="flex-grow"
              />
              <span className="text-xs">2.0</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Higher values produce more random outputs, lower values make outputs more deterministic.
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="maxTokensSlider">Max Tokens</Label>
              <Input
                type="number"
                id="maxTokensInput"
                min={1}
                max={2048}
                step={1}
                value={maxTokens}
                onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
                className="w-16 px-2 py-1 text-center"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">1</span>
              <Slider
                id="maxTokensSlider"
                min={1}
                max={2048}
                step={1}
                value={[maxTokens]}
                onValueChange={(values) => onMaxTokensChange(values[0])}
                className="flex-grow"
              />
              <span className="text-xs">2048</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The maximum number of tokens to generate in the response.
            </p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onSubmit}
          disabled={isPending || !prompt.trim()}
          className="flex-grow"
        >
          <Play className="mr-2 h-4 w-4" />
          {isPending ? "GENERATING..." : "CONTINUE"}
        </Button>
        <Button
          variant="outline"
          onClick={onClearResponse}
          className="text-muted-foreground"
        >
          <X className="mr-2 h-4 w-4" />
          CLEAR RESPONSE
        </Button>
      </div>
    </div>
  );
}
