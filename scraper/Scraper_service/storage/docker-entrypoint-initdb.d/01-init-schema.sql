-- Drop nucleus first (because others depend on it)
DROP TABLE IF EXISTS job_scraper CASCADE;
DROP TABLE IF EXISTS job_scraper_temp CASCADE;
DROP TABLE IF EXISTS nucleus CASCADE;

-- Create nucleus table (TEXT UID)
CREATE TABLE nucleus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    nucleus_uid TEXT NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    variant TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create job_scraper_temp table
CREATE TABLE job_scraper_temp (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,        
    location TEXT,
    job_type TEXT,
    url TEXT NOT NULL,
    scraped_at TIMESTAMPTZ NOT NULL
);

-- Create job_scraper table with TEXT FK + UNIQUE url
CREATE TABLE job_scraper (
    id SERIAL PRIMARY KEY,
    nucleus_uid TEXT NOT NULL REFERENCES nucleus(nucleus_uid),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    job_type TEXT,
    url TEXT NOT NULL UNIQUE,   -- 🔥 LinkedIn URL unique
    scraped_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE company (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    nucleus_uid TEXT NOT NULL REFERENCES nucleus(nucleus_uid) ON DELETE CASCADE,
    about_us TEXT,
    website TEXT,
    headquarters TEXT,
    founded VARCHAR(50),
    company_type VARCHAR(255),
    company_size VARCHAR(255),
    url TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE linked_in_credentials (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL, 
    is_blocked BOOLEAN DEFAULT FALSE, 
    last_used TIMESTAMPTZ DEFAULT NULL, 
    usage_count INT DEFAULT 0, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Indexes for performance
CREATE INDEX idx_nucleus_name ON nucleus(name);
CREATE INDEX idx_job_scraper_temp_company ON job_scraper_temp(company);
CREATE INDEX idx_job_scraper_nucleus_uid ON job_scraper(nucleus_uid);
CREATE INDEX idx_job_scraper_url ON job_scraper(url);
CREATE INDEX idx_company_name ON company(name);
CREATE INDEX idx_company_nucleus_uid ON company(nucleus_uid);
CREATE INDEX idx_company_website ON company(website);