from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional

class JobModel(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    job_type: Optional[str] = None
    url: HttpUrl
    
    @field_validator('url')
    @classmethod
    def validate_linkedin_url(cls, v):
        if not str(v).startswith('https://www.linkedin.com/'):
            raise ValueError('URL must be a valid LinkedIn URL')
        return v
    
    @field_validator('title', 'company')
    @classmethod
    def validate_not_na(cls, v):
        if v == "N/A" or not v.strip():
            raise ValueError('Title and company cannot be empty or N/A')
        return v.strip()