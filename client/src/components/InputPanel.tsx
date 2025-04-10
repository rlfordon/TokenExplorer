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
    <Card className="flex-1 p-4 max-w-full lg:max-w-[35%]">
      <div className="mb-2 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Input</h2>
        <div className="text-xs text-gray-500">
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
          className="min-h-[80px] resize-y"
          disabled={isPending}
        />
      </div>

      {/* Compact Controls Row */}
      <div className="mb-6 border rounded-lg p-3 bg-muted/10">
        <Label className="text-sm font-medium mb-2 block">Model Settings</Label>
        <div className="grid grid-cols-12 gap-3">
          {/* Model selection */}
          <div className="col-span-4">
            <div className="text-xs text-muted-foreground mb-1">Model</div>
            <Select
              value={model}
              onValueChange={onModelChange}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4 (uses GPT-4o)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temperature slider */}
          <div className="col-span-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">Temperature</span>
              <span className="text-xs font-medium">{temperature}</span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={(values) => onTemperatureChange(values[0])}
              disabled={isPending}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Deterministic</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max tokens slider */}
          <div className="col-span-4">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-muted-foreground">Max Tokens</span>
              <span className="text-xs font-medium">{maxTokens}</span>
            </div>
            <Slider
              id="maxTokens"
              min={1}
              max={2048}
              step={1}
              value={[maxTokens]}
              onValueChange={(values) => onMaxTokensChange(values[0])}
              disabled={isPending}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Short</span>
              <span>Long</span>
            </div>
          </div>
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