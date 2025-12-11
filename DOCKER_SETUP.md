# Docker Setup Guide

This guide explains how to run WhatsAppX with Evolution API using Docker Compose. The application now includes a local Evolution API instance that runs alongside your Next.js application, PostgreSQL database, and Redis cache.

## Overview

The Docker setup includes four main services:

1. **PostgreSQL** - Database for Evolution API data storage
2. **Redis** - Cache and session management
3. **Evolution API v2** - WhatsApp Business API integration
4. **Next.js Application** - Your main application

## Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)
- Git (for cloning the repository)

### Verify Installation

```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone and Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-directory>

# Copy the environment template
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file and update the following required variables:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# PostgreSQL Configuration (Change in production!)
POSTGRES_USER=evolution
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=evolution

# Evolution API Configuration
EVOLUTION_API_KEY=generate_a_secure_random_key_min_32_chars
EVOLUTION_SERVER_URL=http://localhost:8080

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important Security Notes:**
- Change `POSTGRES_PASSWORD` to a strong, unique password
- Generate a secure random key for `EVOLUTION_API_KEY` (minimum 32 characters)
- Never commit your `.env` file to version control

### 3. Start the Services

```bash
# Start all services in detached mode
npm run docker:up

# Or use docker-compose directly
docker-compose up -d
```

The services will start in the following order:
1. PostgreSQL and Redis start first
2. Evolution API waits for database and cache to be healthy
3. Next.js application starts last

### 4. Verify Services

Check that all services are running:

```bash
npm run docker:ps
```

You should see all four services with status "Up".

### 5. Access the Application

- **Application**: http://localhost:3000
- **Evolution API**: http://localhost:8080

## Available Docker Commands

The project includes convenient npm scripts for Docker management:

### Starting and Stopping

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# Stop and remove all volumes (WARNING: Deletes all data)
npm run docker:clean
```

### Viewing Logs

```bash
# View logs from all services
npm run docker:logs

# View logs from specific services
npm run docker:logs:app        # Next.js application
npm run docker:logs:evolution  # Evolution API
npm run docker:logs:postgres   # PostgreSQL
npm run docker:logs:redis      # Redis
```

### Restarting Services

```bash
# Restart all services
npm run docker:restart

# Restart Evolution API only
npm run docker:restart:evolution
```

### Updating

```bash
# Pull latest images and update all services
npm run docker:update

# Update Evolution API only
npm run docker:update:evolution
```

### Building

```bash
# Rebuild all images
npm run docker:build

# Rebuild and start
npm run docker:build && npm run docker:up
```

## Evolution API Management

### Automatic Version Updates

The application includes an automatic update system for Evolution API:

1. Navigate to **Settings > API** in the application
2. Click "Check for Updates" to see if a new version is available
3. Click "Update Now" to initiate the update process
4. The system will pull the latest Docker image and restart the container

### Manual Updates

You can also update Evolution API manually:

```bash
# Pull the latest Evolution API image
docker-compose pull evolution-api

# Restart with the new image
docker-compose up -d evolution-api
```

## Data Persistence

All data is persisted in Docker volumes:

- `postgres_data` - PostgreSQL database files
- `redis_data` - Redis cache data
- `evolution_instances` - Evolution API instance configurations
- `evolution_store` - Evolution API media and files

### Backup

To backup your data:

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U evolution evolution > backup.sql

# Backup volumes
docker run --rm -v postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Restore

To restore from backup:

```bash
# Restore PostgreSQL
docker-compose exec -T postgres psql -U evolution evolution < backup.sql

# Restore volumes
docker run --rm -v postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## Troubleshooting

### Services Won't Start

1. Check if ports are already in use:
   ```bash
   lsof -i :3000  # Next.js
   lsof -i :8080  # Evolution API
   lsof -i :5432  # PostgreSQL
   lsof -i :6379  # Redis
   ```

2. View service logs for errors:
   ```bash
   npm run docker:logs
   ```

3. Restart Docker daemon:
   ```bash
   # Linux
   sudo systemctl restart docker

   # macOS/Windows
   # Restart Docker Desktop
   ```

### Evolution API Connection Issues

1. Verify Evolution API is running:
   ```bash
   curl http://localhost:8080
   ```

2. Check Evolution API logs:
   ```bash
   npm run docker:logs:evolution
   ```

3. Restart Evolution API:
   ```bash
   npm run docker:restart:evolution
   ```

### Database Connection Issues

1. Check PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   ```

2. Test database connection:
   ```bash
   docker-compose exec postgres psql -U evolution -d evolution -c "SELECT 1;"
   ```

3. View database logs:
   ```bash
   npm run docker:logs:postgres
   ```

### Out of Disk Space

1. Remove unused Docker resources:
   ```bash
   docker system prune -a
   ```

2. Remove old images:
   ```bash
   docker image prune -a
   ```

### Reset Everything

To completely reset and start fresh:

```bash
# Stop all services
npm run docker:down

# Remove all volumes (WARNING: Deletes all data!)
npm run docker:clean

# Start fresh
npm run docker:up
```

## Production Deployment

### Security Checklist

Before deploying to production:

- [ ] Change all default passwords in `.env`
- [ ] Use strong, randomly generated API keys
- [ ] Enable HTTPS/SSL for all services
- [ ] Configure firewall rules to restrict access
- [ ] Set up automated backups
- [ ] Enable monitoring and logging
- [ ] Review and update Evolution API configuration
- [ ] Set appropriate resource limits in docker-compose.yml

### Resource Limits

Add resource limits to docker-compose.yml for production:

```yaml
services:
  evolution-api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Environment-Specific Configuration

Create separate environment files:

```bash
.env.development  # Development settings
.env.staging      # Staging settings
.env.production   # Production settings
```

Use the appropriate file with:

```bash
docker-compose --env-file .env.production up -d
```

## Network Configuration

### Custom Networks

The services communicate via the `evolution_network` bridge network. This isolates them from other Docker containers and allows service discovery by name.

### External Access

To expose Evolution API externally (not recommended for production):

```yaml
services:
  evolution-api:
    ports:
      - "8080:8080"  # Change first port to expose on different port
```

## Monitoring

### Health Checks

All services include health checks:

```bash
# View health status
docker-compose ps
```

### Resource Usage

Monitor resource usage:

```bash
# Real-time stats
docker stats

# Specific container
docker stats evolution_api
```

## Additional Resources

- [Evolution API Documentation](https://doc.evolution-api.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

## Support

If you encounter issues:

1. Check the logs: `npm run docker:logs`
2. Review this documentation
3. Search existing GitHub issues
4. Create a new issue with:
   - Docker version
   - Docker Compose version
   - Operating system
   - Error logs
   - Steps to reproduce

## Migration from External Evolution API

If you were previously using an external Evolution API:

1. **Backup your data** from the external Evolution API
2. **Export instance configurations** if needed
3. **Update your .env** file to use the local Docker setup
4. **Start the services**: `npm run docker:up`
5. **Recreate your instances** in the new local Evolution API
6. **Configure webhooks** to point to your application

The local setup will be accessible at `http://localhost:8080` instead of your external URL.
