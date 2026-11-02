
.. _nessus:

Nessus Professional
-------------------

A collection of type ``Nessus`` uses the same pages as a Tenable collection: the **Nessus** menu entry opens the Vulnerabilities, 30+ Days, Exploitable, Failed Credential, SEoL, IAV Vulnerabilities, Task Orders, and Solutions tabs described in :ref:`tenable`, the Assets page shows the scan's hosts, Metrics and Global Metrics include the collection, and a POAM can be created from any finding. The differences come from the data source: a Nessus Professional scanner holds individual scans rather than a cumulative repository.

What a Nessus collection points at
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Each Nessus collection is associated with one scan on the scanner. C-PAT reads the most recent completed run of that scan and exposes its hosts and findings. Re-running the scan in Nessus makes the new results visible the next time C-PAT loads the scan, at most ``NESSUS_CACHE_TTL`` seconds later (15 minutes by default). Administrators choose the scan when they add or bulk import the collection; see :ref:`admin-portal`.

How the data differs from Tenable.sc
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

- **Last Seen** is the end time of the latest completed scan run, so every finding in the collection shares the same Last Seen value. The default ``Within the last 30 days`` filter on the Vulnerabilities tab therefore shows nothing when the scan has not run in the last 30 days; widen the Last Seen filter or re-run the scan.
- **First Seen** is tracked by C-PAT. Each time a new run of the scan is loaded, C-PAT records when every host and plugin pair was first observed, so First Seen becomes meaningful after the second run.
- **Plugin dates** (plugin published, patch published, vulnerability published, SEoL date) come from the plugin itself and behave exactly as they do for Tenable, so the 30+ Days, Exploitable, and SEoL tabs work from the first run.
- **ACR, AES, and asset lists** do not exist in Nessus Professional. Those columns are empty and the related filters are hidden from the filter panel, as are audit file, scan policy, responsible user, accept/recast risk, and web application scanning filters.
- **Solutions** are derived by grouping the scan's findings on the plugin solution text. Risk reduction percentages are computed from the severity weights Tenable uses for host scores.
- **Hosts** on the Assets page report whether the scan was credentialed in the Source column (``nessus-credentialed`` or ``nessus``).

Any filter that cannot be applied to Nessus data is reported in the response and ignored rather than failing the query.

Filters that work the same way
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Plugin ID, plugin name, plugin text, family, severity, exploit available, IP address (single, list, CIDR, or range), DNS name, NetBIOS name, port, protocol, CVE, IAV, Microsoft bulletin, CPE, operating system, STIG severity, plugin type, exploit frameworks, CVSS vectors and base scores, VPR, EPSS, every date filter, and saved filters all behave as they do for a Tenable collection.
