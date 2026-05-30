from flask import Flask, render_template, request, jsonify, redirect, url_for
import os
import json
from datetime import datetime
from models import init_db, get_db, UserProfile, Job, Application
from job_scraper import JobFetcher
from application_bot import ApplicationBot
from config import Config
import threading

app = Flask(__name__)
app.config['SECRET_KEY'] = Config.SECRET_KEY

# Initialize database
init_db()


@app.route('/')
def index():
    """Home page"""
    db = get_db()
    profile = db.query(UserProfile).first()
    recent_jobs = db.query(Job).order_by(Job.discovered_at.desc()).limit(10).all()
    applications = db.query(Application).order_by(Application.applied_at.desc()).limit(10).all()

    stats = {
        'total_jobs': db.query(Job).count(),
        'total_applications': db.query(Application).count(),
        'pending_applications': db.query(Application).filter_by(status='pending').count(),
        'applied': db.query(Application).filter_by(status='applied').count(),
    }

    db.close()

    return render_template('index.html',
                           profile=profile,
                           recent_jobs=recent_jobs,
                           applications=applications,
                           stats=stats)


@app.route('/profile', methods=['GET', 'POST'])
def profile():
    """User profile management"""
    db = get_db()

    if request.method == 'POST':
        data = request.form

        existing_profile = db.query(UserProfile).first()

        if existing_profile:
            # Update existing profile
            existing_profile.full_name = data.get('full_name')
            existing_profile.email = data.get('email')
            existing_profile.phone = data.get('phone')
            existing_profile.location = data.get('location')
            existing_profile.linkedin_url = data.get('linkedin_url')
            existing_profile.portfolio_url = data.get('portfolio_url')
            existing_profile.skills = data.get('skills')
            existing_profile.experience_years = int(data.get('experience_years', 0))
            existing_profile.cover_letter_template = data.get('cover_letter_template')
            existing_profile.updated_at = datetime.utcnow()
        else:
            # Create new profile
            new_profile = UserProfile(
                full_name=data.get('full_name'),
                email=data.get('email'),
                phone=data.get('phone'),
                location=data.get('location'),
                linkedin_url=data.get('linkedin_url'),
                portfolio_url=data.get('portfolio_url'),
                skills=data.get('skills'),
                experience_years=int(data.get('experience_years', 0)),
                cover_letter_template=data.get('cover_letter_template')
            )
            db.add(new_profile)

        db.commit()
        db.close()
        return redirect(url_for('profile'))

    user_profile = db.query(UserProfile).first()
    db.close()

    return render_template('profile.html', profile=user_profile)


@app.route('/jobs')
def jobs():
    """List all discovered jobs"""
    db = get_db()
    all_jobs = db.query(Job).order_by(Job.discovered_at.desc()).all()
    db.close()

    return render_template('jobs.html', jobs=all_jobs)


@app.route('/applications')
def applications():
    """List all applications"""
    db = get_db()
    all_applications = db.query(Application).order_by(Application.applied_at.desc()).all()

    # Get job details for each application
    app_list = []
    for app in all_applications:
        job = db.query(Job).filter_by(id=app.job_id).first()
        app_list.append({
            'application': app,
            'job': job
        })

    db.close()

    return render_template('applications.html', applications=app_list)


@app.route('/api/fetch-jobs', methods=['POST'])
def fetch_jobs():
    """API endpoint to fetch new jobs"""
    data = request.json
    keywords = data.get('keywords', '')
    location = data.get('location', '')

    if not keywords or not location:
        return jsonify({'error': 'Keywords and location are required'}), 400

    # Run job fetcher in background
    def fetch_in_background():
        fetcher = JobFetcher()
        fetcher.fetch_new_jobs(keywords, location)

    thread = threading.Thread(target=fetch_in_background)
    thread.start()

    return jsonify({'message': 'Job fetching started', 'status': 'success'})


@app.route('/api/auto-apply', methods=['POST'])
def auto_apply():
    """API endpoint to auto-apply to jobs"""
    data = request.json
    job_ids = data.get('job_ids', [])

    db = get_db()
    user_profile = db.query(UserProfile).first()

    if not user_profile:
        db.close()
        return jsonify({'error': 'Please set up your profile first'}), 400

    jobs = db.query(Job).filter(Job.id.in_(job_ids)).all()
    db.close()

    # Get credentials from environment
    credentials = {
        'linkedin_email': os.getenv('LINKEDIN_EMAIL'),
        'linkedin_password': os.getenv('LINKEDIN_PASSWORD'),
    }

    # Run auto-apply in background
    def apply_in_background():
        bot = ApplicationBot(headless=True)
        results = bot.auto_apply_to_jobs(jobs, user_profile, credentials)
        return results

    thread = threading.Thread(target=apply_in_background)
    thread.start()

    return jsonify({'message': f'Auto-apply started for {len(jobs)} jobs', 'status': 'success'})


@app.route('/api/update-application/<int:app_id>', methods=['PUT'])
def update_application(app_id):
    """Update application status"""
    data = request.json
    status = data.get('status')
    notes = data.get('notes')

    db = get_db()
    application = db.query(Application).filter_by(id=app_id).first()

    if application:
        application.status = status
        if notes:
            application.notes = notes
        application.updated_at = datetime.utcnow()
        db.commit()
        db.close()
        return jsonify({'message': 'Application updated', 'status': 'success'})

    db.close()
    return jsonify({'error': 'Application not found'}), 404


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
