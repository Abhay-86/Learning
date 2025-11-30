import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5433")), 
    "user": os.getenv("DB_USER", "abhay"),
    "password": os.getenv("DB_PASSWORD", "abhay123"),
    "database": os.getenv("DB_NAME", "scraperdb"),
}