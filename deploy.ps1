$ErrorActionPreference = "Stop"

$jdkZip = "D:\jdk-17.zip"
$jdkDir = "D:\jdk-17"
$platformToolsZip = "D:\platform-tools.zip"
$platformToolsDir = "D:\platform-tools"

Write-Host "Extracting JDK 17..."
if (-not (Test-Path "$jdkDir\*\bin\java.exe")) {
    Expand-Archive -Path $jdkZip -DestinationPath $jdkDir -Force
}
$jdkBinDir = Get-ChildItem -Path $jdkDir -Recurse -Filter "java.exe" | Select-Object -First 1 | Select-Object -ExpandProperty Directory
$env:JAVA_HOME = $jdkBinDir.Parent.FullName
Write-Host "JAVA_HOME set to $env:JAVA_HOME"

Write-Host "Extracting Platform Tools..."
if (-not (Test-Path "$platformToolsDir\platform-tools\adb.exe")) {
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
