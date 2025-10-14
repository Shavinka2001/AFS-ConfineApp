# PowerShell script to build and run the application with Docker Compose

Write-Host "Building and starting Confine App containers..." -ForegroundColor Green
docker compose up -d --build

Write-Host ""
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "Confine App is now running!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost"
Write-Host "- Auth API: http://localhost:3001/api"
Write-Host "- Location API: http://localhost:5004/api"
Write-Host "- Work Order API: http://localhost:3012/api"
Write-Host ""
Write-Host "To view logs, run:" -ForegroundColor Cyan
Write-Host "docker compose logs -f" -ForegroundColor DarkGray
Write-Host ""
Write-Host "To stop the application, run:" -ForegroundColor Cyan
Write-Host "docker compose down" -ForegroundColor DarkGray
Write-Host ""