from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import logging
from models import Application, get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ApplicationBot:
    """Automated job application bot using Selenium"""

    def __init__(self, headless=True):
        chrome_options = Options()
        if headless:
            chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')

        self.driver = None
        self.chrome_options = chrome_options

    def start_driver(self):
        """Initialize the web driver"""
        if not self.driver:
            self.driver = webdriver.Chrome(options=self.chrome_options)

    def close_driver(self):
        """Close the web driver"""
        if self.driver:
            self.driver.quit()
            self.driver = None

    def login_linkedin(self, email, password):
        """Login to LinkedIn"""
        try:
            self.start_driver()
            self.driver.get('https://www.linkedin.com/login')
            time.sleep(2)

            # Find and fill email
            email_field = self.driver.find_element(By.ID, 'username')
            email_field.send_keys(email)

            # Find and fill password
            password_field = self.driver.find_element(By.ID, 'password')
            password_field.send_keys(password)

            # Click login
            login_button = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
            login_button.click()

            time.sleep(3)
            logger.info("Successfully logged into LinkedIn")
            return True

        except Exception as e:
            logger.error(f"Error logging into LinkedIn: {e}")
            return False

    def apply_to_job_linkedin(self, job_url, user_profile):
        """Apply to a LinkedIn Easy Apply job"""
        try:
            self.driver.get(job_url)
            time.sleep(2)

            # Look for Easy Apply button
            easy_apply_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, 'button[aria-label*="Easy Apply"]'))
            )
            easy_apply_button.click()
            time.sleep(2)

            # Fill out application form
            # This is a simplified version - real implementation would need to handle
            # multiple form pages, questions, and file uploads

            # Look for phone number field
            try:
                phone_field = self.driver.find_element(By.CSS_SELECTOR, 'input[id*="phoneNumber"]')
                phone_field.clear()
                phone_field.send_keys(user_profile.phone)
            except:
                pass

            # Submit application
            try:
                submit_button = self.driver.find_element(By.CSS_SELECTOR, 'button[aria-label*="Submit application"]')
                submit_button.click()
                logger.info(f"Successfully applied to job: {job_url}")
                return True
            except:
                # Might need to go through multiple pages
                try:
                    next_button = self.driver.find_element(By.CSS_SELECTOR, 'button[aria-label*="Continue"]')
                    next_button.click()
                    time.sleep(1)
                except:
                    pass

            time.sleep(2)
            return True

        except Exception as e:
            logger.error(f"Error applying to LinkedIn job: {e}")
            return False

    def apply_to_job_indeed(self, job_url, user_profile):
        """Apply to an Indeed job"""
        try:
            self.driver.get(job_url)
            time.sleep(2)

            # Look for Apply button
            apply_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, 'button[id*="apply"]'))
            )
            apply_button.click()
            time.sleep(2)

            # Fill in contact information
            try:
                name_field = self.driver.find_element(By.CSS_SELECTOR, 'input[name*="name"]')
                name_field.clear()
                name_field.send_keys(user_profile.full_name)
            except:
                pass

            try:
                email_field = self.driver.find_element(By.CSS_SELECTOR, 'input[name*="email"]')
                email_field.clear()
                email_field.send_keys(user_profile.email)
            except:
                pass

            try:
                phone_field = self.driver.find_element(By.CSS_SELECTOR, 'input[name*="phone"]')
                phone_field.clear()
                phone_field.send_keys(user_profile.phone)
            except:
                pass

            # Submit
            try:
                submit_button = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
                submit_button.click()
                logger.info(f"Successfully applied to job: {job_url}")
                return True
            except:
                pass

            time.sleep(2)
            return True

        except Exception as e:
            logger.error(f"Error applying to Indeed job: {e}")
            return False

    def auto_apply_to_jobs(self, jobs, user_profile, platform_credentials):
        """Automatically apply to multiple jobs"""
        results = {'success': 0, 'failed': 0}

        self.start_driver()

        # Login if credentials provided
        if 'linkedin_email' in platform_credentials and 'linkedin_password' in platform_credentials:
            self.login_linkedin(
                platform_credentials['linkedin_email'],
                platform_credentials['linkedin_password']
            )

        for job in jobs:
            try:
                success = False

                if job.source == 'linkedin':
                    success = self.apply_to_job_linkedin(job.url, user_profile)
                elif job.source == 'indeed':
                    success = self.apply_to_job_indeed(job.url, user_profile)

                # Record application
                db = get_db()
                application = Application(
                    job_id=job.id,
                    user_profile_id=user_profile.id,
                    status='applied' if success else 'failed',
                    auto_applied=True
                )
                db.add(application)
                db.commit()
                db.close()

                if success:
                    results['success'] += 1
                else:
                    results['failed'] += 1

                time.sleep(5)  # Wait between applications

            except Exception as e:
                logger.error(f"Error in auto-apply loop: {e}")
                results['failed'] += 1

        self.close_driver()
        return results
