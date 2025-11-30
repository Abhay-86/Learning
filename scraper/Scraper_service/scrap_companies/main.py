from .scraper import get_companies
from .utils import validate_companies, get_company_names_with_empty_url, update_company_table
from .google_sheets import get_sheet_by_number


def main():
    """Main pipeline function to process and upload company data"""
    print("Starting company upload pipeline...")

    try:
        new_company_names = get_company_names_with_empty_url()

        print(f"Scraping {len(new_company_names)} companies...")
        companies_raw = get_companies(new_company_names)

        validated = validate_companies(companies_raw, existing_names=set())

        update_company_table(validated)

        print("✓ Successfully updated company table!")

    except Exception as e:
        print(f"Error in pipeline: {e}")

if __name__ == "__main__":
    main()
    print("Pipeline execution completed.")