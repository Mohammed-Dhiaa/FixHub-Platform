-- ============================================================================
-- FixHub – Database Schema  (PostgreSQL)
-- ============================================================================
-- Description : Creates the relational schema for the FixHub local-services
--               marketplace.  Covers Users, Companies, Workers, Categories,
--               and the junction table linking Companies to Categories.
--
-- Relationships:
--   • One User   → owns one Company           (1:1)
--   • One Company → has many Workers           (1:M, CASCADE delete)
--   • One Category ↔ many Companies            (M:N via company_categories)
--
-- Author : Mohammed Dhiaa  |  Milestone 2
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 0.  Drop existing tables (for easy re-runs during development)
-- ────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS company_categories CASCADE;
DROP TABLE IF EXISTS workers             CASCADE;
DROP TABLE IF EXISTS companies           CASCADE;
DROP TABLE IF EXISTS categories          CASCADE;
DROP TABLE IF EXISTS users               CASCADE;

-- ────────────────────────────────────────────────────────────────────────────
-- 1.  USERS TABLE
-- ────────────────────────────────────────────────────────────────────────────
-- Stores account information for all registered users (both Customers and
-- Company owners).  The "role" column differentiates the two.
CREATE TABLE users (
    user_id       SERIAL         PRIMARY KEY,                -- Auto-incrementing PK
    full_name     VARCHAR(120)   NOT NULL,                   -- User's display name
    email         VARCHAR(255)   NOT NULL UNIQUE,            -- Login email (unique)
    password_hash VARCHAR(255)   NOT NULL,                   -- Bcrypt / Argon2 hash
    phone         VARCHAR(20),                               -- Optional phone number
    role          VARCHAR(20)    NOT NULL DEFAULT 'customer' -- 'customer' | 'company'
                   CHECK (role IN ('customer', 'company')),
    created_at    TIMESTAMP      NOT NULL DEFAULT NOW(),     -- Account creation time
    updated_at    TIMESTAMP      NOT NULL DEFAULT NOW()      -- Last profile update
);

-- Index on email for fast login lookups
CREATE INDEX idx_users_email ON users (email);

-- ────────────────────────────────────────────────────────────────────────────
-- 2.  CATEGORIES TABLE
-- ────────────────────────────────────────────────────────────────────────────
-- Predefined service categories (e.g. Plumbing, Electrical, Cleaning).
CREATE TABLE categories (
    category_id   SERIAL        PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL UNIQUE,             -- Category display name
    description   TEXT,                                      -- Short blurb (optional)
    icon          VARCHAR(10),                               -- Emoji / icon code
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3.  COMPANIES TABLE
-- ────────────────────────────────────────────────────────────────────────────
-- Each company is owned by exactly one user (FK → users.user_id).
CREATE TABLE companies (
    company_id    SERIAL        PRIMARY KEY,
    owner_id      INT           NOT NULL UNIQUE,             -- One user → one company
    name          VARCHAR(150)  NOT NULL,                    -- Company display name
    description   TEXT,                                      -- About / bio
    phone         VARCHAR(20),                               -- Company phone line
    email         VARCHAR(255),                              -- Company contact email
    address       VARCHAR(255),                              -- Physical address
    city          VARCHAR(100),
    rating        NUMERIC(2,1)  DEFAULT 0.0                  -- Average rating (0.0–5.0)
                   CHECK (rating >= 0 AND rating <= 5),
    is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,      -- Admin verification flag
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),

    -- Foreign key: company owner must be an existing user
    CONSTRAINT fk_company_owner
        FOREIGN KEY (owner_id) REFERENCES users (user_id)
        ON DELETE CASCADE                                   -- Delete company if owner deleted
);

-- Index for owner lookups
CREATE INDEX idx_companies_owner ON companies (owner_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 4.  WORKERS TABLE
-- ────────────────────────────────────────────────────────────────────────────
-- Employees / technicians that belong to a company.
-- Relationship: Company 1 ──► M Workers  (ON DELETE CASCADE).
CREATE TABLE workers (
    worker_id     SERIAL        PRIMARY KEY,
    company_id    INT           NOT NULL,                    -- FK → companies
    full_name     VARCHAR(120)  NOT NULL,
    email         VARCHAR(255)  UNIQUE,                      -- Optional work email
    phone         VARCHAR(20),
    role          VARCHAR(100)  NOT NULL DEFAULT 'Technician', -- Job title / speciality
    status        VARCHAR(20)   NOT NULL DEFAULT 'Active'
                   CHECK (status IN ('Active', 'On Leave', 'Inactive')),
    hire_date     DATE          DEFAULT CURRENT_DATE,        -- Date added to the team
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),

    -- Foreign key: worker belongs to a company
    CONSTRAINT fk_worker_company
        FOREIGN KEY (company_id) REFERENCES companies (company_id)
        ON DELETE CASCADE                                   -- Remove workers if company deleted
);

-- Indexes for common queries
CREATE INDEX idx_workers_company ON workers (company_id);
CREATE INDEX idx_workers_status  ON workers (status);

