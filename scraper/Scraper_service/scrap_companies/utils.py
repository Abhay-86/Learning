import re
from typing import List
from datetime import datetime

try:
    from .models import CompanyModel
except ImportError:
    from models import CompanyModel

def format_company_name(company_name: str) -> str:
    """
    Convert company name to LinkedIn URL format
    Examples:
    - "Patel Singh" → "patel-singh"
    - "Tandemloop Technologies" → "tandemloop-technologies"
    - "Amazon" → "amazon"
    """
    if not company_name:
        return ""
    
    # Convert to lowercase
    formatted = company_name.lower()
    
    # Replace spaces and special characters with hyphens
    formatted = re.sub(r'[^\w\s-]', '', formatted)  # Remove special chars except spaces and hyphens
    formatted = re.sub(r'\s+', '-', formatted)      # Replace spaces with hyphens
    formatted = re.sub(r'-+', '-', formatted)       # Replace multiple hyphens with single hyphen
    formatted = formatted.strip('-')                # Remove leading/trailing hyphens
    
    return formatted

def build_company_url(company_name: str) -> str:
    """Build complete LinkedIn company URL"""
    # formatted_name = format_company_name(company_name)
    return f"https://www.linkedin.com/company/{company_name}/"


def get_company_names(sheet) -> set:
    """Return new company names from sheet"""
    try:
        data = sheet.get_all_records()
        company_name = {row['Company'] for row in data if row['Company']}
        formatted_name = {format_company_name(name) for name in company_name}
        return formatted_name
    except Exception as e:
        print(f"Error getting new company names: {e}")
        return set()

def validate_companies(companies_data, existing_names):
    """Validate companies data and filter duplicates based on company names"""
    validated = []
    
    for company in companies_data:
        try:
            company_name = company.get('Company')
            if company_name in existing_names:
                print(f"Skipped duplicate company: {company_name}")
                continue
                
            model = CompanyModel(
                Company=company.get('Company'),
                about_us=company.get('about_us'),
                website=company.get('website'),
                headquarters=company.get('headquarters'),
                founded=company.get('founded'),
                company_type=company.get('company_type'),
                company_size=company.get('company_size'),
                url=company.get('url'),
                last_updated=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
            validated.append(model)
            
        except Exception as e:
            print(f"Invalid company skipped: {e}")
            continue
    
    return validated

def upload_to_sheet(sheet, companies):
    """Upload companies to Google Sheet"""
    if not companies:
        print("No new companies to upload.")
        return False

    try:
        rows = []

        for company in companies:
            row = [
                company.Company,
                company.about_us or "",
                company.website or "",
                company.headquarters or "",
                company.founded or "",
                company.company_type or "",
                company.company_size or "",
                str(company.url) if company.url else "",
                company.last_updated or ""
            ]
            rows.append(row)
        
        sheet.append_rows(rows)
        print(f"Uploaded {len(companies)} companies!")
        return True

    except Exception as e:
        print(f"Upload failed: {e}")
        return False
    
