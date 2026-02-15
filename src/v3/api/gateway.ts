import type {
  JournalParityQueryRequest,
  JournalParityQueryResponse,
  JournalQueryRequest,
  JournalQueryResponse,
  V3CommandRequest,
  V3CommandResponse,
} from "@/v3/api/contracts";
import { InMemoryCommandBus } from "@/v3/commands/commandBus";
import type { V3CommandName } from "@/v3/commands/types";
import { InMemoryEventStore } from "@/v3/events/eventStore";
import {
  projectJournalRows,
  rebuildJournalProjectionFromEvents,
  type JournalRow,
} from "@/v3/finance/journalProjection";
import { buildJournalParityReport } from "@/v3/migration/parityMonitor";
import {
  InMemoryProjectionSnapshotAdapter,
  JournalProjectionWorker,
  type ProjectionSnapshotAdapter,
} from "@/v3/projections/projectionWorker";

export class InMemoryV3Gateway {
  private readonly bus = new InMemoryCommandBus();
  private readonly store = new InMemoryEventStore();
  private readonly projectionWorker: JournalProjectionWorker;

  constructor(
    private readonly tenantId: string,
    private readonly authToken: string,
    options?: {
      snapshotKey?: string;
      snapshotAdapter?: ProjectionSnapshotAdapter;
      projectionRebuildThreshold?: number;
    },
  ) {
    this.projectionWorker = new JournalProjectionWorker({
      snapshotKey: options?.snapshotKey ?? `v3:journal:${tenantId}`,
      adapter: options?.snapshotAdapter ?? new InMemoryProjectionSnapshotAdapter(),
      rebuildThreshold: options?.projectionRebuildThreshold,
    });

    this.registerCommandHandlers();
  }

  executeCommand(request: V3CommandRequest): V3CommandResponse {
    const authError = this.validateAuth(request.tenantId, request.authToken);
    if (authError) return authError;

    const status = this.bus.dispatch(request.command);
    const events = this.store.all();
    const lastEvent = events.at(-1);
    if (lastEvent) {
      this.projectionWorker.applyEvent(lastEvent, events);
    }

    return {
      ok: true,
      status,
      eventId: lastEvent?.id,
    };
  }

  queryJournal(request: JournalQueryRequest): JournalQueryResponse {
    const authError = this.validateAuth(request.tenantId, request.authToken);
    if (authError) return authError;

    const now = request.nowIso ? new Date(request.nowIso) : new Date();
    const rows = this.limitRows(this.filterRows(projectJournalRows(this.store.all()), request, now), request.limit ?? 200);

    return {
      ok: true,
      rows,
      snapshot: this.projectionWorker.getSnapshot().eventCount > 0 ? this.projectionWorker.getSnapshot() : rebuildJournalProjectionFromEvents(this.store.all()),
    };
  }

  queryJournalParity(request: JournalParityQueryRequest): JournalParityQueryResponse {
    const authError = this.validateAuth(request.tenantId, request.authToken);
    if (authError) return authError;

    const report = buildJournalParityReport({
      legacyRows: request.legacyRows,
      v3Rows: this.projectionWorker.getRows(),
    });

    return {
      ok: true,
      ...report,
    };
  }

  runScheduledProjectionRebuild() {
    return this.projectionWorker.rebuild(this.store.all(), "scheduled");
  }

  private registerCommandHandlers() {
    const map: Record<V3CommandName, (command: any) => void> = {
      RecordSale: (command) => {
        this.store.append({
          tenantId: command.tenantId,
          aggregateId: command.payload.saleId,
          name: "SaleRecorded",
          payload: command.payload,
        });
      },
      RecordPurchase: (command) => {
        this.store.append({
          tenantId: command.tenantId,
          aggregateId: command.payload.purchaseId,
          name: "PurchaseRecorded",
          payload: command.payload,
        });
      },
      RecordReceipt: (command) => {
        this.store.append({
          tenantId: command.tenantId,
          aggregateId: command.payload.receiptId,
          name: "ReceiptRecorded",
          payload: command.payload,
        });
      },
      RecordPayment: (command) => {
        this.store.append({
          tenantId: command.tenantId,
          aggregateId: command.payload.paymentId,
          name: "PaymentRecorded",
          payload: command.payload,
        });
      },
    };

    (Object.keys(map) as V3CommandName[]).forEach((name) => {
      this.bus.register(name, map[name] as never);
    });
  }

  private validateAuth(requestTenantId: string, requestAuthToken: string) {
    if (requestAuthToken !== this.authToken) {
      return { ok: false as const, error: "unauthorized" as const, message: "Invalid auth token" };
    }

    if (requestTenantId !== this.tenantId) {
      return { ok: false as const, error: "tenant_mismatch" as const, message: "Tenant routing mismatch" };
    }

    return null;
  }

  private filterRows(rows: JournalRow[], request: JournalQueryRequest, now: Date) {
    const scope = request.scope ?? "all";
    const window = request.window ?? "all-time";
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30 = new Date(now);
    last30.setDate(now.getDate() - 30);

    return rows.filter((row) => {
      const matchesScope = scope === "all" || row.source === scope;
      if (!matchesScope) return false;
      if (window === "all-time") return true;

      const rowDate = new Date(row.date);
      if (Number.isNaN(rowDate.getTime())) return false;
      if (window === "this-month") return rowDate >= monthStart;
      return rowDate >= last30;
    });
  }

  private limitRows(rows: JournalRow[], limit: number) {
    if (limit <= 0) return [];
    return rows.slice(0, limit);
  }
}
