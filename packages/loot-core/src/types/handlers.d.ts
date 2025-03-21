
import type { AccountHandlers } from '../server/accounts/app';
import type { AdminHandlers } from '../server/admin/types/handlers';
import type { BudgetHandlers } from '../server/budget/app';
import type { DashboardHandlers } from '../server/dashboard/types/handlers';
import type { FiltersHandlers } from '../server/filters/types/handlers';
import type { NotesHandlers } from '../server/notes/types/handlers';
import type { PayeesHandlers } from '../server/payees/app';
import type { PreferencesHandlers } from '../server/preferences/app';
import type { ReportsHandlers } from '../server/reports/types/handlers';
import type { RulesHandlers } from '../server/rules/types/handlers';
import type { SchedulesHandlers } from '../server/schedules/types/handlers';
import type { ToolsHandlers } from '../server/tools/types/handlers';
import type { TransactionHandlers } from '../server/transactions/app';

import type { ApiHandlers } from './api-handlers';
import type { ServerHandlers } from './server-handlers';

export interface Handlers
  extends ServerHandlers,
    ApiHandlers,
    BudgetHandlers,
    DashboardHandlers,
    FiltersHandlers,
    NotesHandlers,
    PreferencesHandlers,
    ReportsHandlers,
    RulesHandlers,
    SchedulesHandlers,
    TransactionHandlers,
    AdminHandlers,
    ToolsHandlers,
    AccountHandlers,
    PayeesHandlers {}

export type HandlerFunctions = Handlers[keyof Handlers];
