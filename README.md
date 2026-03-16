# BioScope

BioScope is an IoT environmental monitoring and control platform for managing temperature, humidity, and light conditions across multiple growing units.

The project includes:
- a React frontend for dashboards, controls, reports, and user management
- an Express backend API connected to Supabase
- a PostgreSQL data model for devices, readings, alerts, automation, and audit history

## Overview

BioScope is built around a parent and child unit model:
- Parent units act as the main control hubs
- Child units represent monitored chambers or boxes
- Sensors collect environmental data from child units
- Actuators such as fans, heaters, and lights are controlled manually or automatically
- Alert and automation rules react to environmental changes

The platform supports:
- live monitoring
- historical charts and reporting
- manual actuator control
- rule-based automation
- alert acknowledgment and resolution
- role-based access and audit tracking

## Project Structure

```text
BioScope/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── config/             # Supabase config
│   │   ├── controllers/        # Resource controllers
│   │   ├── middleware/         # Auth, error handling, 404
│   │   ├── routes/             # API route definitions
│   │   └── index.js            # API entry point
│   ├── package.json
│   └── README.md
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── api/                # API wrappers
│   │   ├── components/         # Shared UI components
│   │   ├── contexts/           # Auth and theme context
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Supabase and app integrations
│   │   ├── pages/              # Route-level pages
│   │   ├── styles/             # Global styles
│   │   └── utils/              # Formatters and helpers
│   ├── package.json
│   ├── README.md
│   └── SETUP-GUIDE.md
├── DATABASE-README.md          # Technical database schema reference
├── DATABASE-CLIENT-README.md   # Client-facing database definitions
└── README.md                   # Project overview
```

## Main Features

### Monitoring
- Live temperature, humidity, and light monitoring
- Device-level dashboards and summaries
- Latest reading views and historical chart data
- Device online and offline visibility

### Control
- Manual control of fans, heaters, and lights
- Slot-based actuator assignment per device
- Control action history and status tracking
- Parent unit auto and manual control modes

### Automation
- Rule-based automatic actuator control
- Priority-based child unit evaluation
- Dead-band style state preservation
- Mutual exclusion handling for fan and heater

### Alerts
- Configurable alert rules
- Active and historical alert tracking
- Acknowledge and resolve flows
- Severity levels and notification channel support

### Users
- Authentication and protected routes
- Roles such as admin, operator, owner, and user
- User preferences for language, timezone, and notifications
- Full audit trail for critical changes

## Tech Stack

### Frontend
- React 18
- React Router 6
- Vite
- CSS Modules
- Recharts
- i18next
- Supabase client SDK

### Backend
- Node.js 18+
- Express
- Supabase JavaScript client
- Helmet
- CORS
- Morgan
- Express Rate Limit

### Data Layer
- Supabase PostgreSQL
- SQL views for active alerts, latest readings, and device summaries
- Audit logging and soft-delete patterns

## Frontend Summary

The frontend provides the operational interface for the system.

Main pages:
- Login
- Signup
- Dashboard
- Sensors
- Controls
- History
- Reports
- Devices
- Alerts
- Settings

Frontend capabilities include:
- protected routes
- chart-based visualization
- actuator toggles and rule displays
- CSV, JSON, and PDF export flows
- responsive UI
- periodic refresh for live data

Frontend code lives primarily in `frontend/src`.

## Backend Summary

The backend exposes the REST API used by the frontend and device integrations.

Base route groups:
- `/api/auth`
- `/api/users`
- `/api/devices`
- `/api/sensors`
- `/api/readings`
- `/api/actuators`
- `/api/controls`
- `/api/alerts`
- `/api/automation`
- `/api/audit`

Health endpoint:
- `GET /health`

The backend handles:
- authentication and authorization
- Supabase database access
- readings ingestion
- actuator and control state updates
- automation evaluation
- alert lifecycle operations
- audit logging

Backend code lives primarily in `backend/src`.

## Database Summary

The database is organized into these main domains:

### Device structure
- `parent_units`
- `child_units`
- `devices`
- `device_settings`

### Monitoring data
- `sensor_types`
- `sensors`
- `readings`

### Control and automation
- `actuators`
- `control_actions`
- `control_history`
- `automation_rules`

### Alerts and monitoring workflow
- `alert_rules`
- `alerts`
- `vw_active_alerts`
- `vw_device_summary`
- `vw_latest_readings`

### Users and governance
- `users`
- `user_preferences`
- `audit_log`

