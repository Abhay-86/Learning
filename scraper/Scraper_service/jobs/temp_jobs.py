from Scraper_service.core.db import Database
from Scraper_service.jobs.nucleus import check
from Scraper_service.utils.timestamps import updated_at
from Scraper_service.sheet.google_sheet import get_sheet_by_number
from Scraper_service.jobs.jobs import insert_main_job_record

DB = Database()

def insert_job_record(record):
    """Insert a single job record into the database with proper escaping."""
    try:
        title = record.get('Title', '').strip()
        company = record.get('Company', '').strip()
        location = record.get('Location', '').strip() or None
        job_type = record.get('Job Type', '').strip() or None
        url = record.get('URL', '').strip()
        created_at = record.get('created_at', '').strip() or None
        
        if not title or not company or not url:
            print(f"Skipping record - missing essential fields: {record}")
            return False
        
        sql = """
        INSERT INTO job_scraper_temp (title, company, location, job_type, url, scraped_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING *;
        """
        
        inserted_row = DB.execute(sql, (title, company, location, job_type, url, created_at))
        
        if inserted_row:
            print(f"✓ Inserted: {title} at {company}")
        else:
            print(f"✗ Failed to insert: {title} at {company}")
        return company
        
    except Exception as e:
        print(f"✗ Error inserting record: {e}")
        return False


def temp_job_main():
    sheet = get_sheet_by_number(4)
    print(f"Accessed sheet: {sheet.title}\n")

    records = sheet.get_all_records()
    print(f"Total records found: {len(records)}\n")

    inserted_count = 0
    skipped_count = 0
    
    for i, record in enumerate(records, 1):
        print(f"[{i}/{len(records)}] Processing record")
        if insert_job_record(record):
            inserted_count += 1
        else:
            skipped_count += 1
    
    print(f"\n✓ Completed! Inserted: {inserted_count}, Skipped: {skipped_count}")
    # Task 1: Insert to nucleus
    for i, record in enumerate(records, 1):
        print(f"[{i}/{len(records)}] Processing nucleus for record")
        result = check(record.get('Company', '').strip())
        
        if result['status'] == 'exact':
            nucleus_uid = result['data']['nucleus_uid']
            print(f"✓ Exact match found: {record.get('Company', '').strip()}")
            insert_main_job_record(record, nucleus_uid)
            
        elif result['status'] == 'variant':
            nucleus_uid = result['data']['nucleus_uid']
            print(f"✓ Variant match found: {record.get('Company', '').strip()}")
            insert_main_job_record(record, nucleus_uid)
            
        elif result['status'] == 'no_match':
            print(f"ℹ️  No match found, will create new nucleus for: {record.get('Company', '').strip()}")
            # TODO: Add new company to nucleus

