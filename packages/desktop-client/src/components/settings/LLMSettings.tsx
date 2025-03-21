import React, { useState, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Select } from '@actual-app/components/select';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useLLMConfig } from 'loot-core/client/data-hooks/llm';
import { addNotification } from 'loot-core/client/notifications/notificationsSlice';
import { type LLMConfig, type LLMProvider } from 'loot-core/types/models';

import { useDispatch } from '../../redux';
import { Checkbox, FormField, FormLabel } from '../forms';

import { Setting } from './UI';


export function LLMSettings() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { config, isLoading, error, saveConfig, testConnection } = useLLMConfig();
  
  const [localConfig, setLocalConfig] = useState<LLMConfig>({
    provider: 'openai',
    apiKey: '',
    enabled: false,
    model: '',
    baseUrl: '',
  });
  
  const [isTesting, setIsTesting] = useState(false);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Update local config when the remote config is loaded
  useEffect(() => {
    if (config) {
      // Ensure all required properties have default values
      setLocalConfig({
        provider: config.provider || 'openai',
        apiKey: config.apiKey || '',
        enabled: !!config.enabled,
        model: config.model || 'gpt-4o',
        lastTested: config.lastTested,
        baseUrl: config.baseUrl || '',
      });
    }
  }, [config]);
  
  // Handle form changes
  const handleChange = (field: keyof LLMConfig, value: string | boolean) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Save configuration
  const handleSave = async () => {
    const success = await saveConfig(localConfig);
    if (success) {
      dispatch(
        addNotification({
          notification: {
            type: 'message',
            message: t('LLM configuration saved successfully.'),
          },
        }),
      );
    } else {
      dispatch(
        addNotification({
          notification: {
            type: 'error',
            message: t('Failed to save LLM configuration.'),
          },
        }),
      );
    }
  };
  
  // Test connection
  const handleTest = async () => {
    setIsTesting(true);
    
    try {
      const result = await testConnection(localConfig);
      
      dispatch(
        addNotification({
          notification: {
            type: result.success ? 'message' : 'error',
            message: result.message,
          },
        }),
      );
      
      if (result.success) {
        // Update the lastTested timestamp
        setLocalConfig(prev => ({
          ...prev,
          lastTested: result.timestamp,
        }));
      }
    } finally {
      setIsTesting(false);
    }
  };
  
  if (isLoading) {
    return (
      <Setting>
        <Text>{t('Loading LLM configuration...')}</Text>
      </Setting>
    );
  }
  
  if (error) {
    return (
      <Setting>
        <Text style={{ color: theme.errorText }}>{error}</Text>
      </Setting>
    );
  }
  
  return (
    <Setting>
      <Text style={{ marginBottom: 15 }}>
        <Trans>
          Configure AI integration to enable advanced features like AI analysis
          of your financial data. Your data is processed securely and never
          stored.
        </Trans>
      </Text>

      <Text style={{ display: 'flex' }}>
        <Checkbox
          id="settings-llm-enabled"
          checked={!!localConfig.enabled}
          onChange={e => handleChange('enabled', e.target.checked)}
        />
        <label htmlFor="settings-llm-enabled">
          <Trans>Enable AI Features</Trans>
        </label>
      </Text>

      <FormField>
        <FormLabel title={t('AI Provider')} />
        <Select
          options={[
            ['openai', 'OpenAI'],
            ['ollama', 'Ollama'],
          ]}
          value={localConfig.provider || 'openai'}
          onChange={value => handleChange('provider', value as LLMProvider)}
        />
      </FormField>

      {localConfig.provider === 'openai' && (
        <FormField>
          <FormLabel title={t('API Key')} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Input
              type={isApiKeyVisible ? 'text' : 'password'}
              value={localConfig.apiKey || ''}
              onChange={e => handleChange('apiKey', e.target.value)}
              style={{ flex: 1 }}
              placeholder={t('Enter your API key')}
            />
            <Button
              variant="bare"
              onPress={() => setIsApiKeyVisible(!isApiKeyVisible)}
            >
              {isApiKeyVisible ? t('Hide') : t('Show')}
            </Button>
          </View>
        </FormField>
      )}

      {localConfig.provider === 'openai' && (
        <FormField>
          <FormLabel title={t('Model')} />
          <Select
            options={[
              ['gpt-4o', 'GPT-4o'],
              /* TODO: Add other models */
            ]}
            value={localConfig.model || 'gpt-4o'}
            onChange={value => handleChange('model', value)}
          />
        </FormField>
      )}
      {localConfig.provider === 'ollama' && (
        <>
          <FormField>
            <FormLabel title={t('Base URL')} />
            <Input
              value={localConfig.baseUrl || ''}
              onChange={e => handleChange('baseUrl', e.target.value)}
              placeholder={t('Default: http://localhost:11434')}
            />
          </FormField>
          <FormField>
            <FormLabel title={t('Model Name')} />
            <Input
              
              onChange={e => handleChange('model', e.target.value)}
              placeholder={t('Default: gemma3')}
            />
          </FormField>
        </>
      )}

      {localConfig.lastTested && (
        <Text
          style={{ marginTop: 10, fontSize: 12, color: theme.pageTextLight }}
        >
          {t('Last tested: {{date}}', {
            date: new Date(localConfig.lastTested).toLocaleString(),
          })}
        </Text>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
        <Button
          variant="primary"
          onPress={handleSave}
          isDisabled={!localConfig.apiKey || isTesting || isAnalyzing}
        >
          {isAnalyzing ? t('Analyzing...') : t('Save Configuration')}
        </Button>

        <Button
          onPress={handleTest}
          isDisabled={!localConfig.apiKey || isTesting || isAnalyzing}
        >
          {isTesting ? t('Testing...') : t('Test Connection')}
        </Button>
      </View>
    </Setting>
  );
} 