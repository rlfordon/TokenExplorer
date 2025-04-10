import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for storing API keys (in a real app, not browser storage)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// API responses schema (could be used for caching or history)
export const openaiResponses = pgTable("openai_responses", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  model: text("model").notNull(),
  temperature: text("temperature").notNull(),
  maxTokens: integer("max_tokens").notNull(),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  totalTokens: integer("total_tokens"),
  tokenProbabilities: json("token_probabilities"),
  createdAt: text("created_at").notNull(),
});

export const insertResponseSchema = createInsertSchema(openaiResponses).omit({
  id: true,
});

// Types for API requests/responses
export const openaiRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().default("gpt-3.5-turbo"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4096).default(150),
  apiKey: z.string().min(1, "API key is required"),
});

export const tokenProbabilitySchema = z.object({
  token: z.string(),
  probability: z.number(),
  alternatives: z.array(
    z.object({
      token: z.string(),
      probability: z.number(),
    })
  ),
});

export type TokenProbability = z.infer<typeof tokenProbabilitySchema>;
export type OpenAIRequest = z.infer<typeof openaiRequestSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type OpenAIResponse = typeof openaiResponses.$inferSelect;
export type InsertOpenAIResponse = z.infer<typeof insertResponseSchema>;
