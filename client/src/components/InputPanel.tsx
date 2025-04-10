import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Play, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InputPanelProps {
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isPending: boolean;
  onPromptChange: (prompt: string) => void;
  onModelChange: (model: string) => void;
  onTemperatureChange: (temperature: number) => void;
  onMaxTokensChange: (maxTokens: number) => void;
  onSubmit: () => void;
  onClearResponse: () => void;
}

export default function InputPanel({
  prompt,
  model,
  temperature,
  maxTokens,
  isPending,
  onPromptChange,
  onModelChange,
  onTemperatureChange,
  onMaxTokensChange,
  onSubmit,
  onClearResponse,
}: InputPanelProps) {
  const { toast } = useToast();
  const [tokenCount, setTokenCount] = useState<number>(0);

  // Estimate token count based on text length (rough approximation)
  const updateTokenCount = (text: string) => {
    // Rough approximation: 1 token ≈ 4 characters
    const tokenEstimate = Math.ceil(text.length / 4);
    setTokenCount(tokenEstimate);
  };

  // Handle prompt change with token count update
  const handlePromptChange = (value: string) => {
    onPromptChange(value);
    updateTokenCount(value);
  };

  return (
    <Card className="flex-1 p-6 max-w-full lg:max-w-[40%]">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Input</h2>
        <div className="text-sm text-gray-500">
          Est. tokens: {tokenCount}
        </div>
      </div>

      {/* Prompt textarea */}
      <div className="mb-4">
        <Label htmlFor="prompt" className="block mb-2">
          Prompt
        </Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          placeholder="Enter your prompt here..."
          className="min-h-[120px] resize-y"
          disabled={isPending}
        />
      </div>

      {/* Model selection */}
      <div className="mb-4">
        <Label htmlFor="model" className="block mb-2">
          Model
        </Label>
        <Select
          value={model}
          onValueChange={onModelChange}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            <SelectItem value="gpt-4">GPT-4 (uses GPT-4o)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Temperature slider */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <Label htmlFor="temperature">Temperature</Label>
          <span className="text-sm text-muted-foreground">{temperature}</span>
        </div>
        <Slider
          id="temperature"
          min={0}
          max={2}
          step={0.1}
          value={[temperature]}
          onValueChange={(values) => onTemperatureChange(values[0])}
          disabled={isPending}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Deterministic</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Max tokens slider */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <Label htmlFor="maxTokens">Max Tokens</Label>
          <span className="text-sm text-muted-foreground">{maxTokens}</span>
        </div>
        <Slider
          id="maxTokens"
          min={1}
          max={2048}
          step={1}
          value={[maxTokens]}
          onValueChange={(values) => onMaxTokensChange(values[0])}
          disabled={isPending}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Short</span>
          <span>Long</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="icon"
          onClick={onClearResponse}
          disabled={isPending}
          title="Clear result"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isPending || !prompt.trim()}
          className="flex-1"
        >
          {isPending ? "Generating..." : "Generate"}
          {!isPending && <Play className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </Card>
  );
}