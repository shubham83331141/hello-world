import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import time
import logging
from models import Job, get_db
from config import Config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class JobScraper:
    """Base class for job scrapers"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': Config.USER_AGENT})

    def scrape_jobs(self, keywords, location):
        """Override this method in subclasses"""
        raise NotImplementedError


class IndeedScraper(JobScraper):
    """Scraper for Indeed.com"""

    def scrape_jobs(self, keywords, location):
        jobs = []
        base_url = Config.JOB_BOARDS['indeed']
        search_url = f"{base_url}/jobs"

        params = {
            'q': keywords,
            'l': location,
            'fromage': '1'  # Jobs from last 1 day
        }

        try:
            response = self.session.get(search_url, params=params, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # This is a simplified scraper - real implementation would need to handle
            # Indeed's actual HTML structure and anti-scraping measures
            job_cards = soup.find_all('div', class_='job_seen_beacon')

            for card in job_cards[:20]:  # Limit to 20 jobs
                try:
                    title_elem = card.find('h2', class_='jobTitle')
                    company_elem = card.find('span', class_='companyName')
                    location_elem = card.find('div', class_='companyLocation')

                    if title_elem and company_elem:
                        job_data = {
                            'title': title_elem.get_text(strip=True),
                            'company': company_elem.get_text(strip=True),
                            'location': location_elem.get_text(strip=True) if location_elem else '',
                            'url': base_url + title_elem.find('a')['href'] if title_elem.find('a') else '',
                            'source': 'indeed',
                            'posted_date': datetime.utcnow()
                        }
                        jobs.append(job_data)
                except Exception as e:
                    logger.error(f"Error parsing job card: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error scraping Indeed: {e}")

        return jobs


class LinkedInScraper(JobScraper):
    """Scraper for LinkedIn Jobs"""

    def scrape_jobs(self, keywords, location):
        jobs = []
        base_url = Config.JOB_BOARDS['linkedin']
        search_url = f"{base_url}/search/"

        params = {
            'keywords': keywords,
            'location': location,
            'f_TPR': 'r86400'  # Posted in last 24 hours
        }

        try:
            response = self.session.get(search_url, params=params, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # This is a simplified scraper - real implementation would need proper selectors
            job_cards = soup.find_all('div', class_='base-card')

            for card in job_cards[:20]:
                try:
                    title_elem = card.find('h3', class_='base-search-card__title')
                    company_elem = card.find('h4', class_='base-search-card__subtitle')
                    location_elem = card.find('span', class_='job-search-card__location')
                    link_elem = card.find('a', class_='base-card__full-link')

                    if title_elem and company_elem:
                        job_data = {
                            'title': title_elem.get_text(strip=True),
                            'company': company_elem.get_text(strip=True),
                            'location': location_elem.get_text(strip=True) if location_elem else '',
                            'url': link_elem['href'] if link_elem else '',
                            'source': 'linkedin',
                            'posted_date': datetime.utcnow()
                        }
                        jobs.append(job_data)
                except Exception as e:
                    logger.error(f"Error parsing LinkedIn job card: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error scraping LinkedIn: {e}")

        return jobs


class JobFetcher:
    """Coordinates job scraping from multiple sources"""

    def __init__(self):
        self.scrapers = {
            'indeed': IndeedScraper(),
            'linkedin': LinkedInScraper(),
        }

    def fetch_new_jobs(self, keywords, location):
        """Fetch jobs from all sources and save to database"""
        all_jobs = []

        for source_name, scraper in self.scrapers.items():
            logger.info(f"Fetching jobs from {source_name}...")
            try:
                jobs = scraper.scrape_jobs(keywords, location)
                all_jobs.extend(jobs)
                logger.info(f"Found {len(jobs)} jobs from {source_name}")
                time.sleep(2)  # Be respectful to servers
            except Exception as e:
                logger.error(f"Error fetching from {source_name}: {e}")

        # Save to database
        db = get_db()
        new_jobs_count = 0

        for job_data in all_jobs:
            # Check if job already exists
            existing = db.query(Job).filter_by(url=job_data['url']).first()
            if not existing and job_data['url']:
                new_job = Job(**job_data)
                db.add(new_job)
                new_jobs_count += 1

        db.commit()
        db.close()

        logger.info(f"Added {new_jobs_count} new jobs to database")
        return new_jobs_count


def start_job_monitoring(keywords, location, interval=None):
    """Start monitoring for new jobs"""
    fetcher = JobFetcher()
    interval = interval or Config.POLLING_INTERVAL

    logger.info(f"Starting job monitoring for '{keywords}' in '{location}'")
    logger.info(f"Checking every {interval} seconds")

    while True:
        try:
            fetcher.fetch_new_jobs(keywords, location)
        except Exception as e:
            logger.error(f"Error in monitoring loop: {e}")

        logger.info(f"Waiting {interval} seconds before next check...")
        time.sleep(interval)
