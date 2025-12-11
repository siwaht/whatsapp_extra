# Local Evolution API Integration

Your application now includes a fully integrated local Evolution API setup that runs automatically with Docker Compose. No more manual configuration or external API dependencies!

## What Changed

### 1. Docker Compose Setup
A complete Docker environment with four services:
- **PostgreSQL** - Database for Evolution API
- **Redis** - Cache and session management
- **Evolution API v2.1.1** - WhatsApp integration
- **Next.js App** - Your application

### 2. Automatic Version Management
New Evolution API Management dashboard in Settings > API that shows:
- Current installed version
- Latest available version
- One-click version updates
- Update history tracking
- Installation status

### 3. Simplified Configuration
- No more manual API URL configuration
- Automatic service discovery via Docker network
- Pre-configured database and cache connections
- Secure defaults out of the box

### 4. Enhanced Database
New tables for tracking Evolution API versions and updates:
- `evolution_api_status` - Current and latest versions
- `evolution_api_update_history` - Complete update log

## Quick Start

### 1. Configure Environment Variables

Update your `.env` file with secure passwords:

```env
# Change these to secure values
POSTGRES_PASSWORD=your_secure_password_here
EVOLUTION_API_KEY=generate_a_secure_random_key_min_32_chars
```

### 2. Start All Services

```bash
npm run docker:up
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Evolution API on port 8080
- Next.js app on port 3000

### 3. Access the Application

Open http://localhost:3000 and log in. The Evolution API is automatically connected and ready to use!

## New Features

### Evolution API Management Dashboard

Navigate to **Settings > API** to:
- View current Evolution API version
- Check for new versions automatically
- Update to latest version with one click
- View installation details and status
- See update history

### Convenient Docker Commands

```bash
# View logs from all services
npm run docker:logs

# View Evolution API logs specifically
npm run docker:logs:evolution

# Restart Evolution API
npm run docker:restart:evolution

# Update Evolution API to latest version
npm run docker:update:evolution

# Stop all services
npm run docker:down
```

## Automatic Updates

The system includes intelligent version checking:

1. Checks Docker Hub for new Evolution API versions
2. Compares with your installed version
3. Shows notification when updates available
4. One-click update process
5. Automatic rollback on failure

## Migration from External API

If you were using an external Evolution API:

1. Your existing configuration is preserved in the database
2. The new local setup runs independently
3. You can recreate your instances in the local Evolution API
4. All webhooks automatically point to your app

## Documentation

See `DOCKER_SETUP.md` for comprehensive documentation including:
- Detailed setup instructions
- Troubleshooting guide
- Backup and restore procedures
- Production deployment checklist
- Security best practices

## Benefits

✅ No external API dependencies
✅ Consistent local development environment
✅ Automatic updates with version tracking
✅ Complete control over your data
✅ Easier debugging and testing
✅ Production-ready Docker setup
✅ Built-in monitoring and health checks

## Next Steps

1. Start the services: `npm run docker:up`
2. Create WhatsApp instances in the app
3. Connect your phone numbers
4. Start building automations!

For help, see `DOCKER_SETUP.md` or check the logs with `npm run docker:logs`.
