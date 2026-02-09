# Docker Setup Guide

This project is containerized with Docker and includes MongoDB.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed (included with Docker Desktop)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

This will start both the Next.js application and MongoDB:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

The application will be available at:
- **App**: http://localhost:3000
- **MongoDB**: localhost:27017

### Option 2: Docker Only (App only, no database)

```bash
# Build the Docker image
docker build -t news-publishing-system .

# Run the container
docker run -p 3000:3000 \
  -e MONGODB_URI="your-mongodb-connection-string" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NEXTAUTH_SECRET="your-secret-key" \
  news-publishing-system
```

## Environment Variables

Copy `.env.docker.example` to create your environment file:

```bash
cp .env.docker.example .env.docker
```

Update the values in `.env.docker` with your configuration.

## Managing the Containers

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f mongodb

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose up --build
```

## Database Access

MongoDB credentials (default):
- **Username**: admin
- **Password**: password123
- **Database**: news_publishing

**⚠️ IMPORTANT**: Change these credentials in `docker-compose.yml` for production!

Connect to MongoDB:
```bash
# Using mongosh (MongoDB Shell)
mongosh "mongodb://admin:password123@localhost:27017/news_publishing?authSource=admin"

# Or use MongoDB Compass with connection string:
mongodb://admin:password123@localhost:27017/news_publishing?authSource=admin
```

## Production Deployment

For production:

1. Update environment variables in `docker-compose.yml`:
   - Change MongoDB credentials
   - Set a strong `NEXTAUTH_SECRET`
   - Update `NEXTAUTH_URL` to your domain

2. Use production-ready MongoDB setup:
   - Use managed MongoDB service (MongoDB Atlas)
   - Or properly secure your MongoDB instance

3. Set up reverse proxy (nginx) for HTTPS

4. Use Docker secrets for sensitive data

## Troubleshooting

### Port already in use
If port 3000 or 27017 is already in use, change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Map to different host port
```

### Container won't start
Check logs:
```bash
docker-compose logs
```

### Database connection issues
Ensure MongoDB container is healthy:
```bash
docker-compose ps
```

### Clear everything and start fresh
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

## Development vs Production

The Dockerfile uses multi-stage builds optimized for production. For development:
- Continue using `npm run dev` locally
- Use Docker Compose for testing the production build

## Health Checks

MongoDB includes a health check. The app waits for MongoDB to be ready before starting.

## Volume Persistence

MongoDB data persists in Docker volumes:
- `mongodb_data`: Database files
- `mongodb_config`: Configuration files

Data persists even when containers are stopped, unless you use `docker-compose down -v`.
