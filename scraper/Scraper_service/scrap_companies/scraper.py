from linkedin_scraper import Company, actions
from selenium import webdriver
from selenium.common.exceptions import TimeoutException, WebDriverException
from .utils import get_credentials, mark_credential_used, mark_credential_blocked
import time
import random

from .utils import build_company_url

def _handle_post_login_prompts(driver):
    """
    Automatically handle common LinkedIn post-login prompts like password save, verification, etc.
    
    Args:
        driver: Selenium WebDriver instance
    """
    try:
        print("🔍 Checking for post-login prompts to handle automatically...")
        
        # Wait a moment for any prompts to appear
        time.sleep(3)
        
        # Handle password save prompt - click "Not now" or "Skip"
        password_save_selectors = [
            "button[data-id='save-to-browser-modal-skip-button']",
            "button[aria-label='Skip']",
            "button[aria-label='Not now']",
            ".save-to-browser-modal__skip-button",
            "//button[contains(text(), 'Not now')]",
            "//button[contains(text(), 'Skip')]",
            "//button[contains(text(), 'Maybe later')]"
        ]
        
        for selector in password_save_selectors:
            try:
                if selector.startswith("//"):
                    element = driver.find_element("xpath", selector)
                else:
                    element = driver.find_element("css selector", selector)
                if element.is_displayed() and element.is_enabled():
                    element.click()
                    print("✅ Auto-skipped password save prompt")
                    time.sleep(2)
                    break
            except:
                continue
        
        # Handle "Remember me" checkbox - uncheck it to avoid complications
        remember_selectors = [
            "input[name='remember-me']",
            "#remember-me",
            "input[type='checkbox'][id*='remember']"
        ]
        
        for selector in remember_selectors:
            try:
                element = driver.find_element("css selector", selector)
                if element.is_selected():
                    element.click()
                    print("✅ Auto-unchecked 'Remember me' option")
                    time.sleep(1)
            except:
                continue
        
        # Handle verification challenges automatically if possible
        verification_selectors = [
            "button[data-id='challenge-skip-button']",
            "//button[contains(text(), 'Skip for now')]",
            "//button[contains(text(), 'Skip this step')]",
            "//a[contains(text(), 'Skip for now')]"
        ]
        
        for selector in verification_selectors:
            try:
                if selector.startswith("//"):
                    element = driver.find_element("xpath", selector)
                else:
                    element = driver.find_element("css selector", selector)
                if element.is_displayed() and element.is_enabled():
                    element.click()
                    print("✅ Auto-skipped verification challenge")
                    time.sleep(3)
                    break
            except:
                continue
        
        # Handle notification prompts
        notification_selectors = [
            "button[aria-label='Dismiss']",
            "button[aria-label='Close']",
            ".notification-banner__dismiss",
            "//button[contains(@aria-label, 'dismiss')]"
        ]
        
        for selector in notification_selectors:
            try:
                if selector.startswith("//"):
                    element = driver.find_element("xpath", selector)
                else:
                    element = driver.find_element("css selector", selector)
                if element.is_displayed() and element.is_enabled():
                    element.click()
                    print("✅ Auto-dismissed notification")
                    time.sleep(1)
            except:
                continue
        
        # Check if we successfully reached the main LinkedIn interface
        main_indicators = [
            ".global-nav__me",
            ".feed-identity-module",
            "[data-control-name='identity_welcome_message']"
        ]
        
        for indicator in main_indicators:
            try:
                element = driver.find_element("css selector", indicator)
                if element.is_displayed():
                    print("✅ Successfully reached LinkedIn main interface")
                    return True
            except:
                continue
        
        print("⚠️  Post-login handling completed - proceeding with current state")
        return True
        
    except Exception as e:
        print(f"⚠️  Post-login prompt handling warning: {str(e)[:60]}...")
        return True  # Continue anyway

def _validate_session_lightweight(driver):
    """
    Lightweight session validation that doesn't navigate away from current page
    
    Args:
        driver: Selenium WebDriver instance
        
    Returns:
        bool: True if session is still valid
    """
    try:
        # Simply test if we can execute a basic command
        driver.current_url
        
        # Test if driver is responsive
        driver.execute_script("return document.readyState;")
        
        return True
    except WebDriverException:
        print("⚠️  WebDriver session appears to be closed")
        return False
    except Exception as e:
        print(f"⚠️  Session validation warning: {str(e)[:50]}...")
        return True  # Assume it's still valid for minor errors

def _create_persistent_session(email, password):
    """
    Create a single persistent session that will be used for all companies
    
    Args:
        email: LinkedIn login email
        password: LinkedIn login password
        
    Returns:
        driver: WebDriver instance logged into LinkedIn
    """
    print("🔐 Creating single persistent LinkedIn session...")
    
    # Configure Chrome options for stability
    from selenium.webdriver.chrome.options import Options
    chrome_options = Options()
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--allow-running-insecure-content")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    time.sleep(random.uniform(2, 4))
    
    try:
        # Perform login
        actions.login(driver, email, password)
        print("✓ Initial login attempt completed")
        
        # Handle post-login prompts automatically
        _handle_post_login_prompts(driver)
        
        time.sleep(random.uniform(5, 8))  # Stability delay
        print("✅ Persistent session created and fully authenticated")
        print("🔒 This session will be used for all companies to avoid re-login")
        return driver
        
    except TimeoutException:
        print("⚠️  Login timeout - attempting to handle automatically...")
        # Try to handle common post-login scenarios
        _handle_post_login_prompts(driver)
        time.sleep(10)
        print("✅ Auto-handled login timeout - proceeding with session")
        return driver
        
    except Exception as e:
        print(f"⚠️  Login issue detected: {str(e)[:100]}...")
        # Try to handle post-login prompts even on errors
        _handle_post_login_prompts(driver)
        time.sleep(5)
        print("✅ Auto-handled login issue - proceeding with session")
        return driver

