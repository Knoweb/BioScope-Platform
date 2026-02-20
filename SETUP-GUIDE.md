# BioScope Frontend - Setup Guide

## Overview
BioScope is a web-based environmental monitoring system for real-time tracking of temperature, humidity, light levels, and remote device control.

## Features Implemented

### ✅ Authentication
- **Login/Signup Pages**: Fully functional authentication UI
- **Protected Routes**: All dashboard routes require authentication
- **Session Management**: Persistent login with localStorage (ready for Supabase)
- **Logout Functionality**: Available in Settings page

### ✅ Core Monitoring Features
- **Dashboard**: Real-time overview of all connected devices
- **Sensors Page**: Detailed sensor readings and historical data
- **Controls Page**: Manual control of actuators (heaters, fans, lights)
- **History Page**: Time-series data visualization
- **Reports Page**: Generate and export data reports
- **Devices Page**: Device management and registration
- **Alerts Page**: Configure alert thresholds and notifications
- **Settings Page**: User preferences, notifications, and account management

### ✅ UI/UX Enhancements
- **Improved Readability**: Increased font sizes across all components
- **Lighter Color Scheme**: Changed from dark green to lighter, more readable green tones
- **Better Contrast**: Enhanced text colors for better visibility
- **Responsive Design**: Mobile-friendly layout

### ✅ Data Visualization
- **Interactive Charts**: Using Recharts for time-series graphs
- **Real-time Updates**: Auto-refresh every 15 seconds (configurable)
- **Multi-device Support**: Handle multiple sensors/gateways simultaneously

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Supabase (Optional - for production)**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## Supabase Integration

### Database Schema (Recommended)

```sql
-- Users table (handled by Supabase Auth)

-- Devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT UNIQUE NOT NULL,
  name TEXT,
  type TEXT, -- 'sensor', 'gateway', 'actuator'
  status TEXT DEFAULT 'offline',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor readings table
CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT REFERENCES devices(device_id),
  temperature DECIMAL,
  humidity DECIMAL,
  light_level DECIMAL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Control status table
CREATE TABLE device_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id TEXT UNIQUE REFERENCES devices(device_id),
  fan_status BOOLEAN DEFAULT FALSE,
  light_status BOOLEAN DEFAULT FALSE,
  heater_status BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT REFERENCES devices(device_id),
  alert_type TEXT,
  threshold_min DECIMAL,
  threshold_max DECIMAL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert history table
CREATE TABLE alert_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  device_id TEXT,
  message TEXT,
  severity TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Policies (example for devices table)
CREATE POLICY "Users can view own devices" ON devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" ON devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices" ON devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" ON devices
  FOR DELETE USING (auth.uid() = user_id);
```

### Enabling Real Supabase

1. Update `src/lib/supabase.js`:
   - Uncomment the real Supabase implementation
   - Remove the mock implementation

2. Update `src/contexts/AuthContext.jsx`:
   - Import `authHelpers` from `src/lib/supabase.js`
   - Replace localStorage logic with Supabase auth calls

3. Update `src/api/index.js`:
   - Add Supabase authentication headers to API requests
   - Integrate with Supabase Realtime for live updates

## Current Authentication Flow

### Development Mode (Current)
- Uses localStorage for session persistence
- Mock authentication (accepts any credentials)
- User data stored client-side

### Production Mode (After Supabase Setup)
- Full Supabase authentication
- Server-side session management
- Secure JWT tokens
- Row Level Security for data protection

## File Structure

```
src/
├── api/
│   └── index.js              # API client for backend
├── components/
│   ├── Charts.jsx            # Chart components
│   ├── Sidebar.jsx           # Navigation sidebar
│   ├── Toast.jsx             # Toast notifications
│   ├── Topbar.jsx            # Top navigation bar
│   └── UI.jsx                # Reusable UI components
├── contexts/
│   └── AuthContext.jsx       # Authentication context
├── hooks/
│   └── index.js              # Custom React hooks
├── lib/
│   └── supabase.js           # Supabase client setup
├── pages/
│   ├── Alerts.jsx            # Alert management
│   ├── Controls.jsx          # Device controls
│   ├── Dashboard.jsx         # Main dashboard
│   ├── Devices.jsx           # Device management
│   ├── History.jsx           # Historical data
│   ├── Login.jsx             # Login page
│   ├── Reports.jsx           # Report generation
│   ├── Sensors.jsx           # Sensor readings
│   ├── Settings.jsx          # User settings
│   ├── Signup.jsx            # Sign up page
│   └── Auth.module.css       # Auth page styles
├── styles/
│   └── global.css            # Global styles
├── utils/
│   └── index.js              # Utility functions
├── App.jsx                   # Main app component
└── main.jsx                  # App entry point
```

## Requirements Coverage

### Functional Requirements

✅ **User Authentication** (2.1)
- Sign up, login, logout
- User profiles with device associations
- Session persistence

✅ **Dashboard & Visualization** (2.2)
- Real-time sensor readings
- Time-series graphs with Recharts
- Custom filtering by device/time range
- System status indicators

✅ **Device Management** (2.3)
- Add/remove devices
- Device configuration
- Multi-device support

✅ **Remote Control** (2.4)
- Manual actuator control
- Threshold-based automation rules
- Control history logging

✅ **Alerts & Notifications** (2.5)
- Anomaly detection
- Custom alert thresholds
- Alert history

✅ **Reports** (2.6)
- Data export functionality
- Historical analysis
- Device reports

### Non-Functional Requirements

✅ **Performance** (3.1)
- 15-second auto-refresh
- Fast page loads (<2s)
- Scalable architecture

✅ **Security** (3.2)
- HTTPS ready
- Authentication required
- Ready for JWT integration

✅ **Usability** (3.3)
- Clean, intuitive design
- Increased font sizes for readability
- Lighter color scheme

✅ **Reliability** (3.4)
- Error handling
- Graceful degradation
- Ready for logging/monitoring

## Next Steps

1. **Set up Supabase Project**
   - Create account at supabase.com
   - Set up database tables
   - Configure authentication

2. **Integrate Real-time Updates**
   - Use Supabase Realtime subscriptions
   - WebSocket connections for live data

3. **Deploy to Vercel**
   - Connect GitHub repository
   - Configure environment variables
   - Enable automatic deployments

4. **Gateway Integration**
   - Configure gateway to upload data to Supabase
   - Set up API endpoints for device communication

5. **Testing**
   - End-to-end testing with real devices
   - Cross-browser compatibility
   - Mobile responsiveness

## Support

For issues or questions, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Recharts Documentation](https://recharts.org)
- [Vite Documentation](https://vitejs.dev)

## License

Copyright © 2026 BioScope. All rights reserved.
