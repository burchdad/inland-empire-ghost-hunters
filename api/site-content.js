import { json, readSiteContent, serverError } from './_admin-utils.js';
import { withWebHandler } from './_web-adapter.js';

async function handler(request) {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    return json(await readSiteContent());
  } catch (error) {
    return serverError(error);
  }
}

export default withWebHandler(handler);
