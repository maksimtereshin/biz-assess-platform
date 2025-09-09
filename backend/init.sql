-- Initial database setup script
-- This script runs when the PostgreSQL container is first created

-- Create database if it doesn't exist (though it should be created by POSTGRES_DB)
-- CREATE DATABASE IF NOT EXISTS bizass_platform;

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The actual tables will be created by TypeORM migrations
-- This file can be used for any initial data or additional setup
