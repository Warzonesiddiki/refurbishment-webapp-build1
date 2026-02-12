# Architecture

## Overview
The project follows a client-side React architecture with centralized app state and reducer-driven updates.

## State Management
- Context + reducer store in `src/store`
- Selectors and utilities for normalized reads
- Persistence abstraction for storage backends

## Module Structure
- Inventory, Parts, WIP, Sales, Finance, Reports, Settings modules
- Shared UI primitives and hooks in `src/components/ui` and `src/hooks`

## Data Flow
User interaction → action dispatch → reducer update → selectors/render → persistence write.

## Financial Integrity
Ledger utilities enforce cash/owner/VAT constraints and guardrails.

## Persistence Layer
LocalStorage + IndexedDB adapters, hydration, migration, and backup helpers.

## Audit System
Audit middleware/selectors/utils support activity tracing and integrity checks.

## Performance Optimizations
Memoized selectors/components, debounced/throttled callbacks, RAF scheduling.

## Security Considerations
Session/auth token flow, data masking helpers, and permission checks.
