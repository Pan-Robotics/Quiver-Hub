# Quiver Hub

**UAV Data Pipeline Platform**

Quiver Hub is a modular web platform for managing and visualizing multiple UAV (drone) data pipelines in a unified interface. Built with a modern tech stack, it provides a flexible app-based architecture where different data sources and visualization tools can be added as independent modules.

---

## Overview

Quiver Hub transforms traditional single-purpose drone data viewers into a comprehensive platform where multiple data pipelines coexist. The platform features:

- **Modular App Architecture** - Each data pipeline is an independent app module
- **Unified Interface** - Single hub for all UAV data sources
- **Real-time Updates** - WebSocket-based live data streaming
- **Multi-drone Support** - Handle data from multiple drones simultaneously
- **Extensible Design** - Easy to add new apps and data pipelines
- **Self-hosted** - Deploy on any cloud platform or on-premise

---

## Current Apps

### 1. RPLidar Terrain Mapping
Real-time LiDAR point cloud visualization with:
- Live 2D point cloud rendering on HTML5 canvas
- Heatmap accumulation mode for persistent mapping
- Distance and quality-based point filtering
- Zoom, pan, and reset controls
- Connection status and statistics display

### 2. Flight Telemetry
Real-time flight controller and battery monitoring:
- Attitude display (roll, pitch, yaw)
- GPS position and satellite status
- Battery voltage, current, temperature
- Real-time updates via WebSocket

---

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/quiver-hub.git
cd quiver-hub

# Copy environment file
cp .env.example .env

# Edit .env with your settings (especially JWT_SECRET)
nano .env

# Start with Docker Compose
docker-compose up -d
```

The application will be available at `http://localhost:3000`.

### Manual Installation

```bash
# Prerequisites: Node.js 20+, MySQL/MariaDB, pnpm

# Install dependencies
pnpm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Push database schema
pnpm db:push

# Start development server
pnpm dev

# Or build and run production
pnpm build
pnpm start
```

---

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL=mysql://user:password@localhost:3306/quiver_hub
JWT_SECRET=your-secure-secret-key

# Optional - creates admin user on first startup
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-admin-password

# Feature flags
ALLOW_REGISTRATION=true

# Application settings
APP_NAME=Quiver Hub
PORT=3000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT token signing |
| `ADMIN_EMAIL` | No | Initial admin user email |
| `ADMIN_PASSWORD` | No | Initial admin user password |
| `ALLOW_REGISTRATION` | No | Allow new user registration (default: true) |
| `PORT` | No | Server port (default: 3000) |
| `VITE_APP_TITLE` | No | Application title in UI |
| `VITE_APP_LOGO` | No | Application logo URL |

---

## Architecture

### Frontend
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State Management**: tRPC React Query
- **Real-time**: Socket.IO client

### Backend
- **Runtime**: Node.js + Express
- **API**: tRPC 11 (type-safe RPC)
- **Database**: MySQL/MariaDB (via Drizzle ORM)
- **Real-time**: Socket.IO server
- **Auth**: JWT-based local authentication

### Key Directories

```
client/
  src/
    components/
      AppSidebar.tsx          ← Sidebar navigation with app icons
      apps/
        LidarApp.tsx          ← RPLidar visualization app
        TelemetryApp.tsx      ← Flight telemetry app
        AppStore.tsx          ← App marketplace UI
      PointCloudViewer.tsx    ← Canvas-based point cloud renderer
    pages/
      Home.tsx                ← Main hub layout
      Login.tsx               ← Authentication page
server/
  routers.ts                  ← tRPC API endpoints
  rest-api.ts                 ← REST API for external integrations
  db.ts                       ← Database queries
  _core/
    auth.ts                   ← JWT authentication service
    index.ts                  ← Express server setup
drizzle/
  schema.ts                   ← Database schema
```

---

## Deployment

### Docker Compose (Recommended)

The included `docker-compose.yml` sets up both the application and MySQL:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker (Application Only)

