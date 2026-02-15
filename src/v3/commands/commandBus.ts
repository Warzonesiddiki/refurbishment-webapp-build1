import type { V3Command, V3CommandName } from "@/v3/commands/types";

export type CommandHandler<T extends V3CommandName> = (command: V3Command<T>) => void;

export class InMemoryCommandBus {
  private handlers = new Map<V3CommandName, CommandHandler<V3CommandName>>();
  private seenIdempotencyKeys = new Set<string>();

  register<T extends V3CommandName>(name: T, handler: CommandHandler<T>) {
    this.handlers.set(name, handler as CommandHandler<V3CommandName>);
  }

  dispatch<T extends V3CommandName>(command: V3Command<T>) {
    if (this.seenIdempotencyKeys.has(command.idempotencyKey)) return "deduped" as const;

    const handler = this.handlers.get(command.name);
    if (!handler) throw new Error(`No command handler registered for ${command.name}`);

    handler(command as V3Command<V3CommandName>);
    this.seenIdempotencyKeys.add(command.idempotencyKey);
    return "processed" as const;
  }
}
