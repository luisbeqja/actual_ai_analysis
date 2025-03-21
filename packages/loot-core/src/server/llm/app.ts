import { createApp } from '../app';
import * as db from '../db';
import { mutator } from '../mutators';
import { LLMConfig } from '../../types/models';

// Preference key for storing LLM configuration
const LLM_CONFIG_KEY = 'llmConfig';

// Initialize the LLM module
export async function init() {
  // No initialization needed
}

// Save LLM configuration
export async function saveLLMConfig({ config }: { config: LLMConfig }) {
  try {
    const configJson = JSON.stringify(config);
    
    // Check if the preference already exists
    const existingPref = await db.first(
      'SELECT id FROM preferences WHERE id = ?',
      [LLM_CONFIG_KEY]
    );    
    if (existingPref) {
      // Update existing preference
      await db.run(
        'UPDATE preferences SET value = ? WHERE id = ?',
        [configJson, LLM_CONFIG_KEY]
      );
    } else {
      // Insert new preference
      await db.run(
        'INSERT INTO preferences (id, value) VALUES (?, ?)',
        [LLM_CONFIG_KEY, configJson]
      );
    }
    return { success: true, config };
  } catch (error) {
    return { success: false, config: null };
  }
}

// Get LLM configuration
export async function getLLMConfig() {
  try {
    const result = await db.first<{ value: string }>(
      'SELECT value FROM preferences WHERE id = ?',
      [LLM_CONFIG_KEY]
    );
    if (!result) {
      return { success: true, config: null };
    }
    return { success: true, config: JSON.parse(result.value) };
  } catch (error) {
    return { success: false, config: null };
  }
} 

// Define the handlers interface
interface LLMHandlers {
  'llm-save-config': (arg: { config: LLMConfig }) => Promise<{ success: boolean; config: LLMConfig | null }>;
  'llm-get-config': () => Promise<{ success: boolean; config: LLMConfig | null }>;
}

export const app = createApp<LLMHandlers>();

app.method('llm-save-config', mutator(saveLLMConfig));
app.method('llm-get-config', mutator(getLLMConfig));