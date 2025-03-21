import { type LLMConfig, type LLMTestResult } from '../../types/models';
import * as db from '../db';
import { saveLLMConfig } from './app';

// Preference key for storing LLM configuration
const LLM_CONFIG_KEY = 'llmConfig';

// Initialize the LLM module
export async function init() {
  // No initialization needed
}

// Re-export the saveLLMConfig function
export { saveLLMConfig };

// ... existing code ... 