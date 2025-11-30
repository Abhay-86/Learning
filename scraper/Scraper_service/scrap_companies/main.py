from .scraper import get_companies
from .utils import validate_companies, upload_to_sheet, get_company_names, update_company_table
from .google_sheets import get_sheet_by_number


def main():
    """Main pipeline function to process and upload company data"""
    print("Starting company upload pipeline...")

    try:
        # Step 1: Get new company names from sheet #4
        new_company_names = get_company_names()

        # Step 2: Scrape company information for unique new names
        print(f"Scraping {len(new_company_names)} companies...")
        companies_data = get_companies(new_company_names)

        # Step 3: Update the company table
        update_company_table(companies_data)

        print("✓ Successfully updated company table!")
            
    except Exception as e:
        print(f"Error in pipeline: {e}")

if __name__ == "__main__":
    main()

    print("Pipeline execution completed.")