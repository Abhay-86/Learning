from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional

class CompanyModel(BaseModel):
    Company: str
    about_us: Optional[str] = None
    website: Optional[str] = None
    headquarters: Optional[str] = None
    founded: Optional[str] = None
    company_type: Optional[str] = None
    company_size: Optional[str] = None
    url: Optional[str] = None
    last_updated: str= None
    
    @field_validator('Company')
    @classmethod
    def validate_not_na(cls, v):
        if v == "N/A" or not v.strip():
            raise ValueError('Company name cannot be empty or N/A')
        return v.strip()