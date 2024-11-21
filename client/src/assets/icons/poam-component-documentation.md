########################################
POAM Component Documentation
########################################

Technical Overview
=================

Purpose
-------
The POAM (Plan of Action & Milestones) component is a comprehensive interface for managing security vulnerability tracking and remediation planning. It provides capabilities for creating, editing, and managing POAMs through both manual entry and automated integration with security tools.

Architecture
-----------
The component is built using Angular and implements the following key architectural patterns:

* **Component Pattern**: Uses ``@Component`` decorator with separate template and styling files
* **Reactive Forms**: Implements form handling with validation and state management
* **Service Integration**: Integrates with multiple services for data management
* **Stepper Interface**: Organizes content into logical sections using PrimeNG Stepper

Key Dependencies
--------------
* **Angular Core Components**: ``ChangeDetectorRef``, ``Component``, ``OnDestroy``, ``OnInit``, ``ViewChild``
* **Angular Router**: For navigation and route parameter handling
* **PrimeNG Components**: 
    - ``Table``
    - ``Menu``
    - ``Calendar``
    - ``Dropdown``
    - ``Stepper``
    - ``Dialog``
    - ``ConfirmDialog``
* **Date Handling**: ``date-fns`` library for date manipulation
* **RxJS**: For reactive programming patterns

POAM Creation Methods
====================

Manual POAM Entry
----------------
.. note:: Manual entry is not the recommended approach. Use automated integration when possible.

Workflow:
1. Navigate to POAM creation interface
2. Select "ADDPOAM" mode
3. Complete required fields:
   - Description
   - A&A Package
   - Vulnerability Source
   - Raw Severity
   - Scheduled Completion Date

STIG Manager Integration
-----------------------
The preferred method for STIG-related vulnerabilities.

**Automation Process**:
1. Integration automatically populates:
   - Vulnerability Source (set to "STIG")
   - STIG Title
   - Vulnerability ID
   - Description
   - Raw Severity
   - Scheduled Completion Date (calculated based on severity)

**Field Automation**:
.. code-block:: typescript

   createNewSTIGManagerPoam() {
     // Auto-population logic
     this.poam = {
       vulnerabilitySource: 'STIG',
       description: this.stateData.description,
       rawSeverity: this.stateData.severity,
       // ... other fields
     };
   }

Tenable Integration
------------------
Recommended for ACAS scanner findings.

**Automation Process**:
1. Pulls vulnerability data from Tenable
2. Auto-populates:
   - Plugin ID
   - Vulnerability Description
   - IAVM Information (if available)
   - Raw Severity (mapped from Tenable severity)

**Field Mapping**:
.. code-block:: typescript

   mapTenableSeverity(severity: string) {
     switch (severity) {
       case '4': return 'CAT I - Critical';
       case '3': return 'CAT I - High';
       // ... other mappings
     }
   }

Field Documentation
=================

Core Fields
----------

Description
~~~~~~~~~~
* **Purpose**: Describes the identified vulnerability
* **Source**: Assessment procedure or technical finding
* **Validation**: Required field, max 10000 characters
* **Automation**: Auto-populated from STIG/Tenable when available

Status
~~~~~~
* **Options**:
    - Draft (default)
    - Submitted
    - Pending CAT-I Approval
    - Approved
    - Rejected
    - Closed
    - Expired
* **Access Control**: Requires Level 2 access to modify

Severity Ratings
--------------

Raw Severity
~~~~~~~~~~
* **Purpose**: Initial vulnerability severity
* **Options**:
    - CAT I - Critical
    - CAT I - High
    - CAT II - Medium
    - CAT III - Low
    - CAT III - Informational
* **Automation**: Mapped from source system ratings

Adjusted Severity
~~~~~~~~~~~~~~~
* **Purpose**: Modified severity after mitigations
* **Validation**: Requires mitigation documentation if different from raw severity
* **Access**: Requires Level 3 access to modify

Dates and Timelines
-----------------

Scheduled Completion Date
~~~~~~~~~~~~~~~~~~~~~~~
* **Required**: Yes
* **Calculation**: Based on severity level
    - CAT I: 30 days
    - CAT II: 180 days
    - CAT III: 365 days
* **Validation**: Cannot be empty

IAV Comply By Date
~~~~~~~~~~~~~~~~
* **Required**: Only if IAVM number is provided
* **Format**: YYYY-MM-DD
* **Validation**: Must be valid date

Teams and Approvers
-----------------

Assigned Teams
~~~~~~~~~~~~
* **Management**: Add/remove via team selection
* **Validation**: At least one team required
* **Access**: Level 2 required for modification

Approvers
~~~~~~~~
* **Default**: Auto-populated with collection approvers
* **Status Options**: 
    - Not Reviewed
    - Approved
    - Rejected
* **Access**: Level 3 required for approval actions

Milestones
---------
* **Required**: Minimum 1 milestone before submission
* **Fields**:
    - Milestone Comments (min 15 characters)
    - Due Date
    - Status (Pending/Complete)
    - Team Assignment
* **Validation**: Due dates must not exceed completion date

.. warning::
   Milestone dates cannot exceed the scheduled completion date unless an extension has been approved.

Access Control Levels
===================

The component implements five access levels:

1. **Level 1**: View only
2. **Level 2**: Basic editing, milestone management
3. **Level 3**: Approval capabilities
4. **Level 4**: Full control including deletion
5. **Level 5**: System administration

Each level inherits permissions from lower levels.
