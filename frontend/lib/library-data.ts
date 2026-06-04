export type BookLang = 'uz' | 'ru' | 'en'
export type BookCategory =
| 'anatomiya'
| 'fiziologiya'
| 'patologiya'
| 'terapiya'
| 'jarrohlik'
| 'pediatriya'
| 'farmakologiya'
| 'nevrologiya'
| 'kardiologiya'
| 'onkologiya'
| 'ginekologiya'
| 'infektologiya'
| 'radiologiya'
| 'psixiatriya'
| 'stomatologiya'

export interface BookSource {
type: 'archive' | 'ncbi' | 'google' | 'pdf' | 'web'
label: string
url: string
embedUrl?: string
}

export interface Book {
id: string
title: string
author: string
year: number
pages: number
lang: BookLang
category: BookCategory
description: string
cover: string
tags: string[]
isFeatured?: boolean
isNew?: boolean
sources: BookSource[]
}

export const BOOKS: Book[] = [
{
id: 'lib-001',
title: 'ODAM ANATOMIYASI BOLALAR ANATOMIYASI ASOSLARI BILAN',
author: 'Unilibrary',
year: 2024,
pages: 320,
lang: 'uz',
category: 'anatomiya',
description: 'Klinik amaliyotga yo\'naltirilgan anatomik qo\'llanma.',
cover: '[BOOK]',
tags: ['anatomiya', 'tibbiyot', 'unilibrary'],
isFeatured: true,
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/849937/images/1772703509.pdf' },
],
},
{
id: 'lib-002',
title: 'Bosh sohasi klinik anatomiyasi',
author: 'Unilibrary',
year: 2025,
pages: 240,
lang: 'uz',
category: 'anatomiya',
description: 'Bosh va bo\'yin anatomiyasining klinik jihatlari.',
cover: '[BOOK]',
tags: ['anatomiya', 'klinika', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/851810/images/1773389844.pdf' },
],
},
{
id: 'lib-003',
title: "Harakat va tayanch a'zolar tizimi anatomiyasi",
author: 'ZiyoNET',
year: 2018,
pages: 210,
lang: 'uz',
category: 'anatomiya',
description: 'Harakat tizimi va skelet-mushak tuzilmalari bo\'yicha asosiy material.',
cover: '[BOOK]',
tags: ['anatomiya', 'ziyonet', 'tayanch tizim'],
isFeatured: true,
sources: [
{ type: 'pdf', label: 'ZiyoNET PDF', url: 'https://api.ziyonet.uz/uploads/books/48142/5a96401028b71.pdf' },
],
},
{
id: 'lib-004',
title: 'Normal fiziologiya',
author: 'Unilibrary',
year: 2026,
pages: 360,
lang: 'uz',
category: 'fiziologiya',
description: 'Organizm funksional tizimlari va homeostaz mexanizmlari.',
cover: '[BOOK]',
tags: ['fiziologiya', 'homeostaz', 'unilibrary'],
isFeatured: true,
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/855161/images/1774952993.pdf' },
],
},
{
id: 'lib-005',
title: 'Odam anatomiyasi va fiziologiyasi',
author: 'Unilibrary',
year: 2023,
pages: 300,
lang: 'uz',
category: 'fiziologiya',
description: 'Anatomiya va fiziologiya fanlarining integratsiyalashgan kursi.',
cover: '[BOOK]',
tags: ['fiziologiya', 'anatomiya', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/848591/images/1772101150.pdf' },
],
},
{
id: 'lib-006',
title: 'Ovqat hazm qilish va ovqatlanish fiziologiyasi',
author: 'ZiyoNET',
year: 2018,
pages: 190,
lang: 'uz',
category: 'fiziologiya',
description: 'Hazm tizimi, modda almashinuvi va ratsional ovqatlanish asoslari.',
cover: '[BOOK]',
tags: ['fiziologiya', 'ovqatlanish', 'ziyonet'],
sources: [
{ type: 'pdf', label: 'ZiyoNET PDF', url: 'https://api.ziyonet.uz/uploads/books/634149/5b2896ec60934.pdf' },
],
},
{
id: 'lib-007',
title: 'Patologik fiziologiya',
author: 'Unilibrary',
year: 2008,
pages: 410,
lang: 'uz',
category: 'patologiya',
description: 'Kasallik rivojlanishining umumiy qonuniyatlari va patogenez.',
cover: '⚗️',
tags: ['patologiya', 'patofiziologiya', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/853659/images/1774353409.pdf' },
],
},
{
id: 'lib-008',
title: 'PATOLOGIK FIZIOLOGIYA',
author: 'Unilibrary',
year: 2025,
pages: 330,
lang: 'uz',
category: 'patologiya',
description: 'Patologik holatlarning zamonaviy klinik-fiziologik talqini.',
cover: '[BOOK]',
tags: ['patologiya', 'klinika', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/849851/images/1772694789.pdf' },
],
},
{
id: 'lib-009',
title: 'Ichki kasalliklar proredevtikasi',
author: 'Unilibrary',
year: 2019,
pages: 390,
lang: 'uz',
category: 'terapiya',
description: 'Terapiyaga kirish, bemorni ko\'rikdan o\'tkazish va klinik tafakkur.',
cover: '[BOOK]',
tags: ['terapiya', 'propedevtika', 'unilibrary'],
isFeatured: true,
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/852218/images/1773645263.pdf' },
],
},
{
id: 'lib-010',
title: 'Urologiya',
author: 'Unilibrary',
year: 2025,
pages: 280,
lang: 'uz',
category: 'terapiya',
description: 'Siydik-tanosil tizimi kasalliklari va davolash yondashuvlari.',
cover: '[BOOK]',
tags: ['urologiya', 'terapiya', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/855399/images/1775044348.pdf' },
],
},
{
id: 'lib-011',
title: 'Valeologiya preventiv tibbiyotning asosi',
author: 'Unilibrary',
year: 2025,
pages: 250,
lang: 'uz',
category: 'terapiya',
description: 'Sog\'lom turmush, profilaktika va preventiv tibbiyot konsepsiyasi.',
cover: '[BOOK]',
tags: ['preventiv', 'salomatlik', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/851811/images/1773390854.pdf' },
],
},
{
id: 'lib-012',
title: 'TORAKAL JARROHLIK',
author: 'Unilibrary',
year: 2026,
pages: 310,
lang: 'uz',
category: 'jarrohlik',
description: 'Ko\'krak qafasi jarrohligi bo\'yicha amaliy usullar.',
cover: '[BOOK]',
tags: ['jarrohlik', 'torakal', 'unilibrary'],
isFeatured: true,
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/855162/images/1774953264.pdf' },
],
},
{
id: 'lib-013',
title: 'ОКАЗАНИЕ ПЕРВОЙ ПОМОЩИ',
author: 'Unilibrary',
year: 2024,
pages: 220,
lang: 'ru',
category: 'jarrohlik',
description: 'Shoshilinch holatlarda birinchi yordam algoritmlari.',
cover: '[BOOK]',
tags: ['birinchi yordam', 'urgent', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/850614/images/1773121970.pdf' },
],
},
{
id: 'lib-014',
title: 'Pediatriya',
author: 'Unilibrary',
year: 2025,
pages: 420,
lang: 'uz',
category: 'pediatriya',
description: 'Bolalar kasalliklari diagnostikasi va davolash asoslari.',
cover: '[BOOK]',
tags: ['pediatriya', 'bolalar', 'unilibrary'],
isFeatured: true,
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/855366/images/1775040682.pdf' },
],
},
{
id: 'lib-015',
title: 'Pediatriyada dalillarga asoslangan tibbiyot',
author: 'Unilibrary',
year: 2025,
pages: 260,
lang: 'uz',
category: 'pediatriya',
description: 'Pediatriyada evidence-based yondashuvlar va klinik qarorlar.',
cover: '[BOOK]',
tags: ['pediatriya', 'evidence', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/850065/images/1772769309.pdf' },
],
},
{
id: 'lib-016',
title: 'Dori allergiyasi',
author: 'Unilibrary',
year: 2025,
pages: 180,
lang: 'uz',
category: 'farmakologiya',
description: 'Dori vositalariga allergik reaksiyalarni baholash va boshqarish.',
cover: '[BOOK]',
tags: ['farmakologiya', 'allergiya', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/844457/images/1769508595.pdf' },
],
},
{
id: 'lib-017',
title: 'Tibbiy kimyo',
author: 'Unilibrary',
year: 2025,
pages: 300,
lang: 'uz',
category: 'farmakologiya',
description: 'Tibbiyotdagi kimyoviy jarayonlar va dori moddalarining asoslari.',
cover: '[BOOK]',
tags: ['tibbiy kimyo', 'farmakologiya', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/845558/images/1770283403.pdf' },
],
},
{
id: 'lib-018',
title: 'Umumiy nevralogiya',
author: 'Unilibrary',
year: 2026,
pages: 340,
lang: 'uz',
category: 'nevrologiya',
description: 'Nevrologik tekshiruv va markaziy asab tizimi kasalliklari.',
cover: '[BOOK]',
tags: ['nevrologiya', 'asab tizimi', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/855741/images/1775192778.pdf' },
],
},
{
id: 'lib-019',
title: 'Амалий электрокардиография',
author: 'Unilibrary',
year: 2024,
pages: 250,
lang: 'ru',
category: 'kardiologiya',
description: 'EKG ko\'rsatkichlarini o\'qish va klinik amaliyotda qo\'llash.',
cover: '❤️',
tags: ['kardiologiya', 'EKG', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/844742/images/1769681078.pdf' },
],
},
{
id: 'lib-020',
title: 'Ишемическая болезнь сердца',
author: 'Unilibrary',
year: 2025,
pages: 230,
lang: 'ru',
category: 'kardiologiya',
description: 'Yurak ishemik kasalligi bo\'yicha zamonaviy klinik yondashuv.',
cover: '[BOOK]',
tags: ['kardiologiya', 'IBS', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/850109/images/1772772203.pdf' },
],
},
{
id: 'lib-021',
title: 'Уход за онкологическими больными',
author: 'Unilibrary',
year: 2002,
pages: 260,
lang: 'ru',
category: 'onkologiya',
description: 'Onkologik bemorlarga parvarish va klinik kuzatuv bo\'yicha qo\'llanma.',
cover: '[BOOK]',
tags: ['onkologiya', 'parvarish', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/853222/images/1774265536.pdf' },
],
},
{
id: 'lib-022',
title: 'Избранные вопросы акушерства и гинекологии',
author: 'Unilibrary',
year: 1970,
pages: 220,
lang: 'ru',
category: 'ginekologiya',
description: 'Akusherlik va ginekologiyaning tanlangan klinik masalalari.',
cover: '[BOOK]',
tags: ['ginekologiya', 'akusherlik', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/847598/images/1771568455.pdf' },
],
},
{
id: 'lib-023',
title: 'Yuqumli kasalliklar',
author: 'Unilibrary',
year: 2025,
pages: 310,
lang: 'uz',
category: 'infektologiya',
description: 'Yuqumli kasalliklarni tashxislash, davolash va profilaktika.',
cover: '[BOOK]',
tags: ['infektologiya', 'epidemiologiya', 'unilibrary'],
isFeatured: true,
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/851792/images/1773388575.pdf' },
],
},
{
id: 'lib-024',
title: 'Mikrobiologiya, virusologiya, immunologiya',
author: 'Unilibrary',
year: 2024,
pages: 340,
lang: 'uz',
category: 'infektologiya',
description: 'Mikroorganizmlar, viruslar va immun javob mexanizmlarini o\'rganish.',
cover: '[BOOK]',
tags: ['mikrobiologiya', 'virusologiya', 'immunologiya'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/844462/images/1769509565.pdf' },
],
},
{
id: 'lib-025',
title: 'Tibbiy radiologiya',
author: 'Unilibrary',
year: 2025,
pages: 280,
lang: 'uz',
category: 'radiologiya',
description: 'Diagnostik radiologiyaning amaliy usullari va talqinlari.',
cover: '[BOOK]',
tags: ['radiologiya', 'diagnostika', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/849966/images/1772705567.pdf' },
],
},
{
id: 'lib-026',
title: 'Audiometriya asoslari',
author: 'ZiyoNET',
year: 2018,
pages: 140,
lang: 'uz',
category: 'radiologiya',
description: 'Eshitish analizatori va audiometriya tekshiruv usullari.',
cover: '[BOOK]',
tags: ['audiometriya', 'diagnostika', 'ziyonet'],
sources: [
{ type: 'pdf', label: 'ZiyoNET PDF', url: 'https://api.ziyonet.uz/uploads/books/47828/5aabcb93d4010.pdf' },
],
},
{
id: 'lib-027',
title: 'Sud psixiatriyasi va tibbiyoti',
author: 'Unilibrary',
year: 2024,
pages: 260,
lang: 'uz',
category: 'psixiatriya',
description: 'Sud-psixiatriya ekspertizasi va klinik-psixologik baholash.',
cover: '[BOOK]',
tags: ['psixiatriya', 'sud tibbiyoti', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/848718/images/1772168967.pdf' },
],
},
{
id: 'lib-028',
title: 'Patopsixologiya va tibbiyot psixologiyasi',
author: 'ZiyoNET',
year: 2018,
pages: 180,
lang: 'uz',
category: 'psixiatriya',
description: 'Patopsixologik holatlar va klinik psixologiya amaliyoti.',
cover: '[BOOK]',
tags: ['patopsixologiya', 'psixologiya', 'ziyonet'],
sources: [
{ type: 'pdf', label: 'ZiyoNET PDF', url: 'https://api.ziyonet.uz/uploads/books/47879/5ac4acf729334.pdf' },
],
},
{
id: 'lib-029',
title: 'BOLALAR TRAPEVTIK STOMATOLOGIYASI',
author: 'Unilibrary',
year: 2017,
pages: 240,
lang: 'uz',
category: 'stomatologiya',
description: 'Bolalar stomatologiyasida terapevtik usullar.',
cover: '[BOOK]',
tags: ['stomatologiya', 'bolalar', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/855688/images/1775131407.pdf' },
],
},
{
id: 'lib-030',
title: 'TERAPEVTIK STOMATOLOGIYA',
author: 'Unilibrary',
year: 2020,
pages: 290,
lang: 'uz',
category: 'stomatologiya',
description: 'Terapevtik stomatologiyaning asosiy klinik yo\'nalishlari.',
cover: '[BOOK]',
tags: ['stomatologiya', 'terapevtik', 'unilibrary'],
sources: [
{ type: 'pdf', label: 'Unilibrary PDF', url: 'https://api.unilibrary.uz/storage/PublisherResourceFile/855686/images/1775130645.pdf' },
],
},
]

