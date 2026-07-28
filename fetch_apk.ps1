$ErrorActionPreference = "Stop"

$dest = "C:\Users\hp\.gemini\antigravity\brain\113b0cfb-4d73-4124-bfa3-688982e0ad1e\sovereign-ai-standalone.apk"

Write-Host "Waiting for cloud build to finish and push APK to branch..."
$maxWaitSeconds = 600
$elapsed = 0
$success = $false

while (-not $success -and $elapsed -lt $maxWaitSeconds) {
    Write-Host "Fetching latest branches..."
    # Suppress errors if branch doesn't exist yet
    $fetchProcess = Start-Process -FilePath "git" -ArgumentList "fetch origin build-artifacts" -Wait -PassThru -NoNewWindow
    
    if ($fetchProcess.ExitCode -eq 0) {
        Write-Host "Branch found! Extracting APK..."
        $checkoutProcess = Start-Process -FilePath "git" -ArgumentList "checkout origin/build-artifacts -- sovereign-ai-standalone.apk" -Wait -PassThru -NoNewWindow
        
        if ($checkoutProcess.ExitCode -eq 0 -and (Test-Path "sovereign-ai-standalone.apk")) {
            Copy-Item -Path "sovereign-ai-standalone.apk" -Destination $dest -Force
            $success = $true
            Write-Host "APK successfully extracted to $dest!"
        }
    }
    
    if (-not $success) {
        Write-Host "Not ready yet. Retrying in 15 seconds... ($elapsed / $maxWaitSeconds seconds)"
        Start-Sleep -Seconds 15
        $elapsed += 15
    }
}

if (-not $success) {
    Write-Host "Failed to retrieve APK after $maxWaitSeconds seconds."
    exit 1
}
