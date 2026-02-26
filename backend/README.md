# BioScope Backend API

Express.js REST API backend for the BioScope IoT Environmental Monitoring System, powered by Supabase.

---

## 📁 Folder Structure

```
bioscope-backend/
├── src/
│   ├── index.js                  ← Entry point, Express app setup
│   ├── config/
│   │   └── supabase.js           ← Supabase admin + user clients
│   ├── middleware/
│   │   ├── auth.js               ← JWT authentication + role guards
│   │   ├── errorHandler.js       ← Global error handler
│   │   └── notFound.js           ← 404 handler
│   ├── controllers/              ← Business logic (one file per resource)
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── device.controller.js
│   │   ├── sensor.controller.js
│   │   ├── reading.controller.js
│   │   ├── actuator.controller.js
│   │   ├── control.controller.js
│   │   ├── alert.controller.js
│   │   ├── automation.controller.js
│   │   └── audit.controller.js
│   └── routes/                   ← Route definitions (one file per resource)
│       ├── auth.routes.js
│       ├── user.routes.js
│       ├── device.routes.js
│       ├── sensor.routes.js
│       ├── reading.routes.js
│       ├── actuator.routes.js
│       ├── control.routes.js
│       ├── alert.routes.js
│       ├── automation.routes.js
│       └── audit.routes.js
├── .env.example                  ← Copy to .env and fill in your values
├── .gitignore
└── package.json
```

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — Prerequisites
Make sure you have:
- **Node.js 18+** → https://nodejs.org
- **A Supabase project** → https://supabase.com (free tier works)

### Step 2 — Install dependencies
```bash
cd bioscope-backend
npm install
```

### Step 3 — Set up environment variables
```bash
cp .env.example .env
```
Then open `.env` and fill in your values:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...          # From Supabase Dashboard → Settings → API
SUPABASE_SERVICE_KEY=eyJhbGc...       # From Supabase Dashboard → Settings → API
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **SUPABASE_SERVICE_KEY** bypasses Row Level Security. Never expose it to the frontend. It only lives in this backend `.env` file.

### Step 4 — Load the database schema
In your **Supabase Dashboard → SQL Editor**, paste and run the contents of `bioscope_schema.sql`.

This creates all 13 tables, indexes, triggers, views, and sample data.

### Step 5 — Run the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

You should see:
```
🚀 BioScope API running on http://localhost:5000
📊 Environment: development
```

Test it:
```bash
curl http://localhost:5000/health
# → {"status":"OK","timestamp":"...","service":"BioScope API"}
```

### Step 6 — Connect your frontend
In your React frontend `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 📡 API Endpoints

All endpoints require `Authorization: Bearer <access_token>` except sign-up/sign-in.

### Auth  `/api/auth`
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | `/signup`             | Create new user      |
| POST   | `/signin`             | Sign in              |
| POST   | `/signout`            | Sign out             |
| POST   | `/refresh`            | Refresh access token |
| POST   | `/reset-password`     | Send reset email     |
| GET    | `/me`                 | Get current user     |
| PUT    | `/me`                 | Update profile       |

### Devices  `/api/devices`
| Method | Endpoint          | Roles              |
|--------|-------------------|--------------------|
| GET    | `/`               | All                |
| GET    | `/:id`            | All                |
| GET    | `/:id/summary`    | All                |
| POST   | `/`               | admin, operator    |
| PATCH  | `/:id`            | admin, operator    |
| DELETE | `/:id`            | admin              |

### Sensors  `/api/sensors`
| Method | Endpoint    | Roles           |
|--------|-------------|-----------------|
| GET    | `/types`    | All             |
| GET    | `/`         | All             |
| GET    | `/:id`      | All             |
| POST   | `/`         | admin, operator |
| PATCH  | `/:id`      | admin, operator |
| DELETE | `/:id`      | admin           |

### Readings  `/api/readings`
| Method | Endpoint    | Description               |
|--------|-------------|---------------------------|
| GET    | `/`         | Paginated readings         |
| GET    | `/latest`   | Latest reading per device  |
| GET    | `/stats`    | Avg/min/max stats          |
| GET    | `/chart`    | Chart-ready time series    |
| POST   | `/`         | Insert single or batch     |

### Actuators  `/api/actuators`
| Method | Endpoint        | Roles           |
|--------|-----------------|-----------------|
| GET    | `/`             | All             |
| GET    | `/:id`          | All             |
| POST   | `/`             | admin, operator |
| PATCH  | `/:id`          | admin, operator |
| PATCH  | `/:id/toggle`   | admin, operator |
| DELETE | `/:id`          | admin           |

### Controls  `/api/controls`
| Method | Endpoint | Description                       |
|--------|----------|-----------------------------------|
| GET    | `/`      | Control action history            |
| GET    | `/:id`   | Single control action             |
| POST   | `/`      | Trigger actuator control          |

### Alerts  `/api/alerts`
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | `/rules`              | All alert rules      |
| POST   | `/rules`              | Create rule          |
| PATCH  | `/rules/:id`          | Update rule          |
| DELETE | `/rules/:id`          | Delete rule (soft)   |
| GET    | `/active`             | Unresolved alerts    |
| GET    | `/`                   | All alerts           |
| POST   | `/`                   | Create alert         |
| PATCH  | `/:id/acknowledge`    | Acknowledge alert    |
| PATCH  | `/:id/resolve`        | Resolve alert        |

### Automation  `/api/automation`
| Method | Endpoint | Roles           |
|--------|----------|-----------------|
| GET    | `/`      | All             |
| GET    | `/:id`   | All             |
| POST   | `/`      | admin, operator |
| PATCH  | `/:id`   | admin, operator |
| DELETE | `/:id`   | admin           |

### Audit  `/api/audit`
| Method | Endpoint              | Roles              |
|--------|-----------------------|--------------------|
| GET    | `/`                   | admin, operator    |
| GET    | `/device/:deviceId`   | All                |
| POST   | `/`                   | All (own actions)  |

### Users  `/api/users`
| Method | Endpoint         | Roles  |
|--------|------------------|--------|
| GET    | `/preferences`   | All    |
| PATCH  | `/preferences`   | All    |
| GET    | `/`              | admin  |
| GET    | `/:id`           | admin  |
| PATCH  | `/:id`           | admin  |
| DELETE | `/:id`           | admin  |

---

## 🔐 Authentication Flow

1. User calls `POST /api/auth/signin` → gets `access_token` + `refresh_token`
2. Frontend stores tokens (memory or secure cookie)
3. Every API call includes `Authorization: Bearer <access_token>`
4. Backend verifies token via Supabase and attaches `req.user`
5. When token expires, call `POST /api/auth/refresh` with `refresh_token`

---

## 🌐 Connecting Frontend to Backend

In your React API files, replace direct Supabase calls with backend API calls:

```javascript
// Before (direct Supabase)
const { data } = await supabase.from('devices').select('*')

// After (through backend)
const res = await fetch(`${import.meta.env.VITE_API_URL}/devices`, {
  headers: { Authorization: `Bearer ${accessToken}` }
})
const { data } = await res.json()
```

Or keep using Supabase directly from the frontend for real-time subscriptions — the backend handles privileged operations.

---

## 🐛 Common Issues

| Problem | Fix |
|---------|-----|
| `SUPABASE_URL not set` | Copy `.env.example` to `.env` and fill values |
| `401 Unauthorized` | Token expired — call `/api/auth/refresh` |
| `403 Forbidden` | User role doesn't have permission |
| `Cannot find module` | Run `npm install` |
| CORS error from frontend | Set `FRONTEND_URL` in `.env` to your React dev URL |
| `relation does not exist` | Run `bioscope_schema.sql` in Supabase SQL Editor |
