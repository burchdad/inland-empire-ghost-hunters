# Deployment Checklist

## Domain

- Domain: `inlandempireghosthunters.com`
- Vercel should manage the production deployment.
- Add both:
  - `inlandempireghosthunters.com`
  - `www.inlandempireghosthunters.com`

## Professional Email

Create domain email before launch:

- `contact@inlandempireghosthunters.com`
- `evidence@inlandempireghosthunters.com`

Good options:

- Google Workspace
- Microsoft 365
- Zoho Mail
- Cloudflare Email Routing if forwarding is enough

## GitHub / Vercel

1. Create a GitHub repository named `inland-empire-ghost-hunters`.
2. Upload this site folder.
3. In Vercel, create a new project from the repository.
4. Framework preset: `Other`.
5. Build command: leave blank.
6. Output directory: leave blank or use the project root.

## Evidence Upload Upgrade

The current site uses email for evidence because it is the fastest launch path. For true uploads, use Vercel Blob:

1. Add Vercel Blob storage to the Vercel project.
2. Add a serverless endpoint for form submissions.
3. Upload files directly to Blob with private or hard-to-guess URLs.
4. Email the case details and secure evidence links to the owner.
5. Keep public sharing permission-based only.

Recommended upload limits for launch:

- Photos: up to 10 files
- Videos: one or two short clips
- Audio: common formats such as `.mp3`, `.wav`, `.m4a`
- Total submission limit: keep conservative until storage costs are clear

## Before Publishing

- Replace the YouTube placeholder with the real The Paranormal Observer channel URL.
- Confirm whether the client wants `Hablamos Espanol` with accented characters added in the final copy.
- Add any approved photos only if they look professional and do not reveal private client details.
- Test the request form after domain email is live.
