from Scraper_service.core.db import Database
DB = Database()


def insert_main_job_record(record, nucleus_uid):
    """Insert a single job record into the database with proper escaping."""
    try:
        nucleus_uid = nucleus_uid
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
            print(f"✓ Inserted main job: {title} at {company}")
        else:
            print(f"✗ Failed to insert main job: {title} at {company}")
        return company
        
    except Exception as e:
        print(f"✗ Error inserting record: {e}")
        return False