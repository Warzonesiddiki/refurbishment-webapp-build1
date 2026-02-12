import type {
  FinancialPeriod,
  PeriodBalances,
  PeriodCloseChecklist,
  PeriodType,
} from "@/store/types/FinancialPeriodTypes";

export type FinancialPeriodState = {
  periods: Record<string, FinancialPeriod>;
  currentPeriodId: string | null;
  fiscalYearStart: number;
  closeChecklist: Record<string, PeriodCloseChecklist>;
};

export type FinancialPeriodAction =
  | { type: "CREATE_FINANCIAL_PERIOD"; payload: { type: PeriodType; startDate: string } }
  | { type: "START_PERIOD_CLOSE"; payload: { periodId: string; checklist?: PeriodCloseChecklist } }
  | { type: "COMPLETE_PERIOD_CLOSE"; payload: { periodId: string; closingBalances: PeriodBalances } }
  | { type: "REOPEN_PERIOD"; payload: { periodId: string; reason: string; allowReopen?: boolean } };

const uid = () => crypto.randomUUID();

const defaultBalances = (): PeriodBalances => ({
  cash: 0,
  receivables: 0,
  inventory: 0,
  payables: 0,
  ownerEquity: 0,
  retainedEarnings: 0,
});

const defaultChecklist = (): PeriodCloseChecklist => ({
  allSalesInvoiced: false,
  allPurchasesReceived: false,
  allReceiptsRecorded: false,
  allPaymentsRecorded: false,
  inventoryReconciled: false,
  vatReturnPrepared: false,
  bankReconciled: false,
});

function addMonths(startDate: Date, months: number) {
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + months);
  end.setDate(0);
  return end;
}

function periodWindow(type: PeriodType, startDate: string) {
  const start = new Date(startDate);
  const end = type === "MONTH" ? addMonths(start, 1) : type === "QUARTER" ? addMonths(start, 3) : addMonths(start, 12);
  return { start, end };
}

function periodName(type: PeriodType, start: Date) {
  const y = start.getFullYear();
  const m = `${start.getMonth() + 1}`.padStart(2, "0");
  if (type === "MONTH") return `${y}-${m}`;
  if (type === "QUARTER") return `${y}-Q${Math.floor(start.getMonth() / 3) + 1}`;
  return `${y}`;
}

export const createInitialFinancialPeriodState = (): FinancialPeriodState => ({
  periods: {},
  currentPeriodId: null,
  fiscalYearStart: 1,
  closeChecklist: {},
});

export function ensureEntryAllowed(state: FinancialPeriodState, entryDate: string) {
  const dt = +new Date(entryDate);
  const periods = Object.values(state.periods);
  const matched = periods.find((p) => dt >= +new Date(p.startDate) && dt <= +new Date(p.endDate));
  if (!matched) throw new Error("Entry is in future period not yet created");
  if (matched.status === "CLOSED") throw new Error("Backdated entry blocked in closed period");
  return true;
}

export function financialPeriodReducer(state: FinancialPeriodState, action: FinancialPeriodAction): FinancialPeriodState {
  switch (action.type) {
    case "CREATE_FINANCIAL_PERIOD": {
      const { start, end } = periodWindow(action.payload.type, action.payload.startDate);
      const overlap = Object.values(state.periods).some(
        (p) => +new Date(p.startDate) <= +end && +start <= +new Date(p.endDate)
      );
      if (overlap) throw new Error("Overlapping period");
      const previous = Object.values(state.periods)
        .filter((p) => +new Date(p.endDate) < +start)
        .sort((a, b) => +new Date(b.endDate) - +new Date(a.endDate))[0];
      if (previous && previous.status !== "CLOSED") throw new Error("Previous period must be closed");

      const id = uid();
      const opening = previous?.closingBalances ?? defaultBalances();
      const period: FinancialPeriod = {
        id,
        name: periodName(action.payload.type, start),
        type: action.payload.type,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        status: "OPEN",
        closedAt: null,
        closedBy: null,
        openingBalances: opening,
        closingBalances: null,
        notes: null,
      };
      return { ...state, periods: { ...state.periods, [id]: period }, currentPeriodId: id };
    }
    case "START_PERIOD_CLOSE": {
      const period = state.periods[action.payload.periodId];
      if (!period || period.status !== "OPEN") throw new Error("Period must be OPEN");
      return {
        ...state,
        periods: { ...state.periods, [period.id]: { ...period, status: "CLOSING" } },
        closeChecklist: { ...state.closeChecklist, [period.id]: action.payload.checklist ?? defaultChecklist() },
      };
    }
    case "COMPLETE_PERIOD_CLOSE": {
      const period = state.periods[action.payload.periodId];
      if (!period || period.status !== "CLOSING") throw new Error("Period must be CLOSING");
      const checklist = state.closeChecklist[period.id] ?? defaultChecklist();
      const done = Object.values(checklist).every(Boolean);
      if (!done) throw new Error("All checklist items must be complete");
      return {
        ...state,
        periods: {
          ...state.periods,
          [period.id]: {
            ...period,
            status: "CLOSED",
            closingBalances: action.payload.closingBalances,
            closedAt: new Date().toISOString(),
            closedBy: "system",
          },
        },
      };
    }
    case "REOPEN_PERIOD": {
      const period = state.periods[action.payload.periodId];
      if (!period) throw new Error("Period not found");
      const hasSubsequent = Object.values(state.periods).some((p) => +new Date(p.startDate) > +new Date(period.startDate));
      if (hasSubsequent) throw new Error("Subsequent period exists");
      if (!action.payload.allowReopen) throw new Error("Requires elevated permission");
      return { ...state, periods: { ...state.periods, [period.id]: { ...period, status: "OPEN", closedAt: null, closedBy: null } } };
    }
    default:
      return state;
  }
}
