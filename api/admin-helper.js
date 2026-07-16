import {
  json,
  readSiteContent,
  requireAdmin,
  serverError,
  unauthorized,
} from './_admin-utils.js';
import { withWebHandler } from './_web-adapter.js';

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

async function handler(request) {
  try {
    const admin = requireAdmin(request);

    if (!admin) {
      return unauthorized();
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const helperUrl = requiredEnv('GHOST_MISSION_CONTROL_WEBHOOK_URL');
    const helperKey = requiredEnv('GHOST_MISSION_CONTROL_WEBHOOK_SECRET');
    const body = await request.json();
    const siteContent = await readSiteContent();
    const response = await fetch(helperUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${helperKey}`,
        'X-Ghost-Mission-Control-Secret': helperKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        website: 'Inland Empire Ghost Hunters',
        origin: 'inland-empire-ghost-hunters-admin',
        admin: {
          email: admin.email,
        },
        siteMap: [
          'index.html',
          'approach.html',
          'evidence.html',
          'request.html',
          'join.html',
          'admin.html',
          'admin-dashboard.html',
        ],
        capabilities: [
          'inspect_content',
          'draft_copy',
          'troubleshoot_website',
          'prepare_selector_overrides',
          'modify_text_images_links_videos_via_admin_content',
          'explain_blob_media_and_inbox_records',
        ],
        currentContent: siteContent,
        conversation: body.messages || [],
        prompt: body.prompt || '',
      }),
    });

    const text = await response.text();
    let result;

    try {
      result = JSON.parse(text);
    } catch {
      result = { message: text };
    }

    if (!response.ok) {
      return json({ error: result.error || 'Website helper request failed' }, response.status);
    }

    return json(result);
  } catch (error) {
    return serverError(error);
  }
}

export default withWebHandler(handler);
