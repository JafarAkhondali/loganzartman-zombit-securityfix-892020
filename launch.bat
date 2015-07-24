@echo off

rem use this to test locally (chrome will spew x-origin errors otherwise)

echo Launching...
if exist %appdata%\..\Local\Google\Chrome\Application\chrome.exe (
	start "" %appdata%\..\Local\Google\Chrome\Application\chrome.exe --args --allow-file-access-from-files --user-data-dir="C:/chrome-temp" http://localhost:8001
) else (
	start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --args --allow-file-access-from-files --user-data-dir="C:/chrome-temp" http://localhost:8001
)

node client-server.js 8001
