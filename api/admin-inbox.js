import {
  json,
  listInboxRecords,
  requireAdmin,
  serverError,
  unauthorized,
} from './_admin-utils.js';
import { withWebHandler } from './_web-adapter.js';

async function handler(request) {
  try {
    const admin = requireAdmin(request);

    if (!admin) {
      return unauthorized();
    }

    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405);
    }

    return json({
      records: await listInboxRecords(),
    });
  } catch (error) {
    return serverError(error);
  }
}

export default withWebHandler(handler);
