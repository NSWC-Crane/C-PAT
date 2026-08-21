
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
   * Submitted - Set when the POAM is submitted for review. The POAM's approvers who hold Approver access or higher on the collection are notified. A POAM in ``Extension Requested`` status also returns to this status when its pending extension request is deleted.
   * Pending CAT-I Approval - Set when an Approver marks a CAT I POAM as approved; the POAM remains in this status until a CAT I Approver issues final approval.
   * Extension Requested - Set when an extension request is submitted from the POAM extension panel (see :ref:`poam-extensions`).
   * Approved - Set when final approval is issued, either by approving the POAM directly or by approving its extension request.
   * Rejected - Set when a POAM or its extension request is rejected. Rejecting an extension request also clears the requested extension days and the extension deadline.
   * Closed
   * False-Positive
   * Expired - Set automatically by a scheduled database task once the scheduled completion date (or the extension deadline, when one exists) has passed.

.. note::
   The statuses a user can apply to a POAM depend on the user's effective access level for the collection - see :ref:`collection-privileges`.

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
   * Target completion date for resolving the vulnerability. This target completion date can stretch beyond the potential 3-year authorization window and must accurately reflect the resolution timetable. When a vulnerability severity value is resolved, the agency should note the actual completion date.

.. note::
   POAM Scheduled Completion Date is automated based on the severity of the vulnerability. CAT I - Critical and CAT I - High: 30 days, CAT II - Medium: 180 days, CAT III - Low and CAT III - Informational: 365 days. The date can be manually adjusted by the user as needed to align with organizational policy.

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


.. _poam-extensions:

POAM Extension Requirements
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
An extension request documents why additional time is needed and updates the mitigation and milestone information accordingly. As with submission, all milestone edits must be saved before an extension request can be submitted, and any unmet requirement blocks the request with a specific message.

The extension panel is opened with the **Extend** button on the POAM details page, which is available while the POAM status is ``Approved``, ``Expired``, or ``Extension Requested``.

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
   * A milestone change date cannot be set to a date in the past.
   * All past-due milestones must have a milestone change date and change comments.
   * At least one milestone must have both change comments and a change date.
   * Each assigned team must have at least one milestone that is **not** in a ``Completed`` status. The request is blocked until each team has an open milestone justifying the extension, and the message identifies any team(s) that do not.

.. note::
   Initial milestones and their completion dates may not be altered. Document any changes to a milestone using the Milestone Change Date and Milestone Change Comments fields within the POAM extension panel.

Saving an extension request

What saving does is controlled by the **Restart extension period from today?** checkbox:

   * **Checked:** saving submits a new extension request. The extension deadline is set to today's date plus the Extension Time Requested, the POAM status changes to ``Extension Requested``, and the POAM's approvers who hold Approver access or higher on the collection are notified for review.
   * **Unchecked:** saving updates the extension details only - the justification, mitigations, milestone changes, and risk information are saved, but the POAM status and the existing extension deadline are unchanged.

For a POAM with no existing extension, the checkbox is checked automatically, so the first save always submits a request. Once an extension exists, the Extension Time Requested value can only be changed while the checkbox is checked, because restarting the extension period is what re-anchors the deadline. If the current extension deadline has already passed, the panel prompts to check the box to request a new extension period.

Approving or rejecting an extension

Users with Approver access or higher can act on a pending extension request directly from the extension panel:

   * **Approve** sets the POAM status to ``Approved``. Extension requests for CAT I POAMs (Raw Severity of ``CAT I - Critical`` or ``CAT I - High``) can only be approved by a CAT I Approver.
   * **Reject** sets the POAM status to ``Rejected`` and clears the requested extension days and the extension deadline. The dropdown next to the Reject button opens the approval page to reject with comments instead.

Deleting an extension

The **Delete Extension** button clears the requested extension days, the extension deadline, and the extension justification. If the POAM status was ``Extension Requested``, the POAM returns to ``Submitted`` and its approvers are notified. In either case, with the extension deadline removed the POAM re-enters normal expiry processing, so a POAM whose scheduled completion date has already passed may be marked ``Expired``.