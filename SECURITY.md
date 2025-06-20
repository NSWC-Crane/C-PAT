# Security Policy

The C-PAT Team makes every effort to produce secure software. The project addresses vulnerabilities in the application with every new releases, however, old versions will not be patched. All users are expected to stay up to date with security and feature updates by running the latest release available. 

| Version | Supported          |
| ------- | ------------------ |
| Current   | :white_check_mark: |
| All previous   | :x:                |


## Reporting a Vulnerability

Vulnerability scans are run regularly against project components and any issues identified are addressed. Nevertheless, we are grateful to anyone reporting a vulnerability and helping us to make C-PAT better and more secure. Additionally, we encourage everyone to disclose bugs in a responsible way, allowing us and other C-PAT users to react accordingly and in a timely manner. That means:

- If you want to report a security vulnerability, please send a bug report to christian.a.rodriguez@mantech.com before publishing it. We aim to acknowledge your email within 48 hours and will subsequently send a more detailed response indicating the next steps in handling your report. After the initial reply to your report, the security team will endeavor to keep you informed of the progress towards a fix and an announcement. We may ask for additional information or guidance. When disclosing vulnerabilities please include the following:
    - The word "SECURITY" in the subject line.
    - Your name and affiliation (if any).
    - Scope of vulnerability. Let us know who could use this exploit.
    - Documented steps to identify the vulnerability. It is important that we can reproduce your findings.


- If you want to report a non-critical bug, please open an issue on the GitHub project. If you are using a scanning tool to identify a vulnerability, please attempt to determine whether or not the issue is a false positive before reporting, and if it is not, include the specific scanner, settings, and config you used to identify it.

- Report security bugs in third-party modules to the person or team maintaining the module.

- This is an open source project and we highly encourage contributions from the community! If you have the time and ability, consider submitting a pull request to address this issue. Here's how you can get started:

    1. Fork the repository.
    2. Create a new branch (`git checkout -b feature/YourFeatureName`).
    3. Make your changes.
    4. Commit your changes (`git commit -m 'Add some feature'`).
    5. Push to the branch (`git push origin feature/YourFeatureName`).
    6. Open a pull request.

- Known vulnerabilities will be published on the [Security Advisories page of the project's GitHub site.](https://github.com/NSWC-Crane/C-PAT/security/advisories)


## Securing C-PAT

C-PAT is one component of a system that must be deployed according to your individual or organizational security requirements. 

Please see the [project documentation](https://c-pat.readthedocs.io/en/main/source/install/securing.html) for more information on this topic.