import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DATABASE_URI = os.getenv('DATABASE_URI', 'sqlite:///job_applications.db')

    # Job board configuration
    JOB_BOARDS = {
        'indeed': 'https://www.indeed.com',
        'linkedin': 'https://www.linkedin.com/jobs',
        'glassdoor': 'https://www.glassdoor.com/Job',
    }

    # Polling interval in seconds (default: check every hour)
    POLLING_INTERVAL = int(os.getenv('POLLING_INTERVAL', '3600'))

    # User agent for web scraping
    USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
