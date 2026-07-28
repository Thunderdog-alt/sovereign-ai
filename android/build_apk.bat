@echo off
set "JAVA_HOME=C:\Program Files\Android\jdk\jdk-8.0.302.8-hotspot\jdk8u302-b08"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo Using Java at: %JAVA_HOME%
java -version
call gradlew.bat assembleDebug
