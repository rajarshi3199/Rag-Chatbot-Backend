# Kill any Node.js process using port 5000
Write-Host "Checking for processes on port 5000..." -ForegroundColor Yellow

$connections = netstat -ano | Select-String ":5000" | Select-String "LISTENING"
if ($connections) {
    foreach ($conn in $connections) {
        if ($conn -match '\s+(\d+)\s*$') {
            $pid = $matches[1]
            Write-Host "Killing process $pid on port 5000..." -ForegroundColor Cyan
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            } catch {
                Write-Host "Could not kill process $pid" -ForegroundColor Red
            }
        }
    }
    Start-Sleep -Seconds 2
    Write-Host "Port 5000 is now free!" -ForegroundColor Green
} else {
    Write-Host "Port 5000 is already free." -ForegroundColor Green
}

# Start the backend server
Write-Host "`nStarting backend server..." -ForegroundColor Yellow
npm run dev
