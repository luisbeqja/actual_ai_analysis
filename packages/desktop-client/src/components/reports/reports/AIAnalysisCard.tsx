import React from 'react';
import { useTranslation } from 'react-i18next';

import { View } from '@actual-app/components/view';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';

import { type AIAnalysisWidget } from 'loot-core/types/models';

import { useNavigate } from '../../../hooks/useNavigate';
import { ReportCard } from '../ReportCard';

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
                {Array.isArray(meta.lastAnalysis.content) && meta.lastAnalysis.content.map((section: any, index: number) => (
                <View key={index} style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                    {section.title}
                  </Text>
                  {section.content.map((line: any, lineIndex: any) => (
                    <Text key={lineIndex} style={{ fontSize: 12, color: theme.pageTextLight, marginLeft: 8 }}>
                      {line}
                    </Text>
                  ))}
                </View>
              ))}
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