-- ────────────────────────────────────────────────────────────────────────────
-- 5.  COMPANY_CATEGORIES  (Junction / Association Table)
-- ────────────────────────────────────────────────────────────────────────────
-- Implements the Many-to-Many relationship between Companies and Categories.
-- A company can operate in several categories, and each category can have
-- many companies.
CREATE TABLE company_categories (
    company_id    INT NOT NULL,
    category_id   INT NOT NULL,

    -- Composite primary key prevents duplicate assignments
    PRIMARY KEY (company_id, category_id),

    CONSTRAINT fk_cc_company
        FOREIGN KEY (company_id) REFERENCES companies (company_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cc_category
        FOREIGN KEY (category_id) REFERENCES categories (category_id)
        ON DELETE CASCADE
);


-- ════════════════════════════════════════════════════════════════════════════
-- SEED DATA  (for demonstration / testing)
-- ════════════════════════════════════════════════════════════════════════════

-- ── Categories ──
INSERT INTO categories (name, description, icon) VALUES
    ('Plumbing',    'Pipe repairs, installations, and water systems.',  '🔧'),
    ('Electrical',  'Wiring, panel upgrades, and lighting.',            '⚡'),
    ('Cleaning',    'Home and office deep-cleaning services.',          '🧹'),
    ('Painting',    'Interior and exterior painting services.',         '🎨'),
    ('HVAC',        'Heating, ventilation, and air conditioning.',      '❄️'),
    ('Carpentry',   'Custom furniture, cabinetry, and woodwork.',       '🪚');

-- ── Users (Company Owners) ──
-- NOTE: Passwords below are placeholder hashes. In production, use a proper
--       hashing library (bcrypt / Argon2) before inserting.
INSERT INTO users (full_name, email, password_hash, phone, role) VALUES
    ('Ali Mahmoud',   'ali@aquaflow.com',      '$2b$12$placeholderHashAquaFlow',  '+1 (555) 100-0001', 'company'),
    ('Khalid Saeed',  'khalid@brightspark.com', '$2b$12$placeholderHashBright',   '+1 (555) 100-0002', 'company'),
    ('Mona Redwan',   'mona@sparkleclean.com',  '$2b$12$placeholderHashSparkle',  '+1 (555) 100-0003', 'company');

-- ── Companies ──
INSERT INTO companies (owner_id, name, description, phone, email, address, city, rating, is_verified) VALUES
    (1, 'AquaFlow Plumbing',    'Licensed & insured plumbing professionals serving Downtown.',
         '+1 (234) 567-890', 'contact@aquaflow.com',    '123 Main St',   'Downtown',  4.9, TRUE),
    (2, 'BrightSpark Electric', 'Residential and commercial electrical solutions.',
         '+1 (234) 567-891', 'info@brightspark.com',    '456 Oak Ave',   'Midtown',   4.8, TRUE),
    (3, 'SparkleClean Co.',     'Deep cleaning and regular maintenance.',
         '+1 (234) 567-892', 'hello@sparkleclean.com',  '789 Elm Blvd',  'Westside',  4.7, TRUE);

-- ── Company ↔ Category Links ──
INSERT INTO company_categories (company_id, category_id) VALUES
    (1, 1),   -- AquaFlow     → Plumbing
    (2, 2),   -- BrightSpark  → Electrical
    (3, 3);   -- SparkleClean → Cleaning

-- ── Workers ──
INSERT INTO workers (company_id, full_name, email, phone, role, status) VALUES
    -- AquaFlow workers
    (1, 'Ahmed Khalid',  'ahmed@aquaflow.com',  '+1 (555) 111-2233', 'Senior Plumber',       'Active'),
    (1, 'Sara Nasser',   'sara@aquaflow.com',   '+1 (555) 222-3344', 'Plumber',              'Active'),
    (1, 'Omar Mansour',  'omar@aquaflow.com',   '+1 (555) 333-4455', 'Pipe Fitter',          'Active'),
    (1, 'Lina Hassan',   'lina@aquaflow.com',   '+1 (555) 444-5566', 'Apprentice Plumber',   'On Leave'),
    (1, 'Yusuf Ali',     'yusuf@aquaflow.com',  '+1 (555) 555-6677', 'Emergency Technician', 'Active'),
    -- BrightSpark workers
    (2, 'Fatima Zayed',  'fatima@brightspark.com', '+1 (555) 666-7788', 'Lead Electrician', 'Active'),
    (2, 'Hassan Omar',   'hassan@brightspark.com', '+1 (555) 777-8899', 'Electrician',      'Active'),
    -- SparkleClean workers
    (3, 'Nadia Karim',   'nadia@sparkleclean.com', '+1 (555) 888-9900', 'Team Lead',        'Active'),
    (3, 'Rami Taher',    'rami@sparkleclean.com',  '+1 (555) 999-0011', 'Cleaner',          'Active');


-- ════════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ════════════════════════════════════════════════════════════════════════════
