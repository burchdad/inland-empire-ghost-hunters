import { json, saveInboxRecord, serverError } from './_admin-utils.js';

const FORMSPREE_SUPPORT_ENDPOINT = 'https://formspree.io/f/xqerepna';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await request.json();
    const payload = {
      name: body.name || '',
      email: body.email || '',
      message: body.message || '',
      submittedAt: new Date().toISOString(),
    };
    const record = await saveInboxRecord('support-work', payload);
    const notification = new FormData();

    notification.append('_subject', 'Join the Team / Support Work Interest');
    notification.append('name', payload.name);
    notification.append('email', payload.email);
    notification.append('message', payload.message);
    notification.append('inbox_record_id', record.id);

    const response = await fetch(FORMSPREE_SUPPORT_ENDPOINT, {
      method: 'POST',
      body: notification,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return json({
        ok: true,
        inboxRecordId: record.id,
        emailSent: false,
        warning: 'Inbox backup saved, but Formspree notification failed',
      });
    }

    return json({ ok: true, inboxRecordId: record.id, emailSent: true });
  } catch (error) {
    return serverError(error);
  }
}
