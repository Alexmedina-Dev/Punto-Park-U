# Email Service Specification

## Purpose

Replace `console.log` email simulation with real transactional email delivery via Resend, with a development fallback. The service MUST send verification, password-reset, and welcome emails with Punto Park U branded HTML templates.

## Requirements

### Requirement: Email Delivery

The system MUST integrate Resend as the primary email provider. If `RESEND_API_KEY` is not set, the service MUST fall back to `console.log` without failing.

#### Scenario: Sends verification email via Resend

- GIVEN `RESEND_API_KEY` is configured and a user with `isVerified=false` exists
- WHEN the auth controller calls `emailService.sendVerification(user, token)`
- THEN an email is sent to `user.email` with a verification link
- AND the email body contains the frontend verify URL and 1-hour expiry notice

#### Scenario: Sends password reset email via Resend

- GIVEN `RESEND_API_KEY` is configured and a user requests password reset
- WHEN the auth controller calls `emailService.sendPasswordReset(user, token)`
- THEN an email with the reset link is sent

#### Scenario: Falls back to console.log without API key

- GIVEN `RESEND_API_KEY` is NOT set in environment
- WHEN any email method is called
- THEN the service logs the email content to console with a `[email-service]` prefix
- AND does NOT throw or crash

#### Scenario: Handles Resend API error gracefully

- GIVEN Resend API returns a non-2xx response
- WHEN `emailService` attempts to send
- THEN it logs the error and falls back to `console.log`
- AND the calling controller receives a resolved promise (does not propagate error to user)

### Requirement: Email Templates

The service MUST use HTML templates with Punto Park U branding (logo, primary color `#10B981`, dark-mode-compatible background).

#### Scenario: Renders branded verification template

- GIVEN a user and verification URL
- WHEN `emailService.sendVerification(user, token)` is called
- THEN the HTML body includes the Punto Park U logo
- AND uses the brand primary color for buttons
