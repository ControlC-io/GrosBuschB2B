# System Architecture: DMZ vs Internal

This document defines the network topology and service communication rules for AppTemplate.

## Network Zones

### 1. DMZ Network (`dmz_net`)
* **Accessibility**: Publicly accessible via ports 80 and 443 (and 8080 for the admin panel).
* **Services**:
    * `reverse_proxy` (NGINX): The single entry point. Handles SSL termination and request routing.
    * `main_frontend_app` (React/Vite): Main user-facing app.
    * `admin_frontend_app` (React/Vite): Admin panel (port 8080).
* **Rules**:
    * Frontend containers cannot talk directly to the database.
    * NGINX forwards `/api/*` requests to the backend and serves each frontend by path/port.

### 2. Internal Network (`internal_net`)
* **Accessibility**: Strictly private. No ports exposed to the internet.
* **Services**:
    * `backend_api` (Express): Business logic, authentication, RBAC, database access.
    * `database` (PostgreSQL): Users, sessions, roles, system settings, audit logs.
    * `email_service`: Microservice that sends 2FA OTP emails via SendGrid.
* **Rules**:
    * The backend accepts traffic only from `reverse_proxy`.
    * The database accepts traffic only from `backend_api`.
    * The backend calls `email_service` for OTP delivery.

## Data Flow

1. **User Request** arrives at NGINX.
2. **Static Content**: NGINX serves from `main_frontend_app` or `admin_frontend_app`.
3. **API Request**: NGINX proxies `/api/*` to `http://backend_api:3000`.
4. **Backend** queries `database` via Prisma; may call `email_service` for 2FA emails.
5. **Response** flows back through NGINX to the user.

## Production Hardening

In `docker-compose.yml`, change `internal_net` to `internal: true` and remove the port mappings for PostgreSQL (`5432:5432`) and Prisma Studio (`5555:5555`) to prevent direct host access.
