-- Create nucleus table first (referenced by other tables)
DROP TABLE IF EXISTS nucleus CASCADE;

CREATE TABLE nucleus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    nucleus_uid BIGINT NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    variant TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create job_scraper_temp table
DROP TABLE IF EXISTS job_scraper_temp;

CREATE TABLE job_scraper_temp (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,        
    location TEXT,
    job_type TEXT,
    url TEXT NOT NULL,
    scraped_at TIMESTAMPTZ NOT NULL
);

-- Create job_scraper table with foreign key to nucleus
DROP TABLE IF EXISTS job_scraper;

CREATE TABLE job_scraper (
    id SERIAL PRIMARY KEY,
    nucleus_uid BIGINT NOT NULL REFERENCES nucleus(nucleus_uid),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    job_type TEXT,
    url TEXT NOT NULL,
    scraped_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_nucleus_name ON nucleus(name);
CREATE INDEX idx_job_scraper_temp_company ON job_scraper_temp(company);
CREATE INDEX idx_job_scraper_nucleus_uid ON job_scraper(nucleus_uid);
CREATE INDEX idx_job_scraper_url ON job_scraper(url);
