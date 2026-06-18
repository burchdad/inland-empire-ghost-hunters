# Inland Empire Ghost Hunters Website Starter

Static, fast-loading starter site for `inlandempireghosthunters.com`.

## What is included

- Professional dark/blue visual style with no haunted-attraction graphics
- Home, Our Approach, Evidence / YouTube, Request an Investigation, Service Area, and Join the Team sections
- Dedicated `request.html` page for investigation requests and evidence submission guidance
- Live multi-camera video monitoring featured on the homepage
- Contact email: `contact@inlandempireghosthunters.com`
- Evidence email: `evidence@inlandempireghosthunters.com`
- Request form that prepares an email draft
- Evidence submission checklist and privacy notice
- Spanish contact paragraph

## Launch notes

1. Create a GitHub repo and upload this folder.
2. Create a Vercel project from that repo.
3. Point `inlandempireghosthunters.com` DNS to Vercel.
4. Set up domain email aliases or mailboxes:
   - `contact@inlandempireghosthunters.com`
   - `evidence@inlandempireghosthunters.com`
5. Replace the placeholder YouTube button URL in `index.html` once The Paranormal Observer link is available.

## Future form/upload upgrade

The current form uses `mailto:` so the site can launch without a backend. For a stronger production setup, add a small serverless form handler and Vercel Blob storage for evidence uploads. Recommended flow:

- Request form submissions go to a serverless endpoint.
- Evidence files upload to private Blob storage.
- The owner receives an email notification with the case details and secure file links.
- Public evidence remains permission-based only.
