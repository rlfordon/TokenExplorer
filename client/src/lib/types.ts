export type TokenProbability = {
  token: string;
  probability: number;
  alternatives: { token: string; probability: number }[];
};

export type GenerateRequest = {
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
};

export type GenerateResponse = {
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
