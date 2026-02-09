# Docker Setup

Runs the app in containers with MongoDB. Pretty straightforward.

## What you need

Just have Docker Desktop installed and you're good to go.

## Running it

The easiest way is with docker-compose:

```bash
docker-compose up --build
```

Or if you want it in the background:
```bash
docker-compose up -d --build
```

App will be at http://localhost:3000 and MongoDB at localhost:27017

If you really want to run just the app container without compose:

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

## Environment stuff

Copy the example file and edit it:

```bash
cp .env.docker.example .env.docker
```

Then change the values to match your setup.

## Useful commands

Stop everything:
```bash
docker-compose down
```

Stop and delete all data (careful with this):
```bash
docker-compose down -v
```

Watch the logs:
```bash
docker-compose logs -f
```

Restart after making changes:
```bash
docker-compose up --build
```

## Database access

Default credentials are admin/password123 for the db named news_publishing.
Obviously change these if you're deploying anywhere real.

Connect with mongosh:
```bash
mongosh "mongodb://admin:password123@localhost:27017/news_publishing?authSource=admin"
```

## Production notes

Change the mongo creds in docker-compose.yml before deploying. Also set a proper NEXTAUTH_SECRET.
Maybe use Atlas instead of running your own mongo if you can.

## Troubleshooting

Port conflicts: edit the ports in docker-compose.yml to use different ones

Container issues: check `docker-compose logs`

Start fresh: `docker-compose down -v && docker system prune -a` then build again

## Notes

The Dockerfile has multi-stage builds so it's optimized for prod. For dev just use npm run dev like normal.

Data persists in volumes so it survives container restarts unless you explicitly remove them with -v flag.
