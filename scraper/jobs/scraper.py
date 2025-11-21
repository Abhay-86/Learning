from linkedin_scraper import actions
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

developer_jobs = [
    "software developer",
    "web developer",
    "python developer",
    "frontend developer",
    "backend developer",
    "full stack developer",
    "data scientist",
    "machine learning engineer",
    "mobile app developer",
    "android developer",
    "ios developer",
    "devops engineer",
    "cloud engineer",
    "data engineer",
    "ai engineer"
]


BASE_URL = "https://www.linkedin.com/jobs/search/"
page_number = 5

def get_jobs():
    """Scrape LinkedIn jobs based on predefined keywords"""
    driver = webdriver.Chrome()
    time.sleep(5)
    
    # LinkedIn credentials - these should be passed as parameters in production
    email = "santlalc27@gmail.com"
    password = "Sant@123"
    
    try:
        actions.login(driver, email, password)
    except TimeoutException:
        time.sleep(30)

    print("Logged in successfully")
    all_jobs_data = []
    
    try:
        total_jobs_found = 0
        seen_job_urls = set() 
        
        for idx, job_keyword in enumerate(job_keywords, 1):
            keyword_jobs_count = 0
            
            for page in range(page_number):
                start_param = page * 25
                encoded_keyword = job_keyword.replace(" ", "%20")
                search_url = f"{BASE_URL}?f_TPR=r86400&keywords={encoded_keyword}&start={start_param}"
                driver.get(search_url)
                time.sleep(5)
                
                last_height = driver.execute_script("return document.body.scrollHeight")
                scroll_attempts = 0
                max_scroll_attempts = 2 
                
                while scroll_attempts < max_scroll_attempts:
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(2)
                    new_height = driver.execute_script("return document.body.scrollHeight")
                    if new_height == last_height:
                        scroll_attempts += 1
                    else:
                        scroll_attempts = 0  
                    last_height = new_height
                    
                try:
                    job_cards = WebDriverWait(driver, 15).until(
                        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-job-id]"))
                    )
                    
                    page_jobs = []
                    
                    for i, job_card in enumerate(job_cards, 1):
                        try:
                            job_title = "N/A"
                            job_url = "N/A"
                            
                            title_selectors = [
                                "h3 a span[title]",
                                "h3 a",
                                ".base-search-card__title a",
                                ".job-card-container__link",
                                "a[data-tracking-control-name*='job']",
                                ".base-card__full-link",
                                "a span[aria-hidden='true']"
                            ]
                            
                            for selector in title_selectors:
                                try:
                                    job_title_elem = job_card.find_element(By.CSS_SELECTOR, selector)
                                    if job_title_elem:
                                        job_title = job_title_elem.text.strip() or job_title_elem.get_attribute("title") or "N/A"
                                        if job_title_elem.tag_name == "a":
                                            job_url = job_title_elem.get_attribute("href") or "N/A"
                                        else:
                                            # Find parent link
                                            parent_link = job_title_elem.find_element(By.XPATH, "./ancestor::a[1]")
                                            job_url = parent_link.get_attribute("href") if parent_link else "N/A"
                                        if job_title != "N/A":
                                            break
                                except:
                                    continue
                                    
                            company_name = "N/A"
                            company_selectors = [
                                # Primary company selectors
                                ".base-search-card__subtitle a",
                                ".job-search-card__subtitle-link",
                                ".job-card-container__company-name",
                                "h4 a",
                                ".base-search-card__subtitle",
                                ".job-search-card__subtitle",
                                "a[data-tracking-control-name='public_jobs_jserp-result_job-search-card-subtitle']",
                                "span[data-tracking-control-name='public_jobs_jserp-result_job-search-card-subtitle']",
                                "[data-tracking-control-name*='company']",
                                ".job-card-container__primary-description",
                                "a[href*='/company/']",
                                ".artdeco-entity-lockup__subtitle",
                                ".job-result-card__subtitle",
                                ".jobs-search-results-list__subtitle"
                            ]
                            
                            for selector in company_selectors:
                                try:
                                    company_elem = job_card.find_element(By.CSS_SELECTOR, selector)
                                    if company_elem:
                                        # Try text first, then aria-label, then title attribute
                                        company_text = (company_elem.text.strip() or 
                                                    company_elem.get_attribute("aria-label") or 
                                                    company_elem.get_attribute("title") or "").strip()
                                        
                                        # Clean up common prefixes/suffixes
                                        if company_text and company_text not in ["N/A", "", "Company"]:
                                            # Remove common prefixes like "Company: "
                                            company_text = company_text.replace("Company:", "").strip()
                                            company_name = company_text
                                            break
                                except:
                                    continue
                            
                            if company_name == "N/A":
                                try:
                                    # Look for company info in sibling or parent elements
                                    all_text_elements = job_card.find_elements(By.CSS_SELECTOR, "a, span, div")
                                    for elem in all_text_elements[:10]:  # Check first 10 elements only
                                        elem_text = elem.text.strip()
                                        href = elem.get_attribute("href") or ""
                                        
                                        # If element links to a company page, it's likely the company name
                                        if "/company/" in href and elem_text and len(elem_text) < 100:
                                            company_name = elem_text
                                            break
                                except:
                                    pass
                            
                            # Try to find location with multiple selectors
                            location = "N/A"
                            location_selectors = [
                                ".job-search-card__location",
                                ".base-search-card__metadata .job-card-container__metadata-item",
                                ".base-search-card__metadata",
                                "[data-tracking-control-name*='location']"
                            ]
                            
                            for selector in location_selectors:
                                try:
                                    location_elem = job_card.find_element(By.CSS_SELECTOR, selector)
                                    if location_elem:
                                        location = location_elem.text.strip()
                                        if location:
                                            break
                                except:
                                    continue
                            
                            # Check for duplicates using URL
                            if job_url != "N/A" and job_url not in seen_job_urls:
                                seen_job_urls.add(job_url)
                                
                                # Store job data
                                job_data = {
                                    'title': job_title,
                                    'company': company_name,
                                    'location': location,
                                    'url': job_url,
                                    'job_type': job_keyword,
                                    'page': page + 1
                                }
                                page_jobs.append(job_data)
                            
                        except Exception as job_error:
                            continue  
                    
                    all_jobs_data.extend(page_jobs)
                    keyword_jobs_count += len(page_jobs)
                    
                except Exception as page_error:
                    print(f"Error on page {page + 1}: {str(page_error)[:50]}...")
                    continue
                    
    except Exception as e:
        print(f"Error during scraping: {e}")
    finally:
        driver.quit()
        
    return all_jobs_data
    