```bash
# Build image
docker build -t quiver-hub .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host/db" \
  -e JWT_SECRET="your-secret" \
  quiver-hub
```

### Cloud Platforms

#### Railway / Render / Fly.io

1. Connect your repository
2. Set environment variables
3. Deploy

#### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: quiver-hub
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: quiver-hub
        image: your-registry/quiver-hub:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: quiver-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: quiver-secrets
              key: jwt-secret
```

---

## API Reference

### REST Endpoints

#### POST /api/rest/pointcloud/ingest
Ingest point cloud data from external sources (e.g., Python scripts on companion computer).

**Request Body:**
```json
{
  "api_key": "string",
  "drone_id": "string",
  "timestamp": "ISO8601",
  "points": [
    {
      "angle": 0.0,
      "distance": 1000.0,
      "quality": 63,
      "x": 1000.0,
      "y": 0.0
    }
  ],
  "stats": {
    "point_count": 800,
    "valid_points": 750,
    "min_distance": 100.0,
    "max_distance": 8000.0,
    "avg_distance": 2500.0,
    "avg_quality": 45.0
  }
}
```

#### GET /api/rest/health
Health check endpoint.

#### GET /api/rest/pointcloud/latest/:droneId
Polling fallback for latest scan data.

### Authentication Endpoints

#### POST /api/auth/register
Register a new user.

#### POST /api/auth/login
Login with email/password.

#### POST /api/auth/logout
Clear session.

### WebSocket Events

#### Client → Server
- `subscribe` - Subscribe to drone updates
- `unsubscribe` - Unsubscribe from drone

#### Server → Client
- `pointcloud` - New point cloud data
- `telemetry` - New telemetry data

---

## Adding New Apps

### 1. Create App Component

```tsx
// client/src/components/apps/YourApp.tsx
export default function YourApp() {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-card px-6 py-4">
        <h2 className="text-xl font-semibold">Your App Name</h2>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        {/* Your visualization here */}
      </div>
    </div>
  );
}
```

### 2. Register in Home.tsx

```tsx
import YourApp from "@/components/apps/YourApp";

const apps: App[] = [
  // ... existing apps
  { id: "your-app", name: "Your App", icon: YourIcon, enabled: true },
];

// Add to renderApp() switch
case "your-app":
  return <YourApp />;
```

### 3. Add Backend Endpoints (if needed)

```tsx
// server/routers.ts
yourApp: router({
  getData: publicProcedure.query(async () => {
    // Your data fetching logic
  }),
}),
```

---

## Hardware Integration

### RPLidar Setup

**Components:**
- RPLidar C1 (360° laser scanner)
- Raspberry Pi (data collection)
- Companion Computer (data forwarding)

**Data Flow:**
```
Raspberry Pi (RPLidar C1)
  → TCP Stream →
Companion Computer (Forwarder)
  → HTTP POST →
Quiver Hub (Web Server)
  → WebSocket →
Browser (Visualization)
```

**Forwarder Configuration:**
```bash
WEB_SERVER_URL=https://your-hub.example.com/api/rest/pointcloud/ingest
API_KEY=your_api_key
DRONE_ID=quiver_001
UPDATE_INTERVAL=10
```

---

## Development

### Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Run production server
pnpm check        # TypeScript type checking
pnpm format       # Format code with Prettier
pnpm test         # Run tests
pnpm db:push      # Generate and apply migrations
```

### Project Structure

```
quiver-hub/
├── client/              # React frontend
├── server/              # Express backend
├── drizzle/             # Database schema
├── shared/              # Shared types
├── Dockerfile           # Container build
├── docker-compose.yml   # Multi-service setup
└── .env.example         # Environment template
```

---

## License

MIT License - See LICENSE file for details.

---

## Contributing

Contributions welcome! Please open an issue or pull request.

---

## Support

- GitHub Issues: [Create an issue](https://github.com/your-org/quiver-hub/issues)