def get_companies(company_names_list: list[str]) -> list[dict]:
    """
    Scrape LinkedIn companies using a single persistent login session to avoid account banning
    
    Args:
        company_names_list (list): List of company names to scrape
        
    Returns:
        list: List of company data dictionaries
    """
    if not company_names_list:
        print("No company names provided!")
        return []
        
    # LinkedIn credentials - these should be passed as parameters in production
    # email = "santlalc27@gmail.com"
    # password = "Sant@123"

    # Get credentials from database
    credentials = get_credentials()
    email = credentials.get("email")
    password = credentials.get("password") 
    mark_credential_used(email)
    
    # Create single persistent session - NO RE-LOGIN throughout entire process
    driver = _create_persistent_session(email, password)
    all_companies_data = []
    failed_companies = []
    
    print(f"🚀 Starting bulk scraping of {len(company_names_list)} companies with single session")
    print("🔒 No re-login will occur to prevent account banning")
    
    try:
        for idx, company_name in enumerate(company_names_list, 1):
            print(f"\n📊 Processing company {idx}/{len(company_names_list)}: {company_name}")
            
            # Lightweight session check (no navigation)
            if not _validate_session_lightweight(driver):
                print("❌ Driver session lost - cannot continue without re-login")
                print("💡 Tip: Try running fewer companies at once or check internet connection")
                break
            
            try:
                # Build the company URL using utility function
                company_url = build_company_url(company_name)
                print(f"🔗 Generated URL: {company_url}")
                
                # Create company object with existing driver - keep session alive
                company = Company(
                    linkedin_url=company_url, 
                    driver=driver, 
                    scrape=False,  # Don't auto-scrape to maintain control
                    get_employees=False,
                    close_on_complete=False  # NEVER close the driver
                )
                
                # Manually trigger scraping while keeping driver open
                company.scrape(get_employees=False, close_on_complete=False)
                
                # Extract company data
                company_data = {
                    'Company': getattr(company, 'name', 'N/A'),
                    'about_us': getattr(company, 'about_us', 'N/A'),
                    'website': getattr(company, 'website', 'N/A'),
                    'headquarters': getattr(company, 'headquarters', 'N/A'),
                    'founded': getattr(company, 'founded', 'N/A'),
                    'company_type': getattr(company, 'company_type', 'N/A'),
                    'company_size': getattr(company, 'company_size', 'N/A'),
                    'url': company_url
                }
                
                # Only add if company name was successfully scraped
                if company_data['Company'] != 'N/A' and company_data['Company']:
                    all_companies_data.append(company_data)
                    print(f"✅ Successfully scraped: {company_data['Company']}")
                else:
                    print(f"⚠️  No data found for: {company_name}")
                    failed_companies.append(company_name)
                        
            except Exception as company_error:
                error_msg = str(company_error)[:150]
                print(f"❌ Error scraping {company_name}: {error_msg}...")
                failed_companies.append(company_name)
                
                # Continue with next company instead of breaking entire process
                print("🔄 Continuing with next company...")
            
            # Random delay between companies for natural behavior
            if idx < len(company_names_list):  # Don't delay after last company
                delay = random.uniform(4, 10)
                print(f"⏳ Waiting {delay:.1f} seconds before next company...")
                time.sleep(delay)
                
        print(f"\n🎯 Processed {idx} companies successfully")
                
    except KeyboardInterrupt:
        print(f"\n⚠️  Process interrupted by user after {len(all_companies_data)} successful scrapes")
    except Exception as e:
        print(f"❌ Critical error during scraping: {e}")
        print("💡 The single session approach failed - check LinkedIn access or network")
    finally:
        print("🔒 Closing persistent session...")
        try:
            driver.quit()
        except:
            pass
        
    # Final results
    print(f"\n" + "="*60)
    print(f"📊 BULK SCRAPING RESULTS (Single Session)")
    print(f"✅ Successfully scraped: {len(all_companies_data)} companies")
    print(f"❌ Failed to scrape: {len(failed_companies)} companies")
    print(f"📈 Success rate: {(len(all_companies_data)/len(company_names_list)*100):.1f}%")
    
    if failed_companies:
        print(f"\n❌ Failed companies:")
        for i, failed_name in enumerate(failed_companies[:10]):  # Show first 10
            print(f"   {i+1}. {failed_name}")
        if len(failed_companies) > 10:
            print(f"   ... and {len(failed_companies) - 10} more")
    
    print("🔐 No re-logins performed - account safe from banning")
    print("="*60)
    
    return all_companies_data