
.. _tenable:

Tenable
-------

The Tenable component is a comprehensive compilation of tools that provides a large majority of functionality contained in Tenable.sc in addition to numerous expanded capabilities. The tenable component is comprised of the Main Vulnerabilities, IAV Vulnerabilities, and Solutions components.

Main Vulnerabilities Component
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The Main Vulnerabilities Component will display a table originating from Tenable's Vulnerabilities Summary (API tool ``sumid``) with filters to exclude "Informational" severity and include only items where the vulnerability was observed within the last 30 days by default.

Default Display
""""""""""""""""
When the Vulnerability Summary view is selected, the component will display columns for the following fields:
``POAM`` ``Plugin ID`` ``Name`` ``Family`` ``Severity`` ``VPR`` ``IAV`` ``Navy Comply Date`` ``Total`` ``Host Total``

Predefined Filters
"""""""""""""""""""
To access the filter menu, a filter button is available to the top left of the table. At the top of the filter panel, a dropdown has been provided with several pre-made filters:

.. list-table:: Tenable Predefined Filters
   :widths: 30 70
   :header-rows: 1

   * - Filter Preset
     - Applied Filters
   * - Vulnerability Published 30+ Days
     - | vulnerabilityPublished = 30:all
   * - Exploitable Findings 7+ Days
     - | exploitAvailable = true
       | vulnerabilityPublished = 7:all
   * - Exploitable Findings 30+ Days
     - | exploitAvailable = true
       | vulnerabilityPublished = 30:all
   * - Critical/High 7+ Days
     - | severity = [3, 4]
       | vulnerabilityLastObserved = 0:30
       | vulnerabilityPublished = 7:all
   * - Critical/High 14+ Days
     - | severity = [3, 4]
       | vulnerabilityLastObserved = 0:30
       | vulnerabilityPublished = 14:all
   * - Critical/High 30+ Days
     - | severity = [3, 4]
       | vulnerabilityLastObserved = 0:30
       | vulnerabilityPublished = 30:all
   * - Medium 180+ Days
     - | severity = [2]
       | vulnerabilityLastObserved = 0:30
       | vulnerabilityPublished = 180:all
   * - Low 365+ Days
     - | severity = [1]
       | vulnerabilityLastObserved = 0:30
       | vulnerabilityPublished = 365:all
   * - Cisco Findings 30+ Days
     - | pluginFamily = [33]
       | vulnerabilityLastObserved = 0:30
       | severity = [1, 2, 3, 4]
   * - Database Findings 30+ Days
     - | pluginFamily = [31]
       | vulnerabilityLastObserved = 0:30
       | severity = [1, 2, 3, 4]
   * - F5 Findings 30+ Days
     - | pluginFamily = [57]
       | vulnerabilityLastObserved = 0:30
       | severity = [1, 2, 3, 4]
   * - Linux/Ubuntu Findings 30+ Days
     - | pluginFamily = [1, 14]
       | vulnerabilityLastObserved = 0:30
       | severity = [1, 2, 3, 4]

Additional Filters
"""""""""""""""""""
Additional filters are available for the following items inside of the main filter panel:
``ACR`` ``AES`` ``AES Severity`` ``Accept Risk`` ``Address`` ``Agent ID`` ``Application CPE`` ``Assets`` ``Audit File`` ``CCE ID`` ``Cross References`` ``CVE ID`` ``CVSS v2 Score`` ``CVSS v2 Vector`` ``CVSS v3 Score`` ``CVSS v3 Vector`` ``Data Format`` ``DNS Name`` ``Exploit Available`` ``Exploit Frameworks`` ``Host ID`` ``IAVM ID`` ``MS Bulletin ID`` ``Mitigated`` ``NetBIOS Name`` ``Patch Published`` ``Plugin Family`` ``Plugin ID`` ``Plugin Modified`` ``Plugin Name`` ``Plugin Published`` ``Plugin Type`` ``Port`` ``Protocol`` ``Recast Risk`` ``STIG Severity`` ``Scan Policy Plugins`` ``Severity`` ``Users`` ``Vulnerability Discovered`` ``Vulnerability Last Observed`` ``Vulnerability Priority Rating`` ``Vulnerability Published`` ``Vulnerability Text`` ``Vulnerability Type``

Column filters are available for the following items when the Vulnerability Summary view is selected:
``POAM`` ``IAV`` ``Navy Comply Date``

.. note::
   Because of the potential for large amounts of data to be returned, Tenable server side pagination and server side filtering are used to limit the amount of data returned to the client when Vulnerability List view is selected in the main vulnerabilities component. Local filtering for POAM, IAV, and Navy Comply Date are only available when the Vulnerability Summary view is selected. All externally processed filters (filter panel items) are available in both views.

View Navigation
""""""""""""""""
To navigate between Vulnerability Summary (API Tool ``sumid``) and Vulnerability List (API Tool ``listvuln``) a user has two options:
1. A button has been provided adjacent to the filtering buttons and can be identified by the magnifying glass icon that will change the vulnerability view
2. Clicking the row of a particular vulnerability will apply a filter for the selected plugin ID and change to Vulnerability List view

View Specific Columns
""""""""""""""""""""""
Vulnerability List View adds the following additional columns:
``IP Address`` ``ACR`` ``AES`` ``NewBIOS`` ``DNS`` ``MAC Address`` ``Port`` ``Protocol`` ``Agent ID`` ``Host ID``

Vulnerability Summary View adds the following additional columns:
``Total`` ``Host Total``

IAV Vulnerabilities Component
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The IAV Vulnerabilities Component displays a table originated from Tenable's vulnerability summary with filters to only return Plugin ID's that are mapped to an IAV #, exclude "Informational" severity, and exclude items that have been superseded by other vulnerabilities.

Default Display
""""""""""""""""
When the IAV vulnerability table is initially displayed, the component will show columns for the following fields by default:
``POAM`` ``Plugin ID`` ``Name`` ``Family`` ``Severity`` ``VPR`` ``IAV`` ``Navy Comply Date`` ``Superseded By`` ``Total`` ``Host Total``

.. note::
   While similar to the main vulnerabilities view, the IAV Vulnerabilities Component loads the entire dataset and enables local column filtering rather than Tenable sever side filtering. This change allows for ``POAM`` ``IAV`` ``Navy Comply Date`` filtering in either the Vulnerability List view or the Vulnerability Summary view.

Toolbar Controls
"""""""""""""""""
To access the filter menu, several controls are available in the toolbar:
1. A global search input field for filtering across all columns
2. A filter button that provides access to a Navy Comply Date dropdown with the following pre-made filters:

   * All Overdue
   * 90+ Days Overdue
   * 30-90 Days Overdue
   * 0-30 Days Overdue
   * 0-14 Days Overdue
   * 0-7 Days Overdue
   * Due Within 7 Days
   * Due Within 14 Days
   * Due Within 30 Days
   * Due Within 90 Days

3. A clear filter button to reset to default filters
4. A view toggle button to switch between Summary and List views
5. A column selector to customize visible columns

View Options
"""""""""""""
The component provides two primary views:

Summary View
'''''''''''''
Includes ``Total`` and ``Host Total`` columns.

List View
''''''''''
Expands to show additional columns:
``IP Address`` ``ACR`` ``AES`` ``NetBIOS`` ``DNS`` ``MAC Address`` ``Port`` ``Protocol`` ``Agent ID`` ``Host ID``

Solutions Component
^^^^^^^^^^^^^^^^^^^^

The Solutions Component provides a table view of solutions from Tenable, sorted by risk reduction percentage. The component automatically applies a filter for the repository that the user is currently viewing.

Default Display
""""""""""""""""
The solutions table displays the following columns by default:

``Solution`` ``Risk Reduction`` ``Hosts Affected`` ``Vulnerabilities`` ``VPR`` ``CVSS v3 Base Score``

Toolbar Controls
"""""""""""""""""
The toolbar provides several controls:

1. A global search input field for filtering across all columns
2. A clear filter button to reset all filters
3. An export button for downloading the data as CSV

Filtering Capabilities
"""""""""""""""""""""""
Each column supports individual filtering. Available filter types include:

* Text filtering for ``Solution``
* Numeric filtering for:
   - ``Risk Reduction`` (percentage)
   - ``Hosts Affected`` (count)
   - ``Vulnerabilities`` (count)
   - ``VPR`` (score)
   - ``CVSS v3 Base Score`` (score)

Solution Details Dialog
""""""""""""""""""""""""
Clicking a solution row opens a detailed view with three main sections:

1. Solution Summary Statistics
   - Hosts Affected count
   - Total Vulnerabilities
   - VPR Score
   - CVSS v3 Base Score

2. Vulnerabilities Table
   Shows all vulnerabilities addressed by the solution with columns:
   ``Plugin ID`` ``VPR`` ``CVSS V3`` ``Host Total``

3. Affected Hosts Table
   Lists all hosts requiring the solution with columns:
   ``IP Address`` ``NetBIOS`` ``DNS`` ``OS CPE`` ``Repository``

The dialog provides separate search and filtering capabilities for both the vulnerabilities and affected hosts tables.

.. note::
   All data is automatically filtered based on the user's current repository. The solutions are sorted by default using the Risk Reduction percentage in descending order to highlight the most impactful remediation actions.