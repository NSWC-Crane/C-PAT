CREATE DATABASE IF NOT EXISTS stigman;
CREATE DATABASE IF NOT EXISTS cpat;

-- Grant privileges to root user for both databases
GRANT ALL PRIVILEGES ON stigman.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON cpat.* TO 'root'@'%';
FLUSH PRIVILEGES;