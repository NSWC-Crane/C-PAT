
.. _poamcreation:

POAM Creation
-------------

Manual POAM Entry
^^^^^^^^^^^^^^^^^^
While not recommended, POAMs can be created manually:

   1. All fields must be entered by the user
   2. Assets must be selected manually from the collection's asset list
   3. Requires more validation and verification

STIG Manager Integration
^^^^^^^^^^^^^^^^^^^^^^^^
When creating a POAM from STIG Manager findings:

1. C-PAT automatically populates:

   * Description from STIG check
   * Vulnerability Source (set to "STIG")
   * STIG Title and Benchmark ID
   * Vulnerability ID
   * Raw Severity / Adjusted Severity mapped from STIG finding
   * Scheduled completion date (calculated based on severity)

2. Asset Management:

   * The Assets tab displays a live feed of affected assets from STIG Manager
   * Assets are automatically updated based on the current state in STIG Manager
   * Assets cannot be manually added/removed as they are managed by STIG Manager

Tenable Integration
^^^^^^^^^^^^^^^^^^^^
When creating a POAM from Tenable findings:

1. C-PAT automatically populates:

   * Description
   * Vulnerability Source (set to "ACAS")
   * Plugin ID
   * Raw Severity / Adjusted Severity (mapped from Tenable severity)
   * IAVM information (when applicable)
   * Scheduled completion date (calculated based on severity)

2. Asset Management:

   * The Assets tab shows real-time affected assets from Tenable
   * Asset list updates automatically based on current Tenable data
   * Assets cannot be manually modified as they reflect live Tenable data


Field Definitions
^^^^^^^^^^^^^^^^^^

POAM Status
   * Draft - Initial state
   * Submitted
   * Pending CAT-I Approval
   * Extension Requested
   * Approved
   * Rejected
   * Closed
   * False-Positive
   * Expired

Description
   * Control Vulnerability Description: Describes the vulnerability identified during assessment. This is pulled directly from the assessment procedure entry or technical assessment method (e.g., STIG test case) where applicable. Otherwise it must be manually entered in the NC status for the vulnerability.

Source Identifying Control Vulnerability
   * Identifies the source of the vulnerability (e.g., program review, test and evaluation program findings, IG DoD audit, and GAO audit).

Vulnerability ID
   * Security Checks - NIST -53Rev 4 Assessment Procedure, STIG / SRG Vulnerability ID, or ACAS Plugin ID (Do not leave this field blank).

Raw Severity
   * The initial or starting severity of the vulnerability prior to implementing mitigations and/or compensating Controls.

Adjusted Severity
   * Resulting Residual Risk after Proposed Mitigations: The risk level expected after any proposed mitigations are implemented. Proposed mitigations should be appropriately documented as POA&M milestones

Impact Description
   * Describe the identified impact.

Predisposing Conditions
   * A condition existing within an organization, a mission or business process, enterprise architecture, information system, or environment of operation, which affects (i.e., increases or decreases) the likelihood that threat events, once initiated, result in adverse impacts.

Scheduled Completion Date
   * Target completion date for resolving the vulnerability. This target completion date can stretch beyond the potential 3-year authorization window and must accurately reflect the resolution timetable. Please note that the initial date entered may not be changed. When a vulnerability severity value is resolved, the agency should note the actual completion date.

.. note::
   POAM Scheduled Completion Date is automated based on the severity of the vulnerability. CAT I - Critical and CAT I - High: 30 days, CAT II - Medium: 180 days, CAT III - Low and CAT III - Informational: 365 days.

Required Resources
   * Estimated funding or manpower resources required to resolve the security vulnerability (i.e., full-time equivalent).

Milestones
   * A milestone identifies specific requirements for correcting an identified vulnerability. The initial milestones and completion dates may not be altered. Any changes to the milestones should be noted in the Milestone Changes within the POAM extension panel.

Residual Risk
   * Residual Risk is automatically determined by the Adjusted Severity Value. If the Adjusted Severity Value is not present, the Residual Risk is determined by the Raw Severity.

.. note::
   Residual Risk is calculated based on the Adjusted Severity Value. If the Adjusted Severity Value is not present, the Residual Risk is determined by the Raw Severity.

Likelihood
   * Likelihood is automatically determined by the Adjusted Severity Value. If the Adjusted Severity Value is not present, the Likelihood is determined by the Raw Severity.

.. note::
   Likelihood is calculated based on the Adjusted Severity Value. If the Adjusted Severity Value is not present, the Likelihood is determined by the Raw Severity.

Mitigations
   * Any currently implemented mitigations and/or compensating Controls that will reduce the risk. A planned mitigation or compensating Control cannot lower risk until implemented.

POAM Labels
   * POAM Labels introduce a way to visualize data across various charts and tables within C-PAT. Labels can be used to quickly identify, filter, or visualize a unique subset of POAMs.

.. note::
   Any POAM containing a ``CORA STIG KIOR`` ``CORA STIG KIORS`` ``CORA KIOR`` ``CORA KIORS`` ``STIG KIOR`` or ``STIG KIORS`` [case insensitive] label will be included in the STIG Manager Metrics Component KIOR Count under 'Open Findings by STIG (Raw)'.


POAM Submission Requirements
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Before a POAM can be submitted for review, C-PAT validates that the POAM is complete. If any requirement is not met, submission is blocked and the specific reason is displayed. All milestone edits must be saved before submission is allowed.

General requirements (all POAMs)

The following fields are required for every submission:

   * Description
   * POAM Status
   * A&A Package
   * Vulnerability Source
   * Plugin ID / Vulnerability ID
   * Raw Severity
   * POAM Submitter
   * Scheduled Completion Date
   * Predisposing Conditions
   * Mitigations
   * Local Impact

The following conditional requirements also apply:

   * **IAV Comply By Date** is required when an IAVM Number is provided.
   * **Impact Description** becomes required when Local Impact is ``Moderate``, ``High``, or ``Very High``.

.. note::
   Mitigations are always required for submission. They are provided per team for team-based POAMs (every active team must have mitigations) or as Global Mitigations for Global Findings - see the type-specific requirements below.

Global Finding mode

When a POAM is flagged as a Global Finding, the following are required:

   * Global Mitigations
   * Global Required Resources
   * A minimum of one active milestone (a milestone whose status is not ``Completed`` or ``Archived``).

Team-based (non-Global) POAMs

When a POAM has one or more teams assigned, the following are required:

   * Every active team must have mitigations.
   * Every active team must have required resources.
   * Every active team must have at least one milestone (where status is not ``Completed`` or ``Archived``) that includes milestone comments.

Milestone requirements

Every milestone on the POAM must be fully completed before submission:

   * Milestone Comments
   * Milestone Due Date
   * Milestone Status
   * At least one assigned Milestone Team

.. note::
   A milestone with an active status (not ``Completed`` or ``Archived``) cannot have a due date in the past. Either update the milestone status or move the due date to a future date.

.. note::
   A milestone due date may not exceed the POAM Scheduled Completion Date. If the POAM has an approved extension, the milestone due date may not exceed the extended deadline.


POAM Extension Requirements
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
An extension request documents why additional time is needed and updates the mitigation and milestone information accordingly. As with submission, all milestone edits must be saved before an extension request can be submitted, and any unmet requirement blocks the request with a specific message.

Required for every extension request

   * **Extension Time Requested** - the number of additional days requested.
   * **Justification for Extension** - select a provided justification, modify one, or enter a custom justification.

Mitigation requirements

   * **Global Finding mode:** Mitigations are required.
   * **Team-based POAMs:** every active team must have mitigation text. The request is blocked until each assigned team's mitigation is provided, and the message identifies any team(s) still missing one.
   * **POAMs with no assigned teams:** Mitigations are required.

Milestone requirements

When extension days are requested, the following milestone rules are enforced:

   * Any milestone that has a milestone change date must also have milestone change comments.
   * All past-due milestones must have a milestone change date and change comments.
   * At least one milestone must have both change comments and a change date.
   * Each assigned team must have at least one milestone that is **not** in a ``Completed`` status. The request is blocked until each team has an open milestone justifying the extension, and the message identifies any team(s) that do not.

.. note::
   Initial milestones and their completion dates may not be altered. Document any changes to a milestone using the Milestone Change Date and Milestone Change Comments fields within the POAM extension panel.