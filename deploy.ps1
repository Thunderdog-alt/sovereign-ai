$ErrorActionPreference = "Stop"

$jdkUrl = "https://corretto.aws/downloads/latest/amazon-corretto-17-x64-windows-jdk.zip"
$jdkZip = "D:\jdk-17.zip"
$jdkDir = "D:\jdk-17"

$platformToolsUrl = "https://dl.google.com/android/repository/platform-tools-latest-windows.zip"
$platformToolsZip = "D:\platform-tools.zip"
$platformToolsDir = "D:\platform-tools"

function Download-WithResume {
    param (
        [string]$url,
        [string]$outFile
    )
    $maxRetries = 20
    $retryCount = 0
    $success = $false

    while (-not $success -and $retryCount -lt $maxRetries) {
        Write-Host "Attempt $($retryCount + 1) for $outFile..."
        # -C - resumes download, -L follows redirects
        $process = Start-Process -FilePath "curl.exe" -ArgumentList "-C - -L -o ""$outFile"" ""$url""" -Wait -PassThru
        if ($process.ExitCode -eq 0 -or $process.ExitCode -eq 33) {
            # Exit code 0 is success. Exit code 33 can sometimes mean resume from where it was already finished.
            $success = $true
            Write-Host "Download successful!"
        } else {
            $retryCount++
            Write-Host "Download interrupted (Exit Code: $($process.ExitCode)). Retrying in 3 seconds..."
            Start-Sleep -Seconds 3
        }
    }

    if (-not $success) {
        Write-Host "Failed to download after $maxRetries attempts."
        exit 1
    }
}

Write-Host "Checking for JDK 17..."
if (-not (Test-Path "$jdkDir\*\bin\java.exe")) {
    Write-Host "Downloading JDK 17 with curl resume..."
    Download-WithResume -url $jdkUrl -outFile $jdkZip
    
    Write-Host "Extracting JDK 17..."
    # Force overwrite in case of previous corrupt extraction
    Expand-Archive -Path $jdkZip -DestinationPath $jdkDir -Force
}
$jdkBinDir = Get-ChildItem -Path $jdkDir -Recurse -Filter "java.exe" | Select-Object -First 1 | Select-Object -ExpandProperty Directory
$env:JAVA_HOME = $jdkBinDir.Parent.FullName
Write-Host "JAVA_HOME set to $env:JAVA_HOME"

Write-Host "Checking for ADB (Platform Tools)..."
if (-not (Test-Path "$platformToolsDir\platform-tools\adb.exe")) {
    Write-Host "Downloading Platform Tools with curl resume..."
    Download-WithResume -url $platformToolsUrl -outFile $platformToolsZip
    
    Write-Host "Extracting Platform Tools..."
    Expand-Archive -Path $platformToolsZip -DestinationPath $platformToolsDir -Force
}
$env:PATH = "$platformToolsDir\platform-tools;$env:PATH"

Write-Host "Building React App..."
npm run build

Write-Host "Syncing Capacitor..."
npx cap sync android

Write-Host "Compiling APK..."
Set-Location -Path "android"
.\gradlew assembleDebug

$apkPath = "app\build\outputs\apk\debug\app-debug.apk"
$destPath = "C:\Users\hp\.gemini\antigravity\brain\113b0cfb-4d73-4124-bfa3-688982e0ad1e\sovereign-ai-standalone.apk"

if (Test-Path $apkPath) {
    Copy-Item -Path $apkPath -Destination $destPath -Force
    Write-Host "APK built and copied to $destPath"
    
    Write-Host "Checking for connected devices..."
    $devices = adb devices
    Write-Host $devices
    
    if ($devices -match "\bdevice\b") {
        Write-Host "Installing APK to connected device..."
        adb install -r $apkPath
        Write-Host "Installation complete!"
    } else {
        Write-Host "No device connected via USB. Skipping ADB install."
    }
} else {
    Write-Host "APK build failed, could not find app-debug.apk"
}
