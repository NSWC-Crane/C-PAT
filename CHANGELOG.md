## What's Changed

### New Features
* feat: Add Tenable VPH metric and date range metric filters (b83ce75)
* feat:refactor: Change risk calculation to VPH, toggle lastSeen filters on demand (967b51a)
* feat: Add total count of STIGs to metrics component (c888573)
* feat: Add assessment status to metrics export (d75d9e3)
* feat: Add collection origin to metrics export (dd44de5)
* feat: Add assessed percentage to Open Findings by STIG (cdadc37)
* feat: Tenable filter session state to revert filters when canceling POAM (d1d328f)

### Bug Fixes
* fix: Parse references using 'xref' instead of 'xrefs' (25f8699)
* fix: Extension -> Milestone row edit state (0416e96)
* fix: Plugin details: Correct 'Vulnerability Publication Date' (88c7638)
* fix: flex-shrink -> shrink (c512c66)

### Other Changes
* chore: update dependencies (5618579)
* style: Change dialog max-height to 85vh instead of 90vh (02e3fa4)
* style: Add max height to collection selection menu (2d8559d)
* style: Adjust metrics component risk color and percentage indicator (42d1225)
* chore(deps): bump validator from 13.15.15 to 13.15.20 (74e44bb)
* perf: Tenable metrics on-demand load filter datasets (a13777b)
* chore(deps): bump validator (3d3063a)
* style: Adjust STIG Manager metric card grid scaling (46e8450)
* chore: Increase risk bar legend item and divider margin (878612b)
* chore: Remove unused category var and update metrics titles (93df6e2)
* style: Increase POAM compliance metric size (2e24881)
* style: Add "CORA Risk" header to STIG Manager metrics (24b3d28)
* style: Add "Cora Risk" descriptor to tooltip (9adbf32)
* style: Remove mitigation generation button outline (1a59cfb)
* style: Add percent symbol to overall POAM Compliance (f54cbba)
* style: Add percent symbol to POAM Compliance metric (8fb032d)
* style: update column scrolling and word-break (7cd964f)
* perf: SonarQube improvements (21b90be)
* style: Update Tenable revert button to left arrow (d1bddc2)
