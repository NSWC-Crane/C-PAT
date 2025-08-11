## What's Changed

### New Features
* feat: Include associated vulnerabilities in POAM export (a3c6693)
* feat: Assigned grid, sort by POAM status groups (6fe47d7)
* feat: Prompt to select POAM statuses prior to exporting (2cb445d)
* feat: expand assigned POAM grid to full page width (bab0672)
* feat: Overwrite [modify] existing Tenable custom filters (5d3aa01)
* feat: Remove Global Mitigation Tab if GM is not toggled (8bbbb4b)
* feat: STIG Manager Reviews -> benchmark Multi-Select (1449268)
* feat: Add Vulnerabilities Published 30+ day to the tabbed Tenable view (cf8af05)
* feat: 'Associated' POAM icon to display status color of parent POAM (55f592e)
* feat: Add sorting of calculated STIG benchmark metric data (272bf37)
* feat: ASD STIG Auto logoffs (136f947)
* feat: Add Severity to Associated Vuln view (a07c659)
* feat: Always allow CAT-I Approvers to modify SCD (53ab322)

### Bug Fixes
* fix: handle promise rejections in Excel file generation (6438d03)
* fix: update Approver Comments column title (8590222)
* fix: POAM grid assigned team filter (3bf50c8)

### Other Changes
* chore: Update dependencies (1cfa09c)
* chore: testing addition and updates (6efef49)
* chore(deps): bump tmp (933b350)
* chore: update poam approver spec messageService provider (5c3b273)
* perf: update main providers array and remove from components (1cf9b9e)
* perf: Remove unused card import (8fd2aa8)
* style: Assigned team table cell max height (66d4d79)
* perf: convert user and isAdmin determination to payload service observable (62e0154)
* chore(deps-dev): bump @eslint/plugin-kit (16a57dd)
