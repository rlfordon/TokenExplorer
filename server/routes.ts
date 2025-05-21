import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { openaiRequestSchema } from "@shared/schema";
import { getCompletionWithProbabilities } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // OpenAI API endpoint
  app.post("/api/openai", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = openaiRequestSchema.parse(req.body);
      
      // Get completion with token probabilities from OpenAI
      const result = await getCompletionWithProbabilities({
        prompt: validatedData.prompt,
        model: validatedData.model,
        temperature: validatedData.temperature,
        maxTokens: validatedData.maxTokens,
        apiKey: validatedData.apiKey,
      });
      
      // Return the result
      res.json(result);
    } catch (error) {
      // Handle errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      console.error("OpenAI API error:", error);
      
      // Check if it's an OpenAI API error
      if (error.response && error.response.status) {
        return res.status(error.response.status).json({
          message: error.message || "Error from OpenAI API",
          details: error.response.data
        });
      }
      
      // General error
      res.status(500).json({ 
        message: error.message || "Internal server error" 
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  
  // Passkey verification endpoint
  app.post("/api/verify-passkey", (req, res) => {
    try {
      const { passkey } = req.body;
      const correctPasskey = process.env.EXPLORER_PASSKEY;
      
      if (!correctPasskey) {
        return res.status(500).json({ 
          error: "Server configuration error: No passkey configured" 
        });
      }
      
      const isValid = passkey === correctPasskey;
      
      if (isValid) {
        return res.json({ success: true });
      } else {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid passkey" 
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Server error during authentication" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
