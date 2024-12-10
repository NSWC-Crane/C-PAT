static_data_tables="_migrations themes"

mysqldump -h 127.0.0.1 -P 3306 -u root -proot --no-create-info cpat $static_data_tables |
  awk 'tolower($0) !~ /character_set|set names/' > 20-cpat-static.sql

mysqldump -h 127.0.0.1 -P 3306 -u root -proot --no-create-db --no-data --routines --triggers cpat |
  awk 'tolower($0) !~ /character_set|set names/' >> 10-cpat-tables.sql