$ErrorActionPreference = "Stop"

$url = "https://github.com/Thunderdog-alt/sovereign-ai/releases/download/latest-build/app-debug.apk"
$dest = "C:\Users\hp\.gemini\antigravity\brain\113b0cfb-4d73-4124-bfa3-688982e0ad1e\sovereign-ai-standalone.apk"

Write-Host "Waiting for GitHub Actions to publish the APK..."
$maxWaitSeconds = 600
$elapsed = 0
$success = $false

while (-not $success -and $elapsed -lt $maxWaitSeconds) {
    # Check if the file exists using curl -I
    $process = Start-Process -FilePath "curl.exe" -ArgumentList "-sL -I -w ""%{http_code}"" -o NUL ""$url""" -Wait -NoNewWindow -PassThru
    # Note: capturing stdout from curl -w requires a slightly different approach in PS, let's just try to download it.
    
    Write-Host "Attempting to download APK..."
    $dlProcess = Start-Process -FilePath "curl.exe" -ArgumentList "-L -f -o ""$dest"" ""$url""" -Wait -PassThru
    
    if ($dlProcess.ExitCode -eq 0) {
        $success = $true
        Write-Host "APK downloaded successfully to $dest!"
    } else {
        Write-Host "Not ready yet. Retrying in 15 seconds... ($elapsed / $maxWaitSeconds seconds)"
        Start-Sleep -Seconds 15
        $elapsed += 15
    }
}

if (-not $success) {
    Write-Host "Failed to download APK after $maxWaitSeconds seconds."
    exit 1
}
