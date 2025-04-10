import OpenAI from "openai";
import { OpenAIRequest, TokenProbability } from "@shared/schema";

// Function to get completion with token probabilities
export async function getCompletionWithProbabilities({
  prompt,
  model,
  temperature,
  maxTokens,
  apiKey, // This is now optional
}: OpenAIRequest) {
  try {
    // Initialize OpenAI client with environment variable API key, falling back to user provided key if it exists
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || apiKey 
    });
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    // Use gpt-4o if gpt-4 variants are selected
    const finalModel = model.startsWith("gpt-4") ? "gpt-4o" : model;
    
    const startTime = Date.now();
    
    // Make API request with logprobs to get token probabilities
    const response = await openai.chat.completions.create({
      model: finalModel,
      messages: [
        { role: "user", content: prompt }
      ],
      temperature,
      max_tokens: maxTokens,
      logprobs: true,
      top_logprobs: 5
    });
    
    // Calculate response time
    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Extract the completion text
    const text = response.choices[0].message.content || "";
    
    // Extract token probabilities if available
    const tokenProbabilities: TokenProbability[] = [];
    
    // Process logprobs data
    if (response.choices[0].logprobs && response.choices[0].logprobs.content) {
      const contentLogprobs = response.choices[0].logprobs.content;
      
      contentLogprobs.forEach((tokenLogprob) => {
        if (tokenLogprob.top_logprobs) {
          // Main token
          const mainToken = tokenLogprob.token;
          const mainProb = Math.exp(tokenLogprob.logprob);
          
          // Alternative tokens
          const alternatives = tokenLogprob.top_logprobs
            .filter(lp => lp.token !== mainToken)
            .map(lp => ({
              token: lp.token,
              probability: Math.exp(lp.logprob)
            }))
            .sort((a, b) => b.probability - a.probability);
          
          tokenProbabilities.push({
            token: mainToken,
            probability: mainProb,
            alternatives
          });
        }
      });
    }
    
    // Get usage information
    const usage = {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0
    };
    
    return {
      text,
      tokenProbabilities,
      usage,
      responseTime,
      model: finalModel
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}