Supporting documents:
- `DATABASE-README.md` for the technical schema reference
- `DATABASE-CLIENT-README.md` for the simplified client-facing version

## Quick Start

### Prerequisites
- Node.js 18 or newer
- npm
- A Supabase project

### 1. Start the backend

```bash
cd backend
npm install
```

Create `backend/.env` with values similar to:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Run the API:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

### 2. Start the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` with values similar to:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the frontend:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

### 3. Verify the backend

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{"status":"OK","timestamp":"2026-03-16T00:00:00.000Z","service":"BioScope API"}
```

## Development Commands

### Backend

```bash
cd backend
npm run dev
npm start
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run preview
```

## API Summary

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/signout`
- `POST /api/auth/refresh`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `DELETE /api/auth/me`

### Devices
- `GET /api/devices`
- `GET /api/devices/:id`
- `GET /api/devices/:id/summary`
- `GET /api/devices/:id/slots`
- `GET /api/devices/:id/latest-state`
- `POST /api/devices`
- `PATCH /api/devices/:id`
- `PATCH /api/devices/:id/slots`
- `DELETE /api/devices/:id`

### Sensors
- `GET /api/sensors/types`
- `GET /api/sensors`
- `GET /api/sensors/:id`
- `POST /api/sensors`
- `PATCH /api/sensors/:id`
- `DELETE /api/sensors/:id`

### Readings
- `GET /api/readings`
- `GET /api/readings/latest`
- `GET /api/readings/stats`
- `GET /api/readings/chart`
- `POST /api/readings`

### Actuators
- `GET /api/actuators`
- `GET /api/actuators/:id`
- `POST /api/actuators`
- `PATCH /api/actuators/:id`
- `PATCH /api/actuators/:id/toggle`
- `DELETE /api/actuators/:id`

### Controls
- `GET /api/controls`
- `GET /api/controls/:id`
- `POST /api/controls`

### Alerts
- `GET /api/alerts/rules`
- `POST /api/alerts/rules`
- `PATCH /api/alerts/rules/:id`
- `DELETE /api/alerts/rules/:id`
- `GET /api/alerts/active`
- `GET /api/alerts`
- `POST /api/alerts`
- `PATCH /api/alerts/:id/acknowledge`
- `PATCH /api/alerts/:id/resolve`

### Automation
- `GET /api/automation`
- `GET /api/automation/:id`
- `POST /api/automation/evaluate/:device_id`
- `POST /api/automation`
- `PATCH /api/automation/:id`
- `DELETE /api/automation/:id`

### Audit
- `GET /api/audit`
- `GET /api/audit/device/:deviceId`
- `POST /api/audit`

### Users
- `GET /api/users/preferences`
- `PATCH /api/users/preferences`
- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`

## Architecture Notes

### Parent and child model
- A parent unit manages one or more child units
- Child units are the primary source of readings and attached sensors
- Parent units own settings and automation behavior

### Control slots
- Relay outputs are assigned using `device_settings`
- Slot mapping determines whether slot 1 or slot 2 controls fan, heater, or light

### Automation behavior
- Rules are evaluated against device readings
- Previous actuator states are preserved when no rule matches
- Fan and heater are treated as mutually exclusive outputs

### Time handling
- Database timestamps should be stored in UTC
- Frontend formatting should convert UTC timestamps for display

## Deployment Notes

### Frontend
- Vite build output can be deployed to Vercel or any static hosting platform
- `frontend/vercel.json` is available for Vercel deployment

### Backend
- Deploy as a Node.js service
- Keep `SUPABASE_SERVICE_KEY` server-side only
- Configure `FRONTEND_URL` correctly for CORS

### Database
- Use Supabase SQL editor or migrations to maintain schema
- Keep `DATABASE-CLIENT-README.md` as the client-facing data document
- Keep `DATABASE-README.md` as the engineering-level schema document

## Additional Documents

- `frontend/README.md` for frontend-only notes
- `backend/README.md` for backend-only notes
- `frontend/SETUP-GUIDE.md` for frontend setup detail
- `DATABASE-README.md` for the full schema reference
- `DATABASE-CLIENT-README.md` for simplified client documentation
- `DEPLOYMENT-DO-CICD.md` for DigitalOcean GitHub Actions deployment

## Notes

- The backend is the source of truth for business logic and database access
- The frontend consumes the backend API and renders operational dashboards
- Supabase is used for persistence and authentication infrastructure
- Audit history and control history should be preserved as operational records