export const CATEGORIES: { value: string; label: string; labelEn: string }[] = [
{ value: 'all',           label: 'Barchasi',      labelEn: 'All'              },
{ value: 'anatomiya',     label: 'Anatomiya',     labelEn: 'Anatomy'          },
{ value: 'fiziologiya',   label: 'Fiziologiya',   labelEn: 'Physiology'       },
{ value: 'patologiya',    label: 'Patologiya',    labelEn: 'Pathology'        },
{ value: 'terapiya',      label: 'Terapiya',      labelEn: 'Therapy'          },
{ value: 'jarrohlik',     label: 'Jarrohlik',     labelEn: 'Surgery'          },
{ value: 'farmakologiya', label: 'Farmakologiya', labelEn: 'Pharmacology'     },
{ value: 'kardiologiya',  label: 'Kardiologiya',  labelEn: 'Cardiology'       },
{ value: 'nevrologiya',   label: 'Nevrologiya',   labelEn: 'Neurology'        },
{ value: 'pediatriya',    label: 'Pediatriya',    labelEn: 'Pediatrics'       },
{ value: 'ginekologiya',  label: 'Ginekologiya',  labelEn: 'Gynecology'       },
{ value: 'onkologiya',    label: 'Onkologiya',    labelEn: 'Oncology'         },
{ value: 'infektologiya', label: 'Infektologiya', labelEn: 'Infectious Dis.'  },
{ value: 'radiologiya',   label: 'Radiologiya',   labelEn: 'Radiology'        },
{ value: 'psixiatriya',   label: 'Psixiatriya',   labelEn: 'Psychiatry'       },
{ value: 'stomatologiya', label: 'Stomatologiya', labelEn: 'Dentistry'        },
]

export const LANG_LABELS: Record<BookLang, string> = {
uz: "O'zbek",
ru: 'Русский',
en: 'English',
}

export const SOURCE_LABELS: Record<BookSource['type'], { label: string; color: string; bg: string }> = {
archive: { label: 'Internet Archive', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
ncbi:    { label: 'NCBI Bookshelf',   color: 'text-blue-400',  bg: 'bg-blue-400/10  border-blue-400/20'  },
google:  { label: 'Google Books',     color: 'text-red-400',   bg: 'bg-red-400/10   border-red-400/20'   },
pdf:     { label: 'PDF o\'qish',       color: 'text-primary',   bg: 'bg-primary/10   border-primary/20'   },
web:     { label: 'Veb sahifa',        color: 'text-success',   bg: 'bg-success/10   border-success/20'   },
}

function normalizeUrl(url: string): string {
return url.trim()
}

const EMBED_PROXY_ALLOWED_HOSTS = new Set([
'api.unilibrary.uz',
'api.ziyonet.uz',
])

function toLibraryProxyUrl(rawUrl: string): string | undefined {
try {
const parsed = new URL(normalizeUrl(rawUrl))
if (parsed.protocol !== 'https:') return undefined
if (!parsed.pathname.toLowerCase().endsWith('.pdf')) return undefined
if (!EMBED_PROXY_ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) return undefined
return `/api/library/proxy?url=${encodeURIComponent(parsed.toString())}`
} catch {
return undefined
}
}

export function isEmbeddableSource(source: BookSource): boolean {
if (!source.embedUrl) return false
const embed = normalizeUrl(source.embedUrl).toLowerCase()
return embed.includes('/api/library/proxy?url=') || embed.includes('archive.org/embed/')
}

export function getBookSources(book: Pick<Book, 'sources'>): BookSource[] {
const result: BookSource[] = []
const seen = new Set<string>()

for (const source of book.sources) {
const url = normalizeUrl(source.url)
if (!url || seen.has(url)) continue
seen.add(url)

const embedUrl = source.embedUrl
? normalizeUrl(source.embedUrl)
: source.type === 'pdf'
? toLibraryProxyUrl(url)
: undefined

result.push({
...source,
url,
embedUrl,
})
}

return result
}
