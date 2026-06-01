
.. _poamexporting:

POAM Exporting
--------------

C-PAT contains the ability to export into the standard eMASS excel format. Listed below are the applicable field mappings for STIG Manager and Tenable (ACAS) type POAMs.

.. note::
   Draft POAMs are not exported.

Field Mappings
^^^^^^^^^^^^^^^

.. list-table:: POAM Field Mappings
   :widths: 10 20 70
   :header-rows: 1

   * - Column
     - eMASS Column Title
     - C-PAT Mapped Field
   * - C
     - Control Vulnerability Description
     - Description
   * - D
     - Controls / APs
     - Controls / APs (Handeled behind the scenes)
   * - E
     - Security Checks
     - Source Identifying Control Vulnerability - ID #
   * - F
     - POA&M Status
     - Special formatting rules (See below for Special formatting rules)
   * - G
     - POA&M Scheduled Completion Date
     - Scheduled Completion Date
   * - H
     - POA&M Requested Risk Accepted Expiration Date
     - Left blank
   * - I
     - POA&M Completion Date
     - Closed Date
   * - J
     - Milestone ID
     - Milestone number (Handeled behind the scenes)
   * - K
     - Milestone Description
     - Milestone Comments
   * - L
     - Milestone Status
     - Milestone Status
   * - M
     - Milestone Status Comments
     - Left blank
   * - N
     - Milestone Scheduled Completion Date
     - Milestone Date
   * - O
     - Milestone Completion Date
     - Milestone Date when the milestone status is "Completed", otherwise blank
   * - P
     - Identification Source
     - Source Identifying Vulnerability (See below for Special formatting rules)
   * - Q
     - Identification Source Details
     - Left blank
   * - R
     - Office/Org
     - Exporting user's Office/Org, Full Name, Email.
   * - S
     - Resources Required
     - Required Resources
   * - T
     - Comments
     - Special formatting rules (See below for Special formatting rules)
   * - U
     - Raw Severity
     - Raw Severity (See below for mapping)
   * - V
     - Devices Affected
     - Affected assets list
   * - W
     - Mitigations (in-house and in conjunction with the Navy CSSP)
     - Mitigations
   * - X
     - Predisposing Conditions
     - Predisposing Conditions
   * - Y
     - Severity
     - Raw Severity (See below for mapping)
   * - Z
     - Relevance of Threat
     - Default value, see below.
   * - AA
     - Threat Description
     - Default value, see below.
   * - AB
     - Likelihood
     - Likelihood
   * - AC
     - Impact
     - Default value, see below.
   * - AD
     - Impact Description
     - Impact Description
   * - AE
     - Residual Risk Level
     - Residual Risk
   * - AF
     - Recommendations
     - Default value, see below.
   * - AG
     - Resulting Residual Risk after Proposed Mitigations
     - Adjusted Severity (See below for mapping)

.. note::
   When a POAM has multiple milestones, a separate row is exported for each
   milestone, with the POAM-level columns repeated on every row.

Default Values
^^^^^^^^^^^^^^^

The following default values are always applied:

.. code-block:: none

   Column Z (Relevance of Threat): "High"
   Column AA (Threat Description): "ADVERSARIAL - HIGH: Per table D-2 Taxonomy of Threat Sources lists ADVERSARIAL as individual (outsider, insider, trusted insider, privileged insider), therefore the Relevance of Threat defaults to HIGH."
   Column AC (Impact): "High"
   Column AF (Recommendations): "After reviewing documentation, and interviewing system stakeholders, it has been determined that this vulnerability should be mitigated. The ISSO will continue to monitor this vulnerability, and update the POAM as necessary. See mitigations field for detailed mitigation information."

When no CCI is provided, the following defaults are applied:

.. code-block:: none

   Column D (Controls / APs): "CM-6.5"
   Column T (Comments): "CCI-000366 Control mapping is unavailable for this vulnerability so it is being mapped to CM-6.5 CCI-000366 by default."

.. note::
   The default CCI logic for exports is seperate from the CCI logic used throughout C-PAT. i.e. In STIG Manager, a query is made to ``/collections/{collectionId}/findings?aggregator=groupId&acceptedOnly=false&benchmarkId={benchmarkId}&projection=assets&projection=ccis`` and the CCI and AP Acronyms are pulled from the CCI projection. For Tenable, a query is made to ``plugin/{pluginId}``; if the plugin has a Patch Publication Date, the CCI is mapped to SI-2.9 / CCI-002605. If the plugin does not have a Patch Publication Date, the CCI is mapped to CM-6.5 / CCI-000366.
   Only in the event that the CCI is not found, the default Controls / APs and Comments are applied.

Severity Mapping
^^^^^^^^^^^^^^^^

.. list-table:: Severity Value Mappings
   :header-rows: 1
   :widths: 50 50

   * - Input Severity
     - Mapped Value
   * - CAT III - Info
     - Very Low
   * - CAT III - Low
     - Low
   * - CAT II - Medium
     - Moderate
   * - CAT I - High
     - High
   * - CAT I - Critical
     - Very High

Milestone Formatting
^^^^^^^^^^^^^^^^^^^^
Each milestone is exported on its own row, with milestone data spread across
the dedicated milestone columns:

.. list-table:: Milestone Columns
   :header-rows: 1
   :widths: 10 30 60

   * - Column
     - eMASS Column Title
     - C-PAT Mapped Field
   * - J
     - Milestone ID
     - Milestone number (1, 2, 3, ...)
   * - K
     - Milestone Description
     - Milestone Comments
   * - L
     - Milestone Status
     - Milestone Status
   * - M
     - Milestone Status Comments
     - Left blank
   * - N
     - Milestone Scheduled Completion Date
     - Milestone Date (MM/dd/yyyy)
   * - O
     - Milestone Completion Date
     - Milestone Date (MM/dd/yyyy) when the milestone status is "Completed", otherwise blank

.. note::

   A POAM with no milestones is exported as a single row with the milestone
   columns left blank.

Special Handling
^^^^^^^^^^^^^^^^

Identification Source (Column P)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* **STIG**: Formatted as {STIG TITLE} :: {Revision} Benchmark Date: {Last Revision Date}
* **ACAS**: Plugin Name

Status Mapping (Column F)
~~~~~~~~~~~~~~~~~~~~~~~~~~
* **Closed**: Mapped to "Completed"
* **False-Positive**: Mapped to "Not Applicable"
* **Others** (Expired, Submitted, Pending CAT-I Approval, Extension Requested, Approved, Rejected): Mapped to "Ongoing"

Comments Mapping (Column T)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
By default, comments are mapped to contain the following format:

.. code-block:: none

   CCI-{CCI #}
   (AS APPLICABLE) "Control mapping is unavailable for this vulnerability so it is being mapped to CM-6.5 CCI-000366 by default."
   "Local Site Impact: {Local Site Impact}"