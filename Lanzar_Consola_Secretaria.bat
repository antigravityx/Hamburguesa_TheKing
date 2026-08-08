@echo off
color 0E
title CONSOLA DE SECRETARIA - THE KING BURGER
echo ========================================================
echo   VERIX - CONSOLA DE ADMINISTRACION DE SECRETARIA
echo ========================================================
echo.
echo Abriendo la consola de administracion en el navegador...
echo URL Local: http://localhost:8080/admin.html
echo URL Produccion: https://theking.sbs/admin
echo.

start "" "http://localhost:8080/admin.html" || start "" "%~dp0admin.html"
pause
