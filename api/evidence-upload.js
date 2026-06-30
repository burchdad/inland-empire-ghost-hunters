import { handleUpload } from '@vercel/blob/client';

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_FILES_PER_CASE = 6;

const allowedContentTypes = [
  'application/json',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/aac',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-m4a',
  'audio/x-wav',
  'text/markdown',
  'text/plain',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
];

function sanitizeSegment(value, fallback = 'upload') {
  return String(value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || fallback;
}

function parsePayload(clientPayload) {
  try {
    return clientPayload ? JSON.parse(clientPayload) : {};
  } catch {
    return {};
  }
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parsePayload(clientPayload);

        if (payload.website) {
          throw new Error('Upload rejected');
        }

        const caseId = sanitizeSegment(payload.caseId, 'case');
        const fileName = sanitizeSegment(pathname.split('/').pop(), 'evidence-file');
        const uploadCount = Number(payload.uploadCount || 0);

        if (!caseId.startsWith('IEGH-')) {
          throw new Error('Missing case reference');
        }

        if (uploadCount > MAX_FILES_PER_CASE + 1) {
          throw new Error('Too many files for one case');
        }

        return {
          allowedContentTypes,
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
          pathname: `evidence/${caseId}/${fileName}`,
          tokenPayload: JSON.stringify({
            caseId,
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('IEGH evidence upload completed', {
          blobUrl: blob.url,
          pathname: blob.pathname,
          tokenPayload,
        });
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
