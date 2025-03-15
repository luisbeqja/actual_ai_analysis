import React from 'react';
import { useTranslation } from 'react-i18next';

import { View } from '@actual-app/components/view';

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
        <h3>{meta?.name || t('AI Analysis')}</h3>
        <p>{t('AI Analysis feature coming soon!')}</p>
      </View>
    </ReportCard>
  );
} 