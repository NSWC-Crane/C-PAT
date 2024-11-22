
.. _poamexporting:

POAM Exporting
--------------

C-PAT contains the ability to export into the standard eMASS excel format. Listed below are the applicable field mappings for STIG and ACAS originated POAMs.

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
     - Office/Org
     - Exporting user's Office/Org, Full Name, Email.
   * - F
     - Security Checks
     - Source Identifying Control Vulnerability - ID #
   * - G
     - Resources Required
     - Required Resources
   * - H
     - Scheduled Completion Date
     - Scheduled Completion Date
   * - I
     - Milestone ID
     - "1" (Handeled behind the scenes)
   * - J
     - Milestone with Completion Dates
     - Formatted milestone data (See below for milestone formatting details)
   * - K
     - Milestone Changes
     - Formatted milestone change data (See below for milestone formatting details)
   * - L
     - Source Identifying Vulnerability 
     - Special formatting rules (See below for Special formatting rules)
   * - M
     - Status
     - Special formatting rules (See below for Special formatting rules)
   * - N
     - Comments
     - Special formatting rules (See below for Special formatting rules)
   * - O
     - Raw Severity
     - Raw Severity (See below for mapping)
   * - P
     - Devices Affected
     - Affected assets list
   * - Q
     - Mitigations (in-house and in conjunction with the Navy CSSP)
     - Mitigations
   * - R
     - Predisposing Conditions
     - Predisposing Conditions
   * - S
     - Severity
     - Raw Severity (See below for mapping)
   * - T
     - Relevance of Threat
     - Default value, see below.
   * - U
     - Threat Description
     - Default value, see below.
   * - V
     - Likelihood
     - Likelihood
   * - W
     - Impact
     - Default value, see below.
   * - X
     - Impact Description
     - Impact Description
   * - Y
     - Residual Risk Level
     - Residual Risk
   * - Z
     - Recommendations
     - Default value, see below.
   * - AA
     - Resulting Residual Risk after Proposed Mitigations
     - Adjusted Severity (See below for mapping)

Default Values
^^^^^^^^^^^^^^^

The following default values are always applied:

.. code-block:: none

   Column T (Relevance of Threat): "High"
   Column U (Threat Description): "ADVERSARIAL - HIGH: Per table D-2 Taxonomy of Threat Sources lists ADVERSARIAL as individual (outsider, insider, trusted insider, privileged insider), therefore the Relevance of Threat defaults to HIGH."
   Column W (Impact): "High"
   Column Z (Recommendations): "After reviewing documentation, and interviewing system stakeholders, it has been determined that this vulnerability should be mitigated. The ISSO will continue to monitor this vulnerability, and update the POAM as necessary. See mitigations field for detailed mitigation information."

When no CCI is provided, the following defaults are applied:

.. code-block:: none

   Column D (Controls / APs): "CM-6.5"
   Column N (Comments): "CCI-000366 Control mapping is unavailable for this vulnerability so it is being mapped to CM-6.5 CCI-000366 by default."

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
Milestones are formatted in two distinct sections:

Comments (Column J)
~~~~~~~~~~~~~~~~~~~~

.. code-block:: none

   Milestone {Milestone #}
   {Milestone Comments}
   Milestone Status: {Milestone Status}
   Milestone Date: {Milestone Due Date (MM/dd/yyyy)}

Changes (Column K)
~~~~~~~~~~~~~~~~~~~

.. code-block:: none

   Milestone {Milestone #} Changes:
   {Milestone Change Comments}
   Milestone Status: {Milestone Status}
   Milestone Date Change: {Milestone Due Date (MM/dd/yyyy)}

.. note::

   Column I contains "1" if comments exist, otherwise the column remains empty.

Special Handling
^^^^^^^^^^^^^^^^

Vulnerability Source (Column L)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
* **STIG**: Formatted as {STIG TITLE} :: {Revision} Benchmark Date: {Last Revision Date}
* **ACAS**: Plugin Name

Status Mapping (Column M)
~~~~~~~~~~~~~~~~~~~~~~~~~~
* **Closed**: Mapped to "Completed"
* **Others**: Mapped to "Ongoing"

Comments Mapping (Column N)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
By default, comments are mapped to contain the following format:

.. code-block:: none

   CCI-{CCI #}
   (AS APPLICABLE) "Control mapping is unavailable for this vulnerability so it is being mapped to CM-6.5 CCI-000366 by default."
   "Local Site Impact: {Local Site Impact}"