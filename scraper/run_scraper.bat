@echo off
REM --- Navigate to project folder ---
cd /d C:\Users\dell\Documents\Scraping\Learning\scraper

REM --- Activate virtual environment ---
call C:\Users\dell\Documents\Scraping\env\Scripts\activate.bat

REM --- Run your Python module ---
python -m jobs.main

REM --- Optional: pause to see output when double-clicked ---
REM pause
