@echo off
echo ==========================================
echo   PriceSyncPro 本地服务器启动脚本
echo ==========================================
echo.
echo 正在检测可用的 HTTP 服务器...
echo.

REM 检查 Python 3
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [√] 检测到 Python 3
    echo.
    echo 启动服务器: http://localhost:8000
    echo 按 Ctrl+C 停止服务器
    echo.
    python -m http.server 8000
    goto :end
)

REM 检查 Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo [√] 检测到 Node.js
    echo.
    echo 正在安装 http-server...
    call npx -y http-server -p 8000
    goto :end
)

REM 检查 PHP
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo [√] 检测到 PHP
    echo.
    echo 启动服务器: http://localhost:8000
    echo 按 Ctrl+C 停止服务器
    echo.
    php -S localhost:8000
    goto :end
)

echo [×] 未检测到任何可用的 HTTP 服务器
echo.
echo 请安装以下任一工具：
echo   1. Python 3: https://www.python.org/downloads/
echo   2. Node.js: https://nodejs.org/
echo   3. PHP: https://www.php.net/downloads
echo.
pause

:end