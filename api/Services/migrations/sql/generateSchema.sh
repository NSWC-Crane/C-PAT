#!/bin/bash

# Use this script to generate the current schema and static data for the database.
# It will produce two SQL scripts which will be used in the application to recreate a new database schema in its most recent state. 

#NEEDS: mysqldump

#How to use:
# 1. Ensure that the MySQL server is running and that the database is accessible and in its most recent state.
# 2. Run this script from the command line.
# 3. When C-PAT is started, it will automatically run the SQL scripts to create the database schema and insert the static data.


#List of table names for static data.
static_data_tables="_migrations"

# Export the schema of all tables in the database into a SQL file,
# removing any AUTO_INCREMENT attribute values to prevent conflicts with existing data when imported
# and removing statements that trigger a mysql2 bug when changing client character set
# The '--no-data' flag means no table row data will be dumped, only the schema.
# The '--no-create-db' flag prevents the inclusion of CREATE DATABASE statements in the dump.
mysqldump -h 127.0.0.1 -P 3306 -u root -proot --no-data --no-create-db cpat |
  sed --expression='s/ AUTO_INCREMENT=[0-9]\+//' |
  awk 'tolower($0) !~ /character_set|set names/' > 10-cpat-tables.sql

# Export only the data from specific tables listed in $static_data_tables into a separate SQL file. 
# '--no-create-info' flag ensures that table creation statements are not included, just the row insertions.
mysqldump -h 127.0.0.1 -P 3306 -u root -proot --no-create-info cpat $static_data_tables |
  awk 'tolower($0) !~ /character_set|set names/' > 20-cpat-static.sql