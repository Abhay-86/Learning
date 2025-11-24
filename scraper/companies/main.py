from .scraper import get_companies
from .utils import validate_companies, upload_to_sheet, get_company_names
from .google_sheets import get_sheet_by_number


def main():
    """Main pipeline function to process and upload company data"""
    print("Starting company upload pipeline...")

    try:
        # Step 1: Get new company names from sheet #4
        new_data_sheet = get_sheet_by_number(4)
        print(f"Accessed new data sheet: {new_data_sheet.title}")
        
        # Get new company names from the sheet
        new_company_names = get_company_names(new_data_sheet)
        print(f"Found {len(new_company_names)} new company names: {list(new_company_names)}")
        
        # Step 2: Get existing company names from old sheet #2
        old_sheet = get_sheet_by_number(2) 
        print(f"Accessed old sheet: {old_sheet.title}")
        
        existing_names = get_company_names(old_sheet)
        print(f"Existing companies in old sheet: {len(existing_names)} names found")
        
        # Step 3: Remove duplicates - filter out companies that already exist
        unique_new_names = [name for name in new_company_names if name not in existing_names]
        print(f"Unique new companies to scrape: {len(unique_new_names)} - {unique_new_names}")
        
        if not unique_new_names:
            print("No new unique companies to scrape!")
            return

        # Step 4: Scrape company information for unique new names
        print(f"Scraping {len(unique_new_names)} companies...")
        companies_data = get_companies(unique_new_names)

        # Step 5: Validate and upload to old sheet
        valid_companies = validate_companies(companies_data, existing_names)
        print(f"Valid companies after filtering: {len(valid_companies)}")

        if valid_companies:
            upload_to_sheet(old_sheet, valid_companies)
            print("✓ Successfully uploaded new companies to old sheet!")
        else:
            print("No valid new companies to upload")
            
    except Exception as e:
        print(f"Error in pipeline: {e}")
        # Fallback: use provided list if sheets not available

if __name__ == "__main__":
    # Test with sample data when run directly
    print("Running main.py directly - testing with sample data...")
    main()

    print("Pipeline execution completed.")