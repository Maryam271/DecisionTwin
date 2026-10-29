# Security Policy

## Scope & Purpose
This document defines the security baseline and credential handling policies for the **DecisionTwin AI Strategy Engine**.

## Credential Handling & Secret Management
1. **Never Commit Secrets**: Never commit `.env` or any file containing live API keys, bearer tokens, passwords, or cloud credentials.
2. **Environment Variable Configuration**:
   - Copy `.env.example` to `.env` locally:
     ```bash
     cp .env.example .env
     ```
   - Populate `NEBIUS_API_KEY`, `NEBIUS_ENDPOINT`, and `NEBIUS_MODEL` with real credentials only in your local `.env`.
   - `.env` and any variant (e.g. `.env.local`) are strictly excluded by `.gitignore`.
3. **Placeholder Safety**: Example configuration files (`.env.example`) must only contain clear placeholders (e.g., `YOUR_NEBIUS_API_KEY_HERE`). Never include sample production tokens.
4. **Log Sanitization**:
   - The application does not print, echo, or log the `NEBIUS_API_KEY`.
   * Error handlers and exception wrappers must avoid reflecting authorization headers or sensitive token strings.
5. **Pre-flight Checks**: Developer scripts (such as `scripts/test_nemotron.py`) and service classes validate that credentials are non-empty and non-placeholder before sending network requests, preventing unauthenticated calls or credential leakage.

## Vulnerability Reporting
If you discover a potential security vulnerability, credential leak, or insecure dependency:
1. **Do not create a public GitHub issue**.
2. Immediately contact the team lead or project repository maintainer privately.
3. If an API key is accidentally exposed in logs, commits, or chat sessions, **revoke and rotate the key immediately** in the Nebius Token Factory console.
