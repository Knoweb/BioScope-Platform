# 🔬 BioScope — Environmental Monitor

A full-featured React.js frontend for the BioScope IoT environmental monitoring system with authentication, real-time data visualization, and remote device control.

## ✨ Features

- **🔐 Authentication System**: Login/Signup pages with protected routes
- **📊 Real-time Monitoring**: Live sensor data with auto-refresh
- **🎨 Enhanced UI**: Improved readability with larger fonts and lighter color scheme
- **📈 Data Visualization**: Interactive charts using Recharts
- **🎛️ Device Control**: Remote actuator management
- **🔔 Alert Management**: Configurable thresholds and notifications
- **📱 Responsive Design**: Mobile-optimized interface
- **🌐 Supabase Ready**: Pre-configured for Supabase integration

## Stack
- **React 18** + **React Router v6** — SPA with client-side routing
- **Recharts** — Area/line charts for sensor data
- **Vite** — Fast dev server and build tool
- **CSS Modules** — Scoped, maintainable styles
- **date-fns** — Date formatting
- **Supabase** (optional) — Backend as a Service

## Project Structure

```
src/
├── api/          # API client (all fetch calls in one place)
├── components/   # Reusable UI components
│   ├── Sidebar   # Navigation
│   ├── Topbar    # Header bar
│   ├── Charts    # Recharts wrappers
│   ├── Toast     # Notification system
│   └── UI        # MetricCard, Toggle, Badge, etc.
├── contexts/     # React Context providers
│   └── AuthContext  # Authentication state management
├── hooks/        # Custom React hooks (useReadings, useControls, useAuth, etc.)
├── lib/          # Third-party integrations
│   └── supabase  # Supabase client setup
├── pages/        # One file per route
│   ├── Login       # User login
│   ├── Signup      # User registration
│   ├── Dashboard   # Main overview
│   ├── Sensors     # Sensor readings
│   ├── Controls    # Device control
│   ├── History     # Historical data
│   ├── Reports     # Data reports
│   ├── Devices     # Device management
│   ├── Alerts      # Alert configuration
│   └── Settings    # User settings & logout
├── styles/       # global.css design tokens
└── utils/        # Formatters, helpers, CSV/JSON export
```

## Pages & Features

| Route       | Description | Status |
|-------------|-------------|--------|
| `/login`    | User authentication | ✅ |
| `/signup`   | User registration | ✅ |
| `/`         | Dashboard — live overview of all devices, quick controls, active alerts | ✅ |
| `/sensors`  | Per-device metrics + interactive area/line charts (1H / 24H range) | ✅ |
| `/controls` | Toggle Fan, Heater, Light per device; automation rules overview | ✅ |
| `/history`  | Paginated data table with search, sort, CSV/JSON export | ✅ |
| `/reports`  | Per-device stats (avg/min/max) and export options | ✅ |
| `/devices`  | Device registry with full hardware details, register new device | ✅ |
| `/alerts`   | Live alerts, configurable alert rules, notification channel status | ✅ |
| `/settings` | Preferences, notification toggles, data retention, account info, logout | ✅ |

## API Endpoints Used

```
BASE: https://wqhbf9x6-3000.asse.devtunnels.ms

GET  /api/readings/:deviceId?limit=n   — Fetch latest sensor readings
GET  /api/audit/:deviceId/hour|day     — Historical audit data
GET  /api/controls                      — All device control states
POST /api/controls/:deviceId           — Update actuator (fan/heater/light)
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- (Optional) Supabase account for production deployment

### Installation

```bash
# Install dependencies
npm install

# (Optional) Install Supabase for production
npm install @supabase/supabase-js

# Copy environment template
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Default Login (Development Mode)
Since auth is currently using localStorage mock:
- Any email/password combination will work
- User data persists in browser storage
- For production, configure Supabase (see SETUP-GUIDE.md)

## 🎨 UI Improvements

### Enhanced Readability
- **Increased Font Sizes**: All text is now 15-20% larger for better visibility
- **Lighter Color Scheme**: Changed from dark green (#030d09) to lighter tones (#0a1612)
- **Better Contrast**: Text colors improved from #81c784 to #9ed9b3
- **Accent Colors**: Primary green changed from #a8f5c6 to #7de3aa for better readability

### Before vs After
| Element | Before | After |
|---------|--------|-------|
| Base Background | `#030d09` | `#0a1612` |
| Primary Green | `#a8f5c6` | `#7de3aa` |
| Secondary Text | `#81c784` | `#9ed9b3` |
| Base Font Size | 14px | 16px |
| Section Headers | 14px | 16px |
| Metric Values | 36px | 42px |

## 🔐 Authentication

### Current Implementation (Development)
- Mock authentication using localStorage
- Persistent sessions across browser refreshes
- Protected routes with automatic redirect to login

### Production Setup (Supabase)
See [SETUP-GUIDE.md](./SETUP-GUIDE.md) for complete Supabase integration instructions including:
- Database schema
- Row Level Security policies
- Authentication configuration
- Real-time subscriptions

## Deploying to Vercel

```bash
npm install -g vercel
vercel --prod
```

> **Note:** Change `BASE` in `src/api/index.js` to your production API URL before deploying.

## Design System

Design tokens live in `src/styles/global.css` as CSS custom properties:
- `--green` / `--cyan` / `--amber` / `--red` — accent colours
- `--bg-base` / `--bg-surface` / `--bg-card` — surface layers
- `--font-display` (Outfit) + `--font-mono` (JetBrains Mono) — typography

## Auto-refresh

All sensor data pages auto-refresh every **15 seconds** via the `useInterval` hook.
The topbar "Refresh" button triggers an immediate manual refresh.
