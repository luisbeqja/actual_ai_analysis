import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Paragraph } from '@actual-app/components/paragraph';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';

import { useWidget } from 'loot-core/client/data-hooks/widget';
import { addNotification } from 'loot-core/client/notifications/notificationsSlice';
import { send } from 'loot-core/platform/client/fetch';
import { type AIAnalysisWidget } from 'loot-core/types/models';
import { allAccountBalance, onBudgetAccountBalance, accountBalance } from 'loot-core/client/queries';
import { useSheetValue } from '../../spreadsheet/useSheetValue';
import { useAccounts } from '../../../hooks/useAccounts';
import { type AccountEntity } from 'loot-core/types/models';
import { parametrizedField, type Binding } from '../../spreadsheet';
import { CellValue } from '../../spreadsheet/CellValue';
import * as queries from 'loot-core/client/queries';
import { useReport as useCustomReport } from 'loot-core/client/data-hooks/reports';

import { useNavigate } from '../../../hooks/useNavigate';
import { useDispatch } from '../../../redux';
import { EditablePageHeaderTitle } from '../../EditablePageHeaderTitle';
import { MobileBackButton } from '../../mobile/MobileBackButton';
import { MobilePageHeader, Page, PageHeader } from '../../Page';
import { LoadingIndicator } from '../LoadingIndicator';
import { useLLMConfig } from 'loot-core/client/data-hooks/llm';

import OpenAI from 'openai';

type AnalysisResult = {
  content: string;
  timestamp: string;
  financialData: {
    totalBalance: number;
    onBudgetBalance: number;
    offBudgetBalance: number;
    accountCount: number;
  };
};

export function AIAnalysis() {
  const params = useParams();
  const { data: widget, isLoading } = useWidget<AIAnalysisWidget>(
    params.id ?? '',
    'ai_analysis-card',
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return <AIAnalysisInner widget={widget} />;
}

type AIAnalysisInnerProps = {
  widget?: AIAnalysisWidget;
};

function AIAnalysisInner({ widget }: AIAnalysisInnerProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isNarrowWidth } = useResponsive();
  const { config } = useLLMConfig();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    widget?.meta?.lastAnalysis ?? null
  );

  // Move hooks inside the component
  const accounts = useAccounts();
  const accountParametrizedField = parametrizedField<'account'>();
  
  const totalBalance = useSheetValue<'account', 'accounts-balance'>({
    name: 'accounts-balance',
    query: allAccountBalance().query,
  });
  const onBudgetBalance = useSheetValue<'account', 'onbudget-accounts-balance'>({
    name: 'onbudget-accounts-balance',
    query: onBudgetAccountBalance().query,
  });

  // Get balances for each account
  const accountBalances = accounts.map(account => {
    const balance = useSheetValue<'account', 'balance'>({
      name: accountParametrizedField('balance')(account.id),
      query: queries.accountBalance(account).query,
    });
    return {
      name: account.name,
      offbudget: account.offbudget === 1,
      closed: account.closed === 1,
      balance: (balance ?? 0) / 100,
    };
  });
  

  // Prepare financial data with proper bindings
  const financialData = {
    accounts: accountBalances,
    totalBalance: (totalBalance ?? 0) / 100,
    onBudgetBalance: (onBudgetBalance ?? 0) / 100,
    offBudgetBalance: ((totalBalance ?? 0) - (onBudgetBalance ?? 0)) / 100
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      if (config?.apiKey) {
        const client = new OpenAI({
          apiKey: config.apiKey,
          dangerouslyAllowBrowser: true,
        });

        const prompt = `
          Analyze the following financial data and provide insights:
          this are the data:
          ${JSON.stringify(financialData)}
          
          Please provide a detailed analysis of the financial health and any recommendations.
          If there are any issues, please highlight them in a red color.
          If there are any savings opportunities, please highlight them in a green color.
          If there are any areas that are performing well, please highlight them in a blue color.

          Remember the user already has access to the financial data, so don't repeat it.
          Your main goal is to help the user understand their financial data and make decisions to improve their financial health.

          Return the analysis in a HTML format, your response should be only the HTML.
          `;

        const response = await client.chat.completions.create({
          model: config.model || 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
        });
        const newAnalysis: AnalysisResult = {
          content: response.choices[0].message.content ?? '',
          timestamp: new Date().toISOString(),
          financialData: {
            totalBalance: financialData.totalBalance,
            onBudgetBalance: financialData.onBudgetBalance,
            offBudgetBalance: financialData.offBudgetBalance,
            accountCount: financialData.accounts.length
          }
        };

        setAnalysisResult(newAnalysis);

        // Save the analysis to the widget metadata
        if (widget) {
          await send('dashboard-update-widget', {
            id: widget.id,
            meta: {
              ...(widget.meta ?? {}),
              lastAnalysis: newAnalysis
            },
          });
        }
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      dispatch(
        addNotification({
          notification: {
            type: 'error',
            message: t('Failed to analyze financial data.'),
          },
        }),
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const title = widget?.meta?.name || t('AI Analysis');

  const onSaveWidgetName = async (newName: string) => {
    if (!widget) {
      throw new Error('No widget that could be saved.');
    }

    const name = newName || t('AI Analysis');
    await send('dashboard-update-widget', {
      id: widget.id,
      meta: {
        ...(widget.meta ?? {}),
        name,
      },
    });
  };

  async function onSaveWidget() {
    if (!widget) {
      throw new Error('No widget that could be saved.');
    }

    await send('dashboard-update-widget', {
      id: widget.id,
      meta: {
        ...(widget.meta ?? {}),
      },
    });

    dispatch(
      addNotification({
        notification: {
          type: 'message',
          message: t('Dashboard widget successfully saved.'),
        },
      }),
    );
  }

  return (
    <Page
      header={
        isNarrowWidth ? (
          <MobilePageHeader
            title={title}
            leftContent={
              <MobileBackButton onPress={() => navigate('/reports')} />
            }
          />
        ) : (
          <PageHeader
            title={
              widget ? (
                <EditablePageHeaderTitle
                  title={title}
                  onSave={onSaveWidgetName}
                />
              ) : (
                title
              )
            }
          />
        )
      }
      padding={0}
    >
      <View
        style={{
          backgroundColor: theme.tableBackground,
          padding: 20,
          flex: '1 0 auto',
          overflowY: 'auto',
          marginTop: 20,
        }}
      >
        <View>
          <Button
            variant="primary"
            onPress={handleAnalyze}
            isDisabled={isAnalyzing || !config?.apiKey}
            style={{ marginBottom: 20 }}
          >
            {isAnalyzing ? t('Analyzing...') : t('Analyze Finances')}
          </Button>

          {analysisResult && (
            <View style={{ marginTop: 20 }}>
              <div 
                dangerouslySetInnerHTML={{ __html: analysisResult.content.replace(/^```html|```$/g, '') }}
                style={{ 
                  color: theme.pageText,
                  fontSize: 14,
                }}
              />

              <Text style={{ fontSize: 12, color: theme.pageTextLight, marginTop: 10 }}>
                {t('Last updated: {{date}}', {
                  date: new Date(analysisResult.timestamp).toLocaleString(),
                })}
              </Text>
            </View>
          )}

          {widget && (
            <Button
              variant="primary"
              onPress={onSaveWidget}
              style={{ marginTop: 20 }}
            >
              <Trans>Save widget</Trans>
            </Button>
          )}
        </View>

        <View style={{ marginTop: 30, userSelect: 'none' }}>
          <Paragraph>
            <strong>
              <Trans>What is AI Analysis?</Trans>
            </strong>
          </Paragraph>
          <Paragraph>
            <Trans>
              AI Analysis provides intelligent insights about your financial
              data, helping you understand spending patterns, identify savings
              opportunities, and make better financial decisions.
            </Trans>
          </Paragraph>
        </View>
      </View>
    </Page>
  );
}
