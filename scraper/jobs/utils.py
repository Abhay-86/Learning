from typing import List, Set
from datetime import datetime

try:
    from .models import JobModel
except ImportError:
    from models import JobModel

def get_existing_urls(sheet) -> set:
    """Return existing URLs from sheet"""
    data = sheet.get_all_records()
    return {row.get('URL') for row in data if row.get('URL')}

def validate_jobs(jobs_data, existing_urls):
    """Validate jobs data and filter duplicates"""
    validated = []
    
    for job in jobs_data:
        try:
            url = job.get('url')
            if url in existing_urls:
                print(f"Skipped duplicate: {url}")
                continue
                
            model = JobModel(
                title=job.get('title'),
                company=job.get('company'),
                location=None if job.get('location') == "N/A" else job.get('location'),
                job_type=None if job.get('job_type') == "N/A" else job.get('job_type'),
                url=url
            )
            validated.append(model)
            
        except Exception as e:
            print(f"Invalid job skipped: {e}")
            continue
    
    return validated

def upload_to_sheet(sheet, jobs):
    """Upload jobs to Google Sheet"""
    if not jobs:
        print("No new jobs to upload.")
        return False

    try:
        rows = []

        for job in jobs:
            row = [
                job.title,
                job.company,
                job.location or "",
                job.job_type or "",
                str(job.url),
                datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ]
            rows.append(row)
        
        sheet.append_rows(rows)
        print(f"Uploaded {len(jobs)} jobs!")
        return True

    except Exception as e:
        print(f"Upload failed: {e}")
        return False

def clear_sheet_except_header(sheet):
    """Deletes all rows except the first row (header)."""
    try:
        all_values = sheet.get_all_values()
        total_rows = len(all_values)
        print(f"Total rows before cleaning: {total_rows}")

        if total_rows <= 1:
            print("Sheet already clean (only header exists).")
            return True

        # Delete rows from 2 to last
        sheet.delete_rows(2, total_rows - 1)
        print(f"Cleared sheet: removed {total_rows - 1} rows, header kept.")

        return True

    except Exception as e:
        print(f"Error during sheet cleaning: {e}")
        return False