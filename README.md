# Job Application Helper

A powerful web application that helps you apply for jobs quickly and efficiently as they get posted. This app automates job discovery, tracking, and application submission across multiple job boards.

## Features

- **Automated Job Discovery**: Automatically scrape and fetch job listings from multiple platforms (Indeed, LinkedIn, Glassdoor)
- **Profile Management**: Store your resume, contact information, skills, and cover letter templates
- **Auto-Apply**: Automatically fill and submit job applications using your saved profile
- **Application Tracking**: Track all your applications and their statuses in one place
- **Dashboard**: View statistics and manage your job search from a central dashboard
- **Real-time Updates**: Jobs are fetched and stored as they get posted (within 24 hours)

## Installation

### Prerequisites

- Python 3.8 or higher
- Chrome/Chromium browser (for Selenium automation)
- ChromeDriver (will be installed automatically)

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shubham83331141/hello-world.git
   cd hello-world
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your credentials:
   ```
   SECRET_KEY=your-random-secret-key
   DATABASE_URI=sqlite:///job_applications.db
   POLLING_INTERVAL=3600

   # Optional: For auto-apply features
   LINKEDIN_EMAIL=your-email@example.com
   LINKEDIN_PASSWORD=your-password
   INDEED_EMAIL=your-email@example.com
   INDEED_PASSWORD=your-password
   ```

5. **Initialize the database**:
   ```bash
   python -c "from models import init_db; init_db()"
   ```

## Usage

### Starting the Application

1. **Run the web server**:
   ```bash
   python app.py
   ```

2. **Access the application**:
   Open your browser and navigate to `http://localhost:5000`

### Setting Up Your Profile

1. Click on "Profile" in the navigation menu
2. Fill in your personal information:
   - Full name, email, phone number
   - Location
   - LinkedIn and portfolio URLs
   - Skills (comma-separated)
   - Years of experience
   - Cover letter template (use `{company}` and `{position}` as placeholders)
3. Click "Save Profile"

### Fetching Jobs

1. Go to the Dashboard
2. Click "Fetch New Jobs"
3. Enter:
   - **Keywords**: Job titles or skills (e.g., "Software Engineer", "Data Analyst")
   - **Location**: City, state, or "Remote"
4. Click "Fetch Jobs"
5. The app will search multiple job boards and add new jobs to your database

### Auto-Applying to Jobs

**Important**: Auto-apply features require valid credentials in your `.env` file.

#### Method 1: Apply to Individual Jobs
1. Go to "Jobs" or view recent jobs on the Dashboard
2. Click "Apply" next to any job
3. Confirm the auto-apply action

#### Method 2: Bulk Auto-Apply
1. From the Dashboard, click "Auto-Apply to New Jobs"
2. The system will automatically apply to all new jobs that match your profile

### Tracking Applications

1. Click "Applications" in the navigation menu
2. View all your applications with their current status
3. Update status using the dropdown menu:
   - Pending
   - Applied
   - Interview
   - Rejected
   - Accepted

### Monitoring Jobs Continuously

To continuously monitor for new jobs, run the monitoring script:

```bash
python -c "from job_scraper import start_job_monitoring; start_job_monitoring('Software Engineer', 'Remote', 3600)"
```

Replace parameters:
- `'Software Engineer'`: Your target job keywords
- `'Remote'`: Your preferred location
- `3600`: Check interval in seconds (3600 = 1 hour)

## Project Structure

```
hello-world/
├── app.py                  # Main Flask application
├── models.py               # Database models
├── config.py              # Configuration settings
├── job_scraper.py         # Job scraping logic
├── application_bot.py     # Auto-apply automation
├── requirements.txt       # Python dependencies
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore file
├── README.md             # This file
└── templates/            # HTML templates
    ├── base.html
    ├── index.html
    ├── profile.html
    ├── jobs.html
    └── applications.html
```

## API Endpoints

### POST /api/fetch-jobs
Fetch new jobs from job boards.

**Request body**:
```json
{
  "keywords": "Software Engineer",
  "location": "New York"
}
```

### POST /api/auto-apply
Auto-apply to jobs.

**Request body**:
```json
{
  "job_ids": [1, 2, 3]
}
```

### PUT /api/update-application/:id
Update application status.

**Request body**:
```json
{
  "status": "interview",
  "notes": "Phone screen scheduled for next week"
}
```

## Important Notes

### Legal and Ethical Considerations

- **Terms of Service**: Automated scraping and form submission may violate the Terms of Service of some job platforms. Use this tool responsibly and at your own risk.
- **Rate Limiting**: The app includes delays between requests to be respectful to servers. Do not modify these delays.
- **Credentials**: Your platform credentials are stored locally in the `.env` file. Keep this file secure and never commit it to version control.

### Limitations

- **Anti-Bot Measures**: Some job platforms have anti-bot protection (CAPTCHAs, rate limiting). The auto-apply feature may not work for all jobs.
- **Form Variations**: Job application forms vary widely. The auto-fill feature works best with standard forms and may require manual completion for complex applications.
- **Success Rate**: Not all applications will be successfully submitted. Always review your applications in the "Applications" tab.

### Best Practices

1. **Start with Manual Testing**: Test the auto-apply feature with a few jobs first before bulk applying
2. **Review Applications**: Regularly check the "Applications" tab to verify submissions
3. **Customize Your Profile**: Update your profile and cover letter template for better results
4. **Monitor Responsibly**: Don't set the polling interval too low; respect server resources
5. **Keep Credentials Secure**: Never share your `.env` file or commit it to version control

## Troubleshooting

### ChromeDriver Issues
If you encounter ChromeDriver errors:
```bash
# Install ChromeDriver manually
pip install webdriver-manager
```

### Database Issues
Reset the database:
```bash
rm job_applications.db
python -c "from models import init_db; init_db()"
```

### Import Errors
Make sure all dependencies are installed:
```bash
pip install -r requirements.txt --upgrade
```

## Future Enhancements

- Support for more job boards (Glassdoor, Monster, ZipRecruiter)
- Email notifications for new jobs
- Resume parsing and automatic profile setup
- Better form field detection and filling
- Integration with ATS (Applicant Tracking Systems)
- Mobile app version
- Job matching algorithm based on skills and preferences

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is provided as-is for educational and personal use.

## Disclaimer

This tool is for personal use only. The authors are not responsible for any consequences of using this tool, including but not limited to account bans, violations of Terms of Service, or failed applications. Always review applications before submission and use automated features responsibly.

## Support

For issues or questions, please open an issue on GitHub or contact the maintainer.

---

**Happy Job Hunting!** 🎯
