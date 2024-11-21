#################################
POAM User Guide
#################################

Overview
========
The Plan of Action & Milestones (POAM) interface allows users to document, track, and manage security vulnerabilities. This guide covers the creation methods, field definitions, and management features available in the system.

POAM Creation Methods
====================

Automated POAM Creation
----------------------

STIG Manager Integration
~~~~~~~~~~~~~~~~~~~~~~~
When creating a POAM from STIG Manager findings:

1. The system automatically populates:
   * Vulnerability Source (set to "STIG")
   * STIG Title and Benchmark ID
   * Vulnerability ID 
   * Description from STIG check
   * Raw Severity mapped from STIG finding
   * Scheduled completion date (calculated based on severity)

2. Asset Management:
   * The Assets tab displays a live feed of affected assets from STIG Manager
   * Assets are automatically updated based on the current state in STIG Manager
   * Assets cannot be manually added/removed as they are managed by STIG Manager

Tenable Integration
~~~~~~~~~~~~~~~~~~
When creating a POAM from Tenable findings:

1. The system automatically populates:
   * Vulnerability Source (set to "ACAS")
   * Plugin ID
   * Full vulnerability description from Tenable
   * Raw Severity (mapped from Tenable severity)
   * IAVM information (when available)
   * Scheduled completion date (calculated based on severity)

2. Asset Management:
   * The Assets tab shows real-time affected assets from Tenable
   * Asset list updates automatically based on current Tenable scan data
   * Assets cannot be manually modified as they reflect live Tenable data

Manual POAM Creation
-------------------
While not recommended, POAMs can be created manually:

1. All fields must be entered by the user
2. Assets must be selected manually from the collection's asset list
3. Requires more validation and verification

Field Definitions
================

Basic Information
----------------

POAM Status
~~~~~~~~~~~
Available statuses:
* Draft - Initial state
* Submitted - Ready for review
* Pending CAT-I Approval - Awaiting critical review
* Extension Requested - Time extension pending
* Approved - Validated and accepted
* Rejected - Returned for modification
* Closed - Remediation complete
* False-Positive - Invalid finding
* Expired - Past due without extension

Description
~~~~~~~~~~
**Purpose**: Documents the vulnerability identified during assessment
* Pulled directly from assessment procedure or technical findings
* For manual entries, must detail the specific security weakness
* Maximum 10000 characters

A&A Package
~~~~~~~~~~
The Authorization & Assessment package associated with the POAM

Source Identification
-------------------

Vulnerability Source
~~~~~~~~~~~~~~~~~~
Identifies the source of the vulnerability:
* STIG
* Assured Compliance Assessment Solution (ACAS) Nessus Scanner
* Program review
* Test and evaluation findings
* IG DoD audit
* GAO audit

Plugin ID / Vulnerability ID
~~~~~~~~~~~~~~~~~~~~~~~~~~
* For ACAS: Tenable Plugin ID
* For STIG: STIG check ID
* For other sources: Source-specific identifier

IAVM Information
~~~~~~~~~~~~~~~
For ACAS findings only:
* IAVM Number format: YYYY-X-NNNN
* IAV Comply By Date required if IAVM number present
* Links to VRAM for detailed IAV information

Severity and Risk
---------------

Raw Severity
~~~~~~~~~~~
Initial severity before mitigations:
* CAT I - Critical
* CAT I - High
* CAT II - Medium
* CAT III - Low
* CAT III - Informational

Adjusted Severity
~~~~~~~~~~~~~~~
Modified severity after mitigations:
* Requires documentation in Mitigations field if different from Raw Severity
* Automatically updates Residual Risk and Likelihood values
* Available only to CAT-I Approvers (Level 3+)

Impact Assessment
---------------

Local Impact
~~~~~~~~~~~
Assessed impact to the local environment:
* Very Low
* Low
* Moderate
* High
* Very High

Impact Description
~~~~~~~~~~~~~~~~
Required if Local Impact is Moderate or higher:
* Detailed description of the specific impact
* Maximum 2000 characters

Residual Risk & Likelihood
~~~~~~~~~~~~~~~~~~~~~~~~~
Automatically calculated based on Adjusted Severity (or Raw Severity if no adjustment):
* System maps severity categories to risk levels
* Cannot be manually modified

Timeline Management
-----------------

Scheduled Completion Date
~~~~~~~~~~~~~~~~~~~~~~~
Automatically calculated based on severity:
* CAT I: 30 days
* CAT II: 180 days
* CAT III: 365 days

Can be modified within constraints:
* Cannot exceed original date without approved extension
* Must be justified through milestones

Predisposing Conditions
---------------------
Documents conditions that affect vulnerability likelihood:
* Organizational factors
* Mission/business process impacts
* Architecture considerations
* Environmental factors

Required Resources
----------------
Documents estimated resources needed:
* Funding requirements
* Personnel (FTE) needs
* Equipment or software needs
* Maximum 10000 characters

Milestones
---------
Required for POAM submission:
* Minimum one milestone
* Minimum 15 characters in milestone comments
* Must include:
    - Milestone comments
    - Due date
    - Status (Pending/Complete)
    - Responsible team

Validation:
* Milestone dates cannot exceed POAM completion date
* Extensions require separate approval process

Associated Vulnerabilities
------------------------
For CAT-I Approvers only:
* Link related vulnerability IDs
* Document relationships between findings
* Track grouped remediation efforts

Labels
------
Optional categorization:
* Apply existing labels
* Group related POAMs
* Enable filtered searching

Attachments
----------
Supporting documentation:
* Evidence files
* Configuration details
* Remediation plans

Access Control
============= 
Features available based on user level:

Level 1 (Viewer)
* View POAM details
* Download attachments

Level 2 (Editor)
* Create/edit POAMs
* Manage milestones
* Upload attachments

Level 3 (Approver)
* Approve/reject POAMs
* Modify adjusted severity
* Review extensions

Level 4 (CAT-I Approver)
* Manage associated vulnerabilities
* Delete POAMs
* Full system access

