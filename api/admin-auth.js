import {
  adminConfig,
  createAdminToken,
  json,
  requireAdmin,
  serverError,
  unauthorized,
} from './_auth-utils.js';

export default async function handler(request) {
  try {
    if (request.method === 'GET') {
      const admin = requireAdmin(request);

      if (!admin) {
        return unauthorized();
      }

      return json({ ok: true, admin: { email: admin.email } });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const { email, password } = await request.json();
    const config = adminConfig();

    if (email !== config.email || password !== config.password) {
      return unauthorized();
    }

    return json({
      ok: true,
      token: createAdminToken(config.email),
      admin: {
        email: config.email,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
