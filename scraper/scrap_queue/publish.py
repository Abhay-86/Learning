import pika
import json
from Scraper_service.core.db import Database

DB = Database()

def publish(type_name: str, rows: list):
    """Publish rows (1 or many) to RabbitMQ."""
    if not rows:
        return

    payload = {
        "type": type_name,
        "data": rows
    }

    credentials = pika.PlainCredentials("admin", "admin123")
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host="localhost", credentials=credentials)
    )
    channel = connection.channel()

    channel.exchange_declare(exchange='scraper_updates', exchange_type='fanout')

    channel.basic_publish(
        exchange='scraper_updates',
        routing_key='',
        body=json.dumps(payload)
    )

    print(f"📨 Published {type_name}: {len(rows)} rows")
    connection.close()


# ================================
# FETCH UNSYNCED USING nucleus_uid
# ================================

def fetch_companies():
    sql = """
        SELECT 
            nucleus_uid,
            name, about_us, website, headquarters, founded,
            company_type, company_size, url, last_updated
        FROM company
        WHERE sync_backend = FALSE;
    """
    return DB.query(sql)


def fetch_jobs():
    sql = """
        SELECT 
            nucleus_uid,
            title, company, location, job_type, url, scraped_at
        FROM job_scraper
        WHERE sync_backend = FALSE;
    """
    return DB.query(sql)


# ================================
# MARK AS SYNCED BY NUCLEUS UID
# ================================

def mark_companies_synced(uids: list):
    if not uids:
        return

    sql = """
        UPDATE company
        SET sync_backend = TRUE,
            updated_at = NOW()
        WHERE nucleus_uid = ANY(%s);
    """
    DB.execute(sql, (uids,))


def mark_jobs_synced(uids: list):
    if not uids:
        return

    sql = """
        UPDATE job_scraper
        SET sync_backend = TRUE
        WHERE nucleus_uid = ANY(%s);
    """
    DB.execute(sql, (uids,))


# ================================
# MAIN SYNC PROCESS
# ================================

def main():

    # --- COMPANY SYNC ---
    companies = fetch_companies()
    if companies:
        publish("company", companies)

        company_uids = [c["nucleus_uid"] for c in companies]
        mark_companies_synced(company_uids)
        print(f"✔ Marked {len(company_uids)} companies as synced.")

    # --- JOB SYNC ---
    jobs = fetch_jobs()
    if jobs:
        publish("job", jobs)

        job_uids = [j["nucleus_uid"] for j in jobs]
        mark_jobs_synced(job_uids)
        print(f"✔ Marked {len(job_uids)} jobs as synced.")

    print("✔ Done publishing unsynced updates!")


if __name__ == "__main__":
    main()
