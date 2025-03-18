import React from 'react';
import { useTranslation } from 'react-i18next';

import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';

import { type AIAnalysisWidget } from 'loot-core/types/models';

import { useNavigate } from '../../../hooks/useNavigate';
import { ReportCard } from '../ReportCard';

function extractSummary(htmlContent: string): { 
  summary: string;
  issues: string[];
  opportunities: string[];
  positives: string[];
} {
  // Create a temporary div to parse the HTML
  const div = document.createElement('div');
  div.innerHTML = htmlContent.replace(/^```html|```$/g, '');

  // Extract issues (red text)
  const issues = Array.from(div.querySelectorAll('.issue')).map(el => el.textContent || '');

  // Extract opportunities (green text)
  const opportunities = Array.from(div.querySelectorAll('.opportunity')).map(el => el.textContent || '');

  // Extract positives (blue text)
  const positives = Array.from(div.querySelectorAll('.good')).map(el => el.textContent || '');

  // Get the overview paragraph
  const overviewParagraph = Array.from(div.querySelectorAll('h2 + p')).find(
    p => p.previousElementSibling?.textContent === 'Overview'
  )?.textContent || '';

  return {
    summary: overviewParagraph,
    issues,
    opportunities,
    positives
  };
}

type AIAnalysisCardProps = {
  widgetId: string;
  isEditing: boolean;
  meta: AIAnalysisWidget['meta'];
  onMetaChange: (meta: AIAnalysisWidget['meta']) => void;
  onRemove: () => void;
};

export function AIAnalysisCard({
  widgetId,
  isEditing,
  meta,
  onMetaChange,
  onRemove,
}: AIAnalysisCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const analysis = meta?.lastAnalysis?.content;
  const summary = analysis ? extractSummary(analysis) : null;

  const onCardClick = () => {
    if (!isEditing) {
      navigate(`/reports/ai-analysis/${widgetId}`);
    }
  };

  return (
    <ReportCard
      isEditing={isEditing}
      menuItems={
        isEditing
          ? [
              {
                name: 'remove',
                text: t('Remove'),
              },
            ]
          : undefined
      }
      onMenuSelect={item => {
        if (item === 'remove') {
          onRemove();
        }
      }}
      to={isEditing ? undefined : `/reports/ai-analysis/${widgetId}`}
    >
      <View style={{ padding: 15, cursor: isEditing ? 'default' : 'pointer' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          {meta?.name || t('AI Analysis')}
        </Text>
        {meta?.lastAnalysis ? (
          <>
            <View style={{ borderTop: `1px solid ${theme.tableBorder}`, paddingTop: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                {t('Key Insights')}
              </Text>

              {summary && (
                <View>
                  <Text style={{ fontSize: 13, color: theme.pageText, marginBottom: 10 }}>
                    {summary.summary}
                  </Text>

                  {summary.issues.length > 0 && (
                    <Text style={{ fontSize: 13, color: theme.errorText, marginBottom: 4 }}>
                      • {summary.issues[0]}
                    </Text>
                  )}

                  {summary.opportunities.length > 0 && (
                    <Text style={{ fontSize: 13, color: theme.noticeTextLight, marginBottom: 4 }}>
                      • {summary.opportunities[0]}
                    </Text>
                  )}

                  {summary.positives.length > 0 && (
                    <Text style={{ fontSize: 13, color: theme.noticeText, marginBottom: 4 }}>
                      • {summary.positives[0]}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: theme.pageTextLight }}>
                {t('Updated: {{date}}', {
                  date: new Date(meta.lastAnalysis.timestamp).toLocaleString(),
                })}
              </Text>
              <Text style={{ fontSize: 12, color: theme.pageTextLight }}>
                {t('{{count}} accounts', { count: meta.lastAnalysis.financialData.accountCount })}
              </Text>
            </View>
          </>
        ) : (
          <Text>{t('Click to analyze your finances')}</Text>
        )}
      </View>
    </ReportCard>
  );
} 