import { json, saveInboxRecord, serverError } from './_admin-utils.js';
import { withWebHandler } from './_web-adapter.js';

const FORMSPREE_EVIDENCE_ENDPOINT = 'https://formspree.io/f/xeeyeank';

async function handler(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const payload = await request.json();
    const record = await saveInboxRecord('evidence-request', payload);
    const notification = new FormData();

    notification.append('_subject', payload.subject || `Investigation Request - ${payload.caseId || record.id}`);
    notification.append('case_id', payload.caseId || '');
    notification.append('case_packet_url', payload.casePacketUrl || '');
    notification.append('name', payload.name || '');
    notification.append('email', payload.email || '');
    notification.append('phone', payload.phone || '');
    notification.append('city', payload.city || '');
    notification.append('location_type', payload.locationType || '');
    notification.append('best_time', payload.bestTime || '');
    notification.append('evidence_types', payload.evidence || '');
    notification.append('uploaded_file_count', String(payload.uploadedFileCount || 0));
    notification.append('uploaded_files', payload.uploadedFiles || '');
    notification.append('message', payload.message || '');

    const response = await fetch(FORMSPREE_EVIDENCE_ENDPOINT, {
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

export default withWebHandler(handler);
