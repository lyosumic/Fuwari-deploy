@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 22 LTS：https://nodejs.org/
  pause
  exit /b 1
)
node tools\deploy.mjs %*
set "DEPLOY_EXIT=%ERRORLEVEL%"
echo.
if not "%DEPLOY_EXIT%"=="0" echo 部署失败，请查看上面的错误。没有继续发布。
pause
exit /b %DEPLOY_EXIT%
