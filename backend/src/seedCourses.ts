import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { Course, slugify } from './models/Course'
import { Playlist } from './models/Playlist'
import { User } from './models/User'
import { Video, parseYoutubeId } from './models/Video'

dotenv.config()

/**
 * Migrate the previously hardcoded YouTube lessons (formerly in
 * app/kurslar/page.tsx) into the database-driven Course → Playlist → Video model.
 * Idempotent: re-running upserts the same course/playlist and replaces its videos.
 */

const COURSE_AUTHOR = 'Mashrabbek Ibodov'

const LESSONS = [
  { title: 'Kirish: Kurs haqida umumiy tushuncha', description: 'Ushbu darsda kursning maqsadi, o\'qish tartibi va amaliy natijalar haqida qisqacha tushuntirish beriladi.', url: 'https://www.youtube.com/watch?v=EkyLRc8mtII' },
  { title: 'Asosiy tamoyillar va boshlang\'ich qadamlar', description: 'Mavzuga kirish uchun kerak bo\'ladigan asosiy tushunchalar va darsni to\'g\'ri boshlash bo\'yicha tavsiyalar.', url: 'https://www.youtube.com/watch?v=GCur4Ly4uJs' },
  { title: 'Amaliy ko\'nikmalar: 1-qism', description: 'Mavzuni real misollar bilan mustahkamlash va bosqichma-bosqich bajarish usullari ko\'rsatiladi.', url: 'https://www.youtube.com/watch?v=el-9ihtgFiY' },
  { title: 'Amaliy ko\'nikmalar: 2-qism', description: 'Oldingi darsdagi bilimlarni davom ettirib, murakkabroq holatlar bilan ishlash ko\'rsatib beriladi.', url: 'https://www.youtube.com/watch?v=9M7OU8g3dXU' },
  { title: 'Muhim xatolar va ularni oldini olish', description: 'Ko\'p uchraydigan xatolar, ularning sabablari va to\'g\'ri yechimlari bo\'yicha izohlar beriladi.', url: 'https://www.youtube.com/watch?v=yRkb6uy0o-U' },
  { title: 'Tahlil va fikrlash strategiyasi', description: 'Mavzu bo\'yicha tez va aniq tahlil qilish, qaror qabul qilishga yordam beradigan yondashuvlar yoritiladi.', url: 'https://www.youtube.com/watch?v=o2x9TLGP5P4' },
  { title: 'Murakkab holatlar bilan ishlash', description: 'Qiyin vaziyatlarni bosqichma-bosqich hal qilish va natijani yaxshilash bo\'yicha amaliy yo\'riqnoma.', url: 'https://www.youtube.com/watch?v=o3xWZgvKWmY' },
  { title: 'Nazariyani amaliyotga bog\'lash', description: 'Nazariy bilimlarni amaliy vazifalarda qanday ishlatish va darslararo bog\'liqlikni to\'g\'ri qurish tushuntiriladi.', url: 'https://www.youtube.com/watch?v=ICwWG5HBa5s' },
  { title: 'Mustahkamlash va qayta ko\'rib chiqish', description: 'Asosiy nuqtalarni qayta takrorlash, mustahkamlash va keyingi bosqichga tayyorlanish bo\'yicha qisqa yo\'l xaritasi.', url: 'https://www.youtube.com/watch?v=_jtF4hNG0O8' },
  { title: 'Yakuniy dars: umumlashtirish', description: 'Kurs davomida o\'rganilgan mavzular yakunlanadi, keyingi rivojlanish uchun tavsiyalar beriladi.', url: 'https://www.youtube.com/watch?v=dKiTklAK9Mc' },
]

const COURSE_TITLE = 'Asosiy klinik ko\'nikmalar kursi'
const PLAYLIST_TITLE = 'Asosiy modul'

async function seedCourses() {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) throw new Error('MONGODB_URI topilmadi. backend/.env faylini tekshiring.')

  await mongoose.connect(mongoUri)
  console.log('MongoDB ga ulandi')

  // Prefer an instructor/admin as the owner so CM-panel ownership works.
  const owner = await User.findOne({ role: { $in: ['instructor', 'admin'] } })

  const slug = slugify(COURSE_TITLE)
  const course = await Course.findOneAndUpdate(
    { slug },
    {
      title: COURSE_TITLE,
      slug,
      description: 'Tibbiyot talabalari uchun asosiy klinik ko\'nikmalar bo\'yicha video darslar to\'plami.',
      category: 'Umumiy',
      author: COURSE_AUTHOR,
      level: 'beginner',
      isPremium: false,
      isPublished: true,
      ...(owner ? { createdBy: owner._id } : {}),
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
  console.log(`Kurs tayyor: ${course.title}`)

  const playlist = await Playlist.findOneAndUpdate(
    { course: course._id, title: PLAYLIST_TITLE },
    {
      course: course._id,
      title: PLAYLIST_TITLE,
      description: 'Boshlang\'ich darslar ketma-ketligi.',
      order: 0,
      isPublished: true,
      ...(owner ? { createdBy: owner._id } : {}),
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )

  // Replace videos for a clean, repeatable migration.
  await Video.deleteMany({ playlist: playlist._id })
  let order = 0
  let created = 0
  for (const lesson of LESSONS) {
    const youtubeId = parseYoutubeId(lesson.url)
    if (!youtubeId) {
      console.warn(`O'tkazib yuborildi (yaroqsiz URL): ${lesson.title}`)
      continue
    }
    await Video.create({
      playlist: playlist._id,
      course: course._id,
      title: lesson.title,
      description: lesson.description,
      youtubeId,
      order: order++,
      isPublished: true,
      ...(owner ? { createdBy: owner._id } : {}),
    })
    created++
  }
  console.log(`${created} ta video qo'shildi`)

  await mongoose.disconnect()
  console.log('Tayyor.')
}

seedCourses()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seed xatosi:', err)
    process.exit(1)
  })
