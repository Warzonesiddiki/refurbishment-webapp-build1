# Stack Recommendations for This Build

This project is currently **React + TypeScript frontend** with a lightweight **Java auth API** and PostgreSQL-ready data model. Based on your tool list, these are the best-fit choices:

## Recommended now (high ROI)

1. **Database: PostgreSQL**
   - Already aligned with current `docker-compose.yml` and migration scripts.
   - Strong relational guarantees for ERP-style data.

2. **Backend/API: Java Spring Boot (or keep lightweight Java server short-term)**
   - You already have Java code and auth endpoints.
   - Spring Boot is the most practical upgrade path for robust API, validation, and security.

3. **Frontend: Keep React + Tailwind CSS**
   - Already implemented and integrated.
   - Lowest migration risk and fastest iteration.

4. **Data tables: AG Grid (selective usage for heavy ERP pages)**
   - Best for large/complex inventory/finance grids (sorting/filtering/grouping/virtualization).

5. **Reporting/BI: Metabase**
   - Fast on-prem analytics setup directly against PostgreSQL.
   - Useful for management dashboards with minimal engineering work.

6. **Excel integration: Apache POI (Java)**
   - Natural fit with Java backend for import/export automation.

7. **Background jobs: Quartz Scheduler (Java)**
   - Good for periodic tasks (auto backup, reconciliation, reminders).

8. **Auth/Roles: Keycloak**
   - On-prem SSO + RBAC with enterprise-grade flow.

9. **File storage: MinIO**
   - S3-compatible object storage for backup files and document attachments.

10. **Barcode/QR: JsBarcode (frontend) + ZXing (Java)**
    - JsBarcode for browser rendering.
    - ZXing for backend decoding/validation flows.

11. **PDF generation: pdfmake (JS) or iText (Java)**
    - pdfmake for frontend print-friendly docs.
    - iText for backend signed/generated official outputs.

12. **DevOps/Packaging: GitHub Actions + Docker Compose**
    - Already in progress; completes reproducible local/prod-like deployment.

13. **Monitoring: Sentry + Grafana/Prometheus (phase 2)**
    - Sentry first for frontend/runtime errors.
    - Prometheus/Grafana once backend services scale.

## Optional later (scale-dependent)
- **RabbitMQ/Kafka**: add only when async/event throughput demands it.
- **Kubernetes**: add only after multiple services and environments become hard to manage with Compose.
- **OCR tools**: only if document ingestion becomes a core workflow.

## Not recommended for this stage
- Full frontend migration (Vue/Angular/Svelte) — high risk, low immediate value.
- SQL Server/MySQL switch — unnecessary while PostgreSQL path is already established.
