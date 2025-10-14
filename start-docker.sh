#!/bin/bash

# Build and run the application with Docker Compose
echo "Building and starting Confine App containers..."
docker compose up -d --build

echo ""
echo "=========================================="
echo "Confine App is now running!"
echo "=========================================="
echo ""
echo "Access the application at:"
echo "- Frontend: http://localhost"
echo "- Auth API: http://localhost:3001/api"
echo "- Location API: http://localhost:5004/api"
echo "- Work Order API: http://localhost:3012/api"
echo ""
echo "To view logs, run:"
echo "docker compose logs -f"
echo ""
echo "To stop the application, run:"
echo "docker compose down"
echo ""