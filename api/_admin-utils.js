import crypto from 'node:crypto';
import { get, list, put } from '@vercel/blob';

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

export const ADMIN_CONTENT_PATH = 'admin/content/current.json';
export const DEFAULT_CONTENT = {
  updatedAt: null,
  updatedBy: 'system',
  overrides: [],
};

function json(data, status = 200) {
  return Response.json(data, { status });
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(payload) {
  return crypto
    .createHmac('sha256', requiredEnv('ADMIN_SESSION_SECRET'))
    .update(payload)
    .digest('base64url');
}

export function createAdminToken(email) {
  const payload = base64url(JSON.stringify({
    email,
    exp: Date.now() + TOKEN_TTL_MS,
  }));
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function verifyAdminToken(token) {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');
  const expectedSignature = signPayload(payload);

  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

    if (!data.exp || Date.now() > data.exp) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function getBearerToken(request) {
  const header = request.headers.get('authorization') || '';

  if (!header.toLowerCase().startsWith('bearer ')) {
    return '';
  }

  return header.slice(7).trim();
}

export function requireAdmin(request) {
  const admin = verifyAdminToken(getBearerToken(request));

  if (!admin) {
    return null;
  }

  return admin;
}

export function unauthorized() {
  return json({ error: 'Unauthorized' }, 401);
}

export function serverError(error) {
  return json({ error: error.message || 'Server error' }, 500);
}

export async function readBlobJson(pathname, fallback = null) {
  try {
    const result = await get(pathname);
    const text = await result.text();
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export async function writeBlobJson(pathname, data, access = 'private') {
  const body = JSON.stringify(data, null, 2);

  return put(pathname, body, {
    access,
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function readSiteContent() {
  return readBlobJson(ADMIN_CONTENT_PATH, DEFAULT_CONTENT);
}

export async function writeSiteContent(content, adminEmail = 'admin') {
  const nextContent = {
    ...DEFAULT_CONTENT,
    ...content,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail,
  };

  await writeBlobJson(`admin/content/backups/${Date.now()}-content.json`, nextContent);
  await writeBlobJson(ADMIN_CONTENT_PATH, nextContent);

  return nextContent;
}

export async function saveInboxRecord(type, payload) {
  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}`;
  const record = {
    id,
    type,
    status: 'new',
    receivedAt: now.toISOString(),
    payload,
  };

  await writeBlobJson(`admin/inbox/${id}.json`, record);
  return record;
}

export async function listInboxRecords() {
  const { blobs } = await list({
    prefix: 'admin/inbox/',
    limit: 100,
  });
  const records = [];

  for (const blob of blobs) {
    const record = await readBlobJson(blob.pathname || blob.url, null);
    if (record) {
      records.push(record);
    }
  }

  return records.sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)));
}

export function adminConfig() {
  return {
    email: requiredEnv('ADMIN_EMAIL'),
    password: requiredEnv('ADMIN_PASSWORD'),
  };
}

export { json };
