# Google Play — Data Safety form answers (Eagle Pathway)

Fill the Play Console **Data safety** section using this mapping. It reflects what
the app actually collects in code. Update if features change.

General:
- **Does the app collect or share user data?** Yes.
- **Is all data encrypted in transit?** Yes (HTTPS / TLS).
- **Do you provide a way to request data deletion?** Yes — in-app (Settings →
  Delete Account) and via support email. Also declare the privacy policy URL.

For every type below: collected = **Yes**, shared = **No** (we use processors, not
third-party sharing for ads/marketing), processing = required to provide the
feature, and user can request deletion.

| Play data type | Collected | Why (purpose) |
|---|---|---|
| Name | Yes | Account, app functionality |
| Email address | Yes | Account management, app functionality |
| Phone number | Yes | Account management, app functionality (parent↔student linking) |
| User IDs | Yes | Account management |
| Approximate location (City) | Yes | App functionality (matching) — entered by user, not GPS |
| Photos | Yes | App functionality (profile photo, document upload) |
| Files & docs | Yes | App functionality (transcripts, certificates, SOPs) |
| Messages (in-app) | Yes | App functionality (student↔tutor chat) |
| Payment info | Yes | App functionality (payment receipts, payouts) |
| App activity / other user-generated content | Yes | App functionality (applications, bookings, AI inputs) |
| Push token / Device IDs | Yes | App functionality (notifications) |
| Crash logs / diagnostics | Yes (if applicable) | Analytics / app stability |

Notes:
- **AI features:** text submitted to SOP review / assistant / mock interview is
  processed by Groq (a processor). Disclose under app-activity/user content.
- **No advertising or marketing use**, no data brokers, no selling.
- **Security:** data encrypted in transit; row-level security at rest.
- Account/data deletion route must match what you ship (the Settings → Delete
  Account item currently has no handler — wire it before relying on it, or provide
  the email route in the form).

## Other store-listing prerequisites
- Privacy policy URL (host `PRIVACY_POLICY.md`).
- App icon (512×512), feature graphic (1024×500), screenshots.
- Content rating questionnaire.
- Target audience & content (not primarily directed at children).
