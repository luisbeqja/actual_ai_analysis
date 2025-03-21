export type LLMProvider = 'openai' | 'anthropic' | 'custom' | 'ollama';

export type LLMConfig = {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  enabled: boolean;
  lastTested?: string; // ISO date string when the connection was last tested
};

export type LLMTestResult = {
  success: boolean;
  message: string;
  timestamp: string;
}; 