import { useState, useEffect } from 'react';

import { type LLMConfig, type LLMTestResult } from '../../types/models';
import { send, sendCatch } from '../../platform/client/fetch';
// Hook to get and update LLM configuration
export function useLLMConfig() {
  const [config, setConfig] = useState<LLMConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the LLM configuration
  const loadConfig = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result: any = await send('llm-get-config');
      setConfig(result.config);
    } catch (err) {
      setError('Failed to load LLM configuration');
      console.error('Error loading LLM config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save the LLM configuration
  const saveConfig = async (newConfig: LLMConfig) => {
    setIsLoading(true);
    setError(null);
    try {      
      const response: any = await sendCatch('llm-save-config', {
        config: newConfig,
      });
      setConfig(response.config);

      return true;
    } catch (err) {
      setError('Failed to save LLM configuration');
      console.error('Error saving LLM config:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testOpenAIConnection = async (apiKey: string): Promise<LLMTestResult> => {
      try {
          // Default API endpoint for a simple test
          const endpoint = 'https://api.openai.com/v1/models';

          // Making a request to the models endpoint
          const response = await fetch(endpoint, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
              }
          });

          // Check if the response is successful
          if (!response.ok) {
              const errorData = await response.json();
              return {
                  success: false,
                  message: `API Error: ${errorData.error?.message || 'Unknown error'}`,
                  timestamp: new Date().toISOString(),
              };
          }

          // Parse the successful response
          const data = await response.json();

          return {
              success: true,
              message: 'Connection successful',
              timestamp: new Date().toISOString(),
          };
      } catch (error) {
          return {
              success: false,
              message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date().toISOString(),
          };
      }
  };

  // Test the LLM connection
  const testConnection = async (testConfig?: LLMConfig): Promise<LLMTestResult> => {
    try {
      // Make sure we're passing the config in the correct format
      const configToTest = testConfig || config;
      if (!configToTest) {
        return {
          success: false,
          message: 'No configuration available to test',
          timestamp: new Date().toISOString(),
        };
      }

      const result = await testOpenAIConnection(configToTest.apiKey);
      // The result from send() is the direct response from the server
      return result as LLMTestResult;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }
  };

  // Load the configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    isLoading,
    error,
    loadConfig,
    saveConfig,
    testConnection,
  };
} 