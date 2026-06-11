import './loadEnv'
import path from 'path'
import { pathToFileURL } from 'url'
import mongoose from 'mongoose'
import { Book } from './models/Book'
import { User } from './models/User'

/**
 * Migrate the legacy hardcoded library (frontend/lib/library-data.ts) into the
 * Book collection. Idempotent: upserts by title. Each legacy book's first PDF
 * source becomes the Book.fileUrl (sourceType 'external').
 *
 * Run: npm run seed:books
 */

interface LegacyBook {
  id: string
  title: string
  author: string
  year: number
  pages: number
  lang: 'uz' | 'ru' | 'en'
  category: string
  description: string
  tags: string[]
  isFeatured?: boolean
  sources: { type: string; label: string; url: string; embedUrl?: string }[]
}

async function loadLegacyBooks(): Promise<LegacyBook[]> {
  // frontend/lib/library-data.ts is plain TS with no runtime deps — tsx can import it.
  const file = path.resolve(__dirname, '..', '..', 'frontend', 'lib', 'library-data.ts')
  const mod = await import(pathToFileURL(file).href)
  return (mod.BOOKS ?? []) as LegacyBook[]
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI yo\'q')
  await mongoose.connect(uri)
  console.log('MongoDB ulandi')

  const legacy = await loadLegacyBooks()
  console.log(`Legacy kitoblar: ${legacy.length}`)

  // Attribute seeded books to an admin if one exists.
  const admin = await User.findOne({ role: 'admin' }).select('_id')

  let created = 0
  let updated = 0
  for (const b of legacy) {
    const pdf = b.sources.find(s => s.type === 'pdf' || /\.pdf($|\?)/i.test(s.url)) ?? b.sources[0]
    if (!pdf?.url) continue

    const doc = {
      title: b.title,
      author: b.author || '',
      description: b.description || '',
      category: b.category || 'Umumiy',
      language: b.lang || 'uz',
      year: b.year,
      pages: b.pages,
      tags: b.tags || [],
      fileUrl: pdf.url,
      sourceType: 'external' as const,
      isPublished: true,
      isFeatured: !!b.isFeatured,
      ...(admin ? { createdBy: admin._id } : {}),
    }

    const res = await Book.updateOne({ title: b.title }, { $set: doc }, { upsert: true })
    if (res.upsertedCount) created++
    else if (res.modifiedCount) updated++
  }

  const total = await Book.countDocuments({})
  console.log(`Tayyor — yaratildi: ${created}, yangilandi: ${updated}, jami Book: ${total}`)
  await mongoose.disconnect()
}

main().catch(err => { console.error(err); process.exit(1) })
