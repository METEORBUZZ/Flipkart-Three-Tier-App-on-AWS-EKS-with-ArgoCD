-- 01-create-databases.sql
-- Auto-executed by PostgreSQL container during first boot

-- Enable pg_trgm extension for fast full-text / fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create microservice specific databases
CREATE DATABASE flipkart_users;
CREATE DATABASE flipkart_catalog;
CREATE DATABASE flipkart_orders;
CREATE DATABASE flipkart_payments;
CREATE DATABASE flipkart_inventory;
CREATE DATABASE flipkart_delivery;
CREATE DATABASE flipkart_reviews;

-- Grant permissions to default postgres user
GRANT ALL PRIVILEGES ON DATABASE flipkart_users TO postgres;
GRANT ALL PRIVILEGES ON DATABASE flipkart_catalog TO postgres;
GRANT ALL PRIVILEGES ON DATABASE flipkart_orders TO postgres;
GRANT ALL PRIVILEGES ON DATABASE flipkart_payments TO postgres;
GRANT ALL PRIVILEGES ON DATABASE flipkart_inventory TO postgres;
GRANT ALL PRIVILEGES ON DATABASE flipkart_delivery TO postgres;
GRANT ALL PRIVILEGES ON DATABASE flipkart_reviews TO postgres;
