# RPLidar Terrain Mapping - Web Server

This is the web server component of the RPLidar C1 Terrain Mapping System. It provides a real-time web-based visualization interface for point cloud data streamed from RPLidar sensors.

## Features

- **Real-time visualization:** Canvas-based point cloud rendering at 20 FPS
- **WebSocket streaming:** Live updates via Socket.IO
- **Multi-drone support:** Handle multiple drones simultaneously
- **API key authentication:** Secure data ingestion
- **Database storage:** Scan metadata and drone registry
- **Statistics dashboard:** Real-time metrics and connection status

## Technology Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + tRPC
- **Database:** MySQL/TiDB (via Drizzle ORM)
- **WebSocket:** Socket.IO
- **Visualization:** HTML5 Canvas

## Installation

### Prerequisites

- Node.js 18 or higher
- pnpm package manager
- MySQL or TiDB database

### Setup

1. **Install dependencies:**
```bash
pnpm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

Required environment variables:
- `DATABASE_URL` - MySQL/TiDB connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_TITLE` - Application title
- Other OAuth and app settings (see .env.example)

3. **Initialize database:**
```bash
pnpm db:push
```

4. **Add API keys:**

Connect to your database and run:
```sql
INSERT INTO apiKeys (key, droneId, description, isActive)
VALUES ('your_secure_api_key_here', 'quiver_001', 'Quiver drone 001', 1);
```

## Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Production Deployment

### Option 1: Manus Platform (Recommended)

This project is designed to run on the Manus platform:

1. Import the project checkpoint
2. Click "Publish" in the dashboard
3. Configure domain and settings
4. Add API keys via the Database panel

### Option 2: Self-Hosting

1. **Build the application:**
```bash
pnpm build
```

2. **Start the production server:**
```bash
pnpm start
```

3. **Configure reverse proxy (nginx example):**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## API Endpoints

### tRPC Endpoints

All endpoints are under `/api/trpc`:

- **POST /pointcloud.ingest** - Receive point cloud data
- **GET /pointcloud.getDrones** - List active drones
- **GET /pointcloud.getRecentScans** - Get scan history
- **GET /pointcloud.getStats** - Get statistics

### WebSocket Events

Connect to `/socket.io/` for real-time updates:

**Client → Server:**
- `subscribe` - Subscribe to drone updates
- `unsubscribe` - Unsubscribe from drone

**Server → Client:**
- `pointcloud` - Full point cloud data
- `pointcloud_update` - Summary notification
- `drone_connected` - Drone connected event
- `drone_disconnected` - Drone disconnected event

## Database Schema

### Tables

**drones** - Drone registry
- `id` - Primary key
- `droneId` - Unique drone identifier
- `name` - Human-readable name
- `lastSeen` - Last data received timestamp
- `isActive` - Active status

**scans** - Scan metadata
- `id` - Primary key
- `droneId` - Associated drone
- `timestamp` - Scan capture time
- `pointCount` - Total points
- `validPoints` - Valid points
- `minDistance`, `maxDistance`, `avgDistance` - Distance statistics
- `avgQuality` - Average quality score

**apiKeys** - Authentication
- `id` - Primary key
- `key` - API key value
- `droneId` - Associated drone
- `isActive` - Active status

**users** - User accounts (OAuth)
- `id` - Primary key
- `openId` - OAuth identifier
- `name`, `email` - User info
- `role` - User role (admin/user)

## Usage

### Receiving Point Cloud Data

Send POST requests to `/api/trpc/pointcloud.ingest`:

```bash
curl -X POST https://your-server.com/api/trpc/pointcloud.ingest \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your_api_key_here",
    "data": {
      "drone_id": "quiver_001",
      "timestamp": "2025-01-05T14:32:18.456Z",
      "points": [...],
      "stats": {...}
    }
  }'
```

### Viewing Live Data

1. Open the web interface in a browser
2. Select a drone from the dropdown (if multiple)
3. Live point cloud visualization appears automatically
4. Use zoom controls to adjust view
5. Monitor statistics panel for metrics

## Configuration

### Database

Edit `drizzle/schema.ts` to modify the database schema, then run:

```bash
pnpm db:push
```

### Frontend

- **Components:** `client/src/components/`
- **Pages:** `client/src/pages/`
- **Styles:** `client/src/index.css`

### Backend

- **tRPC Routers:** `server/routers.ts`
- **Database Queries:** `server/db.ts`
- **WebSocket Logic:** `server/_core/index.ts`

## Troubleshooting

### Database Connection Issues

Check your `DATABASE_URL` format:
```
mysql://username:password@host:port/database
```

Enable SSL if required:
```
mysql://username:password@host:port/database?ssl={"rejectUnauthorized":true}
```

### WebSocket Connection Issues

Ensure your reverse proxy supports WebSocket upgrades:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
```

### API Key Authentication

Verify API keys in the database:
```sql
SELECT * FROM apiKeys WHERE isActive = 1;
```

Update last used timestamp:
```sql
UPDATE apiKeys SET lastUsed = NOW() WHERE key = 'your_key';
```

## Performance

### Recommended Limits

- **Concurrent clients:** 50-100 per server instance
- **Scan rate:** 10 Hz per drone
- **Points per scan:** 200-500
- **Bandwidth:** ~100 KB/s per drone

### Optimization

- Enable database connection pooling
- Use CDN for static assets
- Enable gzip compression
- Configure database indexes
- Monitor memory usage

## Security

### Best Practices

1. **API Keys:**
   - Generate secure random keys (32+ characters)
   - Store in database, never in code
   - Rotate regularly
   - Revoke compromised keys immediately

2. **Database:**
   - Use strong passwords
   - Enable SSL connections
   - Restrict network access
   - Regular backups

3. **Web Server:**
   - Use HTTPS in production
   - Set secure cookie flags
   - Configure CORS properly
   - Keep dependencies updated

## License

Part of the RPLidar C1 Terrain Mapping System.

---

For complete system documentation, see the parent `docs/` folder.
