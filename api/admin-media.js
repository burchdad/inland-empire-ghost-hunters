import { list, put } from '@vercel/blob';
import {
  json,
  requireAdmin,
  serverError,
  unauthorized,
} from './_admin-utils.js';
import { withWebHandler } from './_web-adapter.js';

const MAX_MEDIA_SIZE = 50 * 1024 * 1024;
const allowedMediaTypes = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

function sanitizeFileName(fileName) {
  return String(fileName || 'media-file')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'media-file';
}

async function handler(request) {
  try {
    const admin = requireAdmin(request);

    if (!admin) {
      return unauthorized();
    }

    if (request.method === 'GET') {
      const { blobs } = await list({
        prefix: 'admin/media/',
        limit: 100,
      });

      return json({ media: blobs });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const form = await request.formData();
    const file = form.get('media');

    if (!file || typeof file === 'string') {
      return json({ error: 'No media file received' }, 400);
    }

    if (!allowedMediaTypes.has(file.type)) {
      return json({ error: 'Unsupported media type' }, 400);
    }

    if (file.size > MAX_MEDIA_SIZE) {
      return json({ error: 'Media file is larger than 50 MB' }, 400);
    }

    const blob = await put(`admin/media/${Date.now()}-${sanitizeFileName(file.name)}`, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return json({ media: blob });
  } catch (error) {
    return serverError(error);
  }
}

export default withWebHandler(handler);
