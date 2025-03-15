import React, { useState, useEffect, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Button } from '@actual-app/components/button';
import { useResponsive } from '@actual-app/components/hooks/useResponsive';
import { Paragraph } from '@actual-app/components/paragraph';
import { styles } from '@actual-app/components/styles';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';
import * as d from 'date-fns';

import { useWidget } from 'loot-core/client/data-hooks/widget';
import { addNotification } from 'loot-core/client/notifications/notificationsSlice';
import { send } from 'loot-core/platform/client/fetch';
import * as monthUtils from 'loot-core/shared/months';
import { integerToCurrency } from 'loot-core/shared/util';
import { type TimeFrame, type NetWorthWidget } from 'loot-core/types/models';

import { useAccounts } from '../../../hooks/useAccounts';
import { useFilters } from '../../../hooks/useFilters';
import { useLocale } from '../../../hooks/useLocale';
import { useNavigate } from '../../../hooks/useNavigate';
import { useSyncedPref } from '../../../hooks/useSyncedPref';
import { useDispatch } from '../../../redux';
import { EditablePageHeaderTitle } from '../../EditablePageHeaderTitle';
import { MobileBackButton } from '../../mobile/MobileBackButton';
import { MobilePageHeader, Page, PageHeader } from '../../Page';
import { PrivacyFilter } from '../../PrivacyFilter';
import { Change } from '../Change';
import { NetWorthGraph } from '../graphs/NetWorthGraph';
import { Header } from '../Header';
import { LoadingIndicator } from '../LoadingIndicator';
import { calculateTimeRange } from '../reportRanges';
import { createSpreadsheet as netWorthSpreadsheet } from '../spreadsheets/net-worth-spreadsheet';
import { useReport } from '../useReport';
import { fromDateRepr } from '../util';

export function NetWorth() {
  const params = useParams();
  const { data: widget, isLoading } = useWidget<NetWorthWidget>(
    params.id ?? '',
    'net-worth-card',
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return <NetWorthInner widget={widget} />;
}

type NetWorthInnerProps = {
  widget?: NetWorthWidget;
};

function NetWorthInner({ widget }: NetWorthInnerProps) {
  const locale = useLocale();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const accounts = useAccounts();
  const {
    conditions,
    conditionsOp,
    onApply: onApplyFilter,
    onDelete: onDeleteFilter,
    onUpdate: onUpdateFilter,
    onConditionsOpChange,
  } = useFilters(widget?.meta?.conditions, widget?.meta?.conditionsOp);

  const [allMonths, setAllMonths] = useState<Array<{
    name: string;
    pretty: string;
  }> | null>(null);

  const [initialStart, initialEnd, initialMode] = calculateTimeRange(
    widget?.meta?.timeFrame,
  );
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [mode, setMode] = useState(initialMode);

  const reportParams = useMemo(
    () =>
      netWorthSpreadsheet(
        start,
        end,
        accounts,
        conditions,
        conditionsOp,
        locale,
      ),
    [start, end, accounts, conditions, conditionsOp, locale],
  );
  const data = useReport('net_worth', reportParams);
  useEffect(() => {
    async function run() {
      const trans = await send('get-earliest-transaction');
      const currentMonth = monthUtils.currentMonth();
      let earliestMonth = trans
        ? monthUtils.monthFromDate(d.parseISO(fromDateRepr(trans.date)))
        : currentMonth;

      // Make sure the month selects are at least populates with a
      // year's worth of months. We can undo this when we have fancier
      // date selects.
      const yearAgo = monthUtils.subMonths(monthUtils.currentMonth(), 12);
      if (earliestMonth > yearAgo) {
        earliestMonth = yearAgo;
      }

      const allMonths = monthUtils
        .rangeInclusive(earliestMonth, monthUtils.currentMonth())
        .map(month => ({
          name: month,
          pretty: monthUtils.format(month, 'MMMM, yyyy', locale),
        }))
        .reverse();

      setAllMonths(allMonths);
    }
    run();
  }, [locale]);

  function onChangeDates(start: string, end: string, mode: TimeFrame['mode']) {
    setStart(start);
    setEnd(end);
    setMode(mode);
  }

  async function onSaveWidget() {
    if (!widget) {
      throw new Error('No widget that could be saved.');
    }

    await send('dashboard-update-widget', {
      id: widget.id,
      meta: {
        ...(widget.meta ?? {}),
        conditions,
        conditionsOp,
        timeFrame: {
          start,
          end,
          mode,
        },
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

  const navigate = useNavigate();
  const { isNarrowWidth } = useResponsive();

  const title = widget?.meta?.name || t('Net Worth');
  const onSaveWidgetName = async (newName: string) => {
    if (!widget) {
      throw new Error('No widget that could be saved.');
    }

    const name = newName || t('Net Worth');
    await send('dashboard-update-widget', {
      id: widget.id,
      meta: {
        ...(widget.meta ?? {}),
        name,
      },
    });
  };

  const [earliestTransaction, _] = useState('');
  const [_firstDayOfWeekIdx] = useSyncedPref('firstDayOfWeekIdx');
  const firstDayOfWeekIdx = _firstDayOfWeekIdx || '0';

  if (!allMonths || !data) {
    return null;
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
      <Header
        allMonths={allMonths}
        start={start}
        end={end}
        earliestTransaction={earliestTransaction}
        firstDayOfWeekIdx={firstDayOfWeekIdx}
        mode={mode}
        onChangeDates={onChangeDates}
        filters={conditions}
        onApply={onApplyFilter}
        onUpdateFilter={onUpdateFilter}
        onDeleteFilter={onDeleteFilter}
        conditionsOp={conditionsOp}
        onConditionsOpChange={onConditionsOpChange}
      >
        {widget && (
          <Button variant="primary" onPress={onSaveWidget}>
            <Trans>Save widget</Trans>
          </Button>
        )}
      </Header>

      <View
        style={{
          backgroundColor: theme.tableBackground,
          padding: 20,
          paddingTop: 0,
          flex: '1 0 auto',
          overflowY: 'auto',
        }}
      >
        <View
          style={{
            textAlign: 'right',
            paddingTop: 20,
          }}
        >
          <View
            style={{ ...styles.largeText, fontWeight: 400, marginBottom: 5 }}
          >
            <PrivacyFilter>{integerToCurrency(data.netWorth)}</PrivacyFilter>
          </View>
          <PrivacyFilter>
            <Change amount={data.totalChange} />
          </PrivacyFilter>
        </View>

        <NetWorthGraph
          graphData={data.graphData}
          showTooltip={!isNarrowWidth}
        />

        <View style={{ marginTop: 30, userSelect: 'none' }}>
          <Paragraph>
            <h2>Test</h2>
            <strong>
              <Trans>How is net worth calculated?</Trans>
            </strong>
          </Paragraph>
          <Paragraph>
            <Trans>
              Net worth shows the balance of all accounts over time, including
              all of your investments. Your “net worth” is considered to be the
              amount you’d have if you sold all your assets and paid off as much
              debt as possible. If you hover over the graph, you can also see
              the amount of assets and debt individually.
            </Trans>
          </Paragraph>
        </View>
      </View>
    </Page>
  );
}
