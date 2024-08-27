# Keycloak for RMF Tools (C-PAT & STIG Manager)

A Keycloak authentication server pre-configured for demonstrating C-PAT and/or STIG Manager. The "Master" realm is configured with an admin user which can be used to perform Keycloak configuration.

## Admin Console Access

Access the admin console at [http://localhost:8080](http://localhost:8080)

| Username | Password |
|----------|----------|
| admin    | Pa55w0rd |

## RMF Tools Realm

An "RMF Tools" realm is imported during initialization. The following users are defined and can be used when authenticating from the C-PAT or STIG Manager Client:

| Username | Password |
|----------|----------|
| admin    | password |
| user01   | password |
| user02   | password |
| user03   | password |
| user04   | password |
| user05   | password |
