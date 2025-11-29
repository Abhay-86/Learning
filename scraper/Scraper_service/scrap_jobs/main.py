
from .scraper import get_jobs
from .utils import validate_jobs, upload_to_sheet, clear_sheet_except_header, get_existing_urls
from .google_sheets import get_sheet_by_number

def main(jobs_data):
    """Main pipeline function to process and upload job data"""
    print("Starting job upload pipeline...")

    # Load sheet
    sheet = get_sheet_by_number(4)
    print(f"Accessed sheet: {sheet.title}")

    clear_sheet_except_header(sheet)

    # Get existing URLs
    existing_urls = get_existing_urls(sheet)
    print(f"Existing jobs: {len(existing_urls)} URLs found")

    # Validate + filter
    valid_jobs = validate_jobs(jobs_data, existing_urls)
    print(f"Valid jobs after filtering: {len(valid_jobs)}")

    # Upload
    if valid_jobs:
        upload_to_sheet(sheet, valid_jobs)
    else:
        print("No valid new jobs to upload")

if __name__ == "__main__":
    # Test with sample data when run directly
    print("Running main.py directly - testing with sample data...")
    jobs = get_jobs()
    print(f"Total jobs scraped: {len(jobs)}")
    
    main(jobs)

    print("Pipeline execution completed.")