import {
  json,
  readSiteContent,
  requireAdmin,
  serverError,
  unauthorized,
  writeSiteContent,
} from './_admin-utils.js';

export default async function handler(request) {
  try {
    const admin = requireAdmin(request);

    if (!admin) {
      return unauthorized();
    }

    if (request.method === 'GET') {
      return json(await readSiteContent());
    }

    if (request.method === 'PUT') {
      const content = await request.json();
      return json(await writeSiteContent(content, admin.email));
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (error) {
    return serverError(error);
  }
}
