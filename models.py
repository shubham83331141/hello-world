from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import Config

Base = declarative_base()
engine = create_engine(Config.DATABASE_URI)
SessionLocal = sessionmaker(bind=engine)

class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id = Column(Integer, primary_key=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False)
    phone = Column(String(50))
    location = Column(String(200))
    resume_path = Column(String(500))
    cover_letter_template = Column(Text)
    linkedin_url = Column(String(500))
    portfolio_url = Column(String(500))
    skills = Column(Text)  # JSON string
    experience_years = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Job(Base):
    __tablename__ = 'jobs'

    id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False)
    company = Column(String(500), nullable=False)
    location = Column(String(200))
    description = Column(Text)
    url = Column(String(1000), nullable=False, unique=True)
    source = Column(String(100))  # indeed, linkedin, etc.
    posted_date = Column(DateTime)
    salary_range = Column(String(200))
    job_type = Column(String(100))  # full-time, part-time, contract
    discovered_at = Column(DateTime, default=datetime.utcnow)


class Application(Base):
    __tablename__ = 'applications'

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, nullable=False)
    user_profile_id = Column(Integer, nullable=False)
    status = Column(String(100), default='pending')  # pending, applied, interview, rejected, accepted
    applied_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)
    auto_applied = Column(Boolean, default=False)
    response_received = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def init_db():
    """Initialize the database"""
    Base.metadata.create_all(engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        pass
