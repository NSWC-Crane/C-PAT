.. _db:


Database
########################################


The C-PAT API was developed with a Controller-Service model that allows additional database services to be developed while using the same Controller code. However, the only database currently supported is MySQL.


Database User Requirements
-----------------------------------

The database user specified must have sufficient permissions on the specified schema to update and create tables.
Specify the User and Schema with these environment variables:

    * ``CPAT_DB_SCHEMA``
    * ``CPAT_DB_USER``



.. _mySQL:


Database - MySQL 8.0.21+
-----------------------------

The C-PAT API is tested with the latest 3 minor versions of the MySQL 8.0.x series and 9.0.1 Innovation.
While C-PAT will bootstrap when provided with an 8.0.21+ MySQL database, it is strongly recommended you use the latest version of MySQL 8.0.x available.

The API requires knowledge of 1) the DB address/port, 2) which schema (database) is used for C-PAT, and 3) User credentials with necessary privileges on that schema. `More information about MySQL. <https://dev.mysql.com/doc/>`_

.. note::
   The API includes a database migration function which tracks the database schema version and if necessary can automatically update the schema at launch. The initial run of the API scaffolds all database objects and static data.  Releases that require a database change will include a message in the release notes.


Configure MySQL
~~~~~~~~~~~~~~~~~~~~

The C-PAT API requires a dedicated MySQL database (equivalent to a schema in other RDBMS products). The API connects to MySQL with an account that must have a full grant to the dedicated database but does not require server administration privileges. On first bootstrap, all database tables, views, and static data will be created.
Example commands to prepare MySQL for initial API execution:

  * Create database: ``CREATE DATABASE cpat``
  * Create API user account - ``CREATE USER 'cpat'@'%' IDENTIFIED BY 'new_password'``
  * Grant API user account all privileges on created database ``GRANT ALL ON cpat.* TO 'cpat'``
  * Set ``event_scheduler=ON`` in the MySQL configuration file (my.cnf or my.ini) to enable the event scheduler. This is required for the database to run scheduled tasks, such as updating POAM statuses to 'Expired'.

.. note::
   Suggested DB configuration options:
    - ``sort_buffer_size`` - set to at least 2M (2097152), and perhaps up to 64M (Increasing the sort_buffer_size from the default of 256k may only be required if you have very large detail/comment text fields).
    - ``innodb_buffer_pool_size`` -  set to at least 256M (268435456), and perhaps up to 2GB (2147483648)


Configure C-PAT to use your MySQL Database
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Specify your MySQL DB with the following Environment Variables:

 * *CPAT_DB_HOST* - Default: localhost - The database hostname or IP from to the API server
 * *CPAT_DB_PORT* - Default: 3306 - The database TCP port relative to the API server
 * *CPAT_DB_USER* - Default: cpat - The user account used to login to the database
 * *CPAT_DB_SCHEMA* - Default: cpat - The schema where the C-PAT object is found
 * *CPAT_DB_PASSWORD* - The database user password. Not required if configuring TLS connections, as shown below.

To enable TLS connections with your MySQL database, specify the following Environment Variables:

 * *CPAT_DB_TLS_CA_FILE* - A file/path relative to the API /tls directory that contains the PEM encoded CA certificate used to sign the database TLS certificate. Setting this variable enables TLS connections to the database.
 * *CPAT_DB_TLS_CERT_FILE* - A file/path relative to the API /tls directory that contains the PEM encoded Client certificate used when authenticating the database client.
 * *CPAT_DB_TLS_KEY_FILE* - A file/path relative to the API /tls directory that contains the PEM encoded Client private key used when authenticating the database client.