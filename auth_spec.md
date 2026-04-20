# Authentication Specification

AppTemplate uses the [Better Auth](https://better-auth.com) library with providers enabled or disabled dynamically at runtime based on database records.

## Database Schema (Prisma)

### Model: `SystemSettings`

This table acts as a feature flag system for authentication providers.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | Primary key |
| `setting_key` | String (unique) | e.g. `auth_google_enabled` |
| `is_enabled` | Boolean | Default: `false` |
| `provider_config` | JSON (optional) | Client ID or Tenant ID if not using env vars |
| `updated_at` | DateTime | Auto-updated |

### Model: `User`

Standard schema required by Better Auth. Includes: `email`, `name`, `image`, `provider`, `providerAccountId`.

## Authentication Flow

1. **Server Start**: The Express app initializes.
2. **Config Load**: The app queries `SystemSettings` for all keys starting with `auth_`.
3. **Auth Initialization**: The Better Auth instance is created with only the enabled providers.
   - If `auth_google_enabled` is `false` in the DB, the Google provider is omitted.
4. **Runtime Check**: A middleware can re-check these flags periodically to allow enabling/disabling providers without restarting the server ("hot swap").

## Supported Auth Methods

| Method | Description |
|--------|-------------|
| Email / Password | Default. Always enabled. |
| TOTP (2FA) | Google Authenticator or any TOTP app. User-opt-in. |
| Email OTP | One-time code sent via SendGrid. Triggered after password check. |
| OAuth (Google, GitHub) | Optional. Enable via `SystemSettings` + env vars. |

## JWT Strategy

After a successful session login, the backend issues a short-lived JWT signed with `JWT_SECRET`. The frontend stores this in `localStorage` under the key `apptemplate_jwt_token` and includes it as a `Bearer` token in every protected API request.

The `jwtAuth` middleware on the backend validates this token on every protected route.
