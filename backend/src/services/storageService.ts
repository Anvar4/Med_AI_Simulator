import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import path from 'path'

/**
 * File storage backed by DigitalOcean Spaces (S3-compatible). When the SPACES_*
 * env vars are present, uploads go to the bucket and a public CDN URL is
 * returned. When they are absent, `isSpacesEnabled()` is false and callers fall
 * back to local disk storage — so local dev works without Spaces credentials.
 *
 * Env vars are read lazily (inside functions) rather than at module load, so
 * the values are correct regardless of when dotenv.config() runs relative to
 * the import graph.
 */

function cfg() {
  const region = process.env.SPACES_REGION || 'sfo3'
  const bucket = process.env.SPACES_BUCKET || ''
  return {
    key: process.env.SPACES_KEY || '',
    secret: process.env.SPACES_SECRET || '',
    region,
    endpoint: process.env.SPACES_ENDPOINT || `https://${region}.digitaloceanspaces.com`,
    bucket,
    publicUrl: (process.env.SPACES_PUBLIC_URL
      || (bucket ? `https://${bucket}.${region}.digitaloceanspaces.com` : '')
    ).replace(/\/$/, ''),
  }
}

export function isSpacesEnabled(): boolean {
  const c = cfg()
  return Boolean(c.key && c.secret && c.bucket)
}

let _client: S3Client | null = null
function getClient(): S3Client {
  if (!_client) {
    const c = cfg()
    _client = new S3Client({
      region: c.region,
      endpoint: c.endpoint,
      forcePathStyle: false,
      credentials: { accessKeyId: c.key, secretAccessKey: c.secret },
    })
  }
  return _client
}

/** Build a unique, sanitized object key under the given folder. */
export function buildObjectKey(originalName: string, folder = 'uploads'): string {
  const ext = path.extname(originalName)
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)
  const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`
  return `${folder}/${base}-${unique}${ext.toLowerCase()}`
}

/**
 * Upload a buffer to Spaces and return its public URL. Objects are uploaded with
 * public-read ACL so the frontend can load them directly via the CDN.
 */
export async function uploadToSpaces(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const c = cfg()
  await getClient().send(new PutObjectCommand({
    Bucket: c.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }))
  return `${c.publicUrl}/${key}`
}
