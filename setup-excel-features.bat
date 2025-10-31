@echo off
echo ========================================
echo Excel Import/Export Feature Setup
echo ========================================
echo.

echo Step 1: Installing xlsx package...
cd client
call npm install xlsx
if %errorlevel% neq 0 (
    echo ERROR: Failed to install xlsx package
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Restart your development server (npm run dev)
echo 2. Go to Location Management page
echo 3. Look for green Export and blue Import buttons
echo.
echo Documentation:
echo - QUICK_REFERENCE.md - Quick start guide
echo - EXCEL_SETUP.md - Detailed setup instructions
echo - EXCEL_IMPORT_GUIDE.md - Import guide with templates
echo - CHANGES_SUMMARY.md - Complete list of changes
echo.
echo ========================================
echo Features Added:
echo ✓ Removed status field from inspection
echo ✓ Excel export functionality
echo ✓ Excel import functionality
echo ========================================
echo.
pause
