import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Paragraph } from '@actual-app/components/paragraph';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { useWidget } from 'loot-core/client/data-hooks/widget';
import { addNotification } from 'loot-core/client/notifications/notificationsSlice';
import { send } from 'loot-core/platform/client/fetch';
import { type AIAnalysisWidget } from 'loot-core/types/models';

import { useNavigate } from '../../../hooks/useNavigate';
import { useDispatch } from '../../../redux';
import { EditablePageHeaderTitle } from '../../EditablePageHeaderTitle';
import { MobileBackButton } from '../../mobile/MobileBackButton';
import { MobilePageHeader, Page, PageHeader } from '../../Page';
import { LoadingIndicator } from '../LoadingIndicator';

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
        // Add any additional properties you want to save
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
          <p>{t('AI Analysis feature coming soon!')}</p>
          
          {widget && (
            <Button variant="primary" onPress={onSaveWidget} style={{ marginTop: 20 }}>
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
              AI Analysis will provide intelligent insights about your financial data,
              helping you understand spending patterns, identify savings opportunities,
              and make better financial decisions.
            </Trans>
          </Paragraph>
        </View>
      </View>
    </Page>
  );
} 