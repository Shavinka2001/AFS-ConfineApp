# Confine App - Dockerized Setup

This document provides instructions on how to run the Confine App using Docker and Docker Compose.

## Project Structure

The application consists of several services:

- **Client**: React/Vite frontend application
- **Auth Service**: Authentication and user management
- **Location Management Service**: Management of buildings and locations
- **Work Order Management Service**: Management of work orders

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

1. Clone the repository
2. Make sure Docker is running on your system
3. Run the following command from the project root directory:

```bash
docker compose up -d
```

This will build and start all services in detached mode.

## Access the Application

Once all containers are running, you can access the services at:

- Frontend: http://localhost
- Auth API: http://localhost:3001/api
- Location API: http://localhost:5004/api
- Work Order API: http://localhost:3012/api

## Development Mode

For development, you can use volume mounts to see changes without rebuilding:

```bash
docker compose up
```

When you make changes to the source code, the changes will be reflected immediately in the running containers (for backend services) or after rebuilding for frontend changes.

## Viewing Logs

To view logs from all containers:

```bash
docker compose logs -f
```

To view logs for a specific service:

```bash
docker compose logs -f [service-name]
```

Where `[service-name]` is one of: `client`, `auth-service`, `location-service`, or `workorder-service`.

## Stopping Containers

To stop all containers:

```bash
docker compose down
```

To stop all containers and remove volumes:

```bash
docker compose down -v
```

## Rebuilding Services

If you make changes to a Dockerfile or need to rebuild a service:

```bash
docker compose build [service-name]
docker compose up -d [service-name]
```

## Environment Variables

The Docker Compose setup uses environment variables from `.env` files in each service directory. For production deployment, make sure to update these with appropriate values.

## Production Considerations

- Update database connection strings with proper credentials
- Set secure JWT secrets
- Consider using a container orchestration platform like Kubernetes for production deployment
- Implement proper SSL/TLS termination for production use