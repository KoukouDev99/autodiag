@echo off
title AutoDiag - Serveur IA FastAPI (Port 8001)
cd /d "%~dp0"

echo ======================================================================
echo           🚗 AutoDiag - Microservice IA Locale FastAPI
echo                 Port 8001 · 100%% Offline Local CPU
echo ======================================================================
echo.
echo Documentation Swagger : http://127.0.0.1:8001/docs
echo Page d'accueil IA     : http://127.0.0.1:8001/
echo.
echo Lancement d'Uvicorn en cours...
echo Appuyez sur CTRL+C pour arreter le serveur.
echo.

C:\Users\yakoub\.autodiag_venv\Scripts\python.exe -m uvicorn app.ai.main:app --host 127.0.0.1 --port 8001 --reload

pause
