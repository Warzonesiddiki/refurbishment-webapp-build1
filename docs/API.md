# API Outline v1.0

## Inventory
- GET/POST /api/laptops
- GET/PUT/DELETE /api/laptops/:id
- GET/POST /api/parts
- GET/PUT/DELETE /api/parts/:id

## Receiving
- POST /api/lots/import/upload
- POST /api/lots/import/map
- POST /api/lots/import/preview
- POST /api/lots/import/commit
- POST /api/lots/verify/scan
- POST /api/laptops/grade

## Processing/WIP
- POST /api/wip
- POST /api/wip/:id/parts/add
- POST /api/wip/:id/parts/remove
- POST /api/wip/:id/labor
- POST /api/wip/:id/stage

## Sales
- POST /api/sales
- POST /api/sales/:id/receipts
- GET /api/sales

## Purchases
- POST /api/purchases
- POST /api/purchases/:id/payments
- GET /api/purchases

## Finance
- GET /api/cash
- POST /api/cash/entries
- GET /api/owner-ledger
- POST /api/owner-ledger
- GET /api/vat

All create endpoints require Idempotency-Key and log movement+audit entries.
