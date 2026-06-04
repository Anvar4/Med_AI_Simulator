/**
 * 3D anatomy model catalog (Sketchfab embeds).
 *
 * Each model is shown through an embedded iframe with the Sketchfab UI stripped
 * down via embed params so the viewer feels native. Each model carries a
 * localized (uz/ru/en) title, description and a list of parts/organs it
 * contains, shown in a side panel that doesn't obstruct the 3D view.
 */
import type { Locale } from './i18n'

export interface LocalizedText {
  uz: string
  ru: string
  en: string
}

export interface AnatomyModel {
  id: string
  category: string
  embedUrl: string
  title: LocalizedText
  description: LocalizedText
  /** Parts / organs / structures visible in this model. */
  parts: LocalizedText[]
}

export function tl(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.uz
}

// Embed flags. Performance-tuned: do NOT autostart/preload heavy geometry —
// the model loads on demand (when the viewer mounts the iframe), and Sketchfab's
// own loading bar is shown so the user sees progress instead of a frozen screen.
const EMBED_PARAMS: Record<string, string> = {
  autostart: '0',        // don't force-load the full model immediately
  preload: '0',          // don't pre-fetch all textures up front
  transparent: '1',
  ui_loading: '1',       // show Sketchfab's loading progress
  ui_infos: '0',
  ui_controls: '0',
  ui_stop: '0',
  ui_watermark: '0',
  ui_watermark_link: '0',
  ui_hint: '0',
  ui_ar: '0',
  ui_help: '0',
  ui_settings: '0',
  ui_vr: '0',
  ui_fullscreen: '0',
  ui_inspector: '0',
  ui_theme: 'dark',
  dnt: '1',
  scrollwheel: '1',
  // Hide annotations (the numbered hotspots + english labels). The panel flag
  // (ui_annotations) is not always enough, so also disable the 3D annotation
  // markers via the documented flags; the API call in the viewer is the final
  // guarantee.
  ui_annotations: '0',
  annotation: '0',
  annotations_visible: '0',
  annotation_tooltip_visible: '0',
}

// Sketchfab Viewer API script (loaded once) lets us programmatically turn off
// annotations after the model finishes loading — the only reliable way to hide
// the 3D hotspot markers for models we don't own.
export const SKETCHFAB_API_SRC = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js'

/** Build a cleaned embed URL with the UI-suppressing query params appended. */
export function buildEmbedSrc(embedUrl: string): string {
  const qs = Object.entries(EMBED_PARAMS).map(([k, v]) => `${k}=${v}`).join('&')
  const sep = embedUrl.includes('?') ? '&' : '?'
  return `${embedUrl}${sep}${qs}`
}

export const ANATOMY_CATEGORIES: LocalizedText[] = [
  { uz: 'Barchasi', ru: 'Все', en: 'All' },
  { uz: 'To‘liq tana', ru: 'Всё тело', en: 'Full Body' },
  { uz: 'Ichki organlar', ru: 'Внутренние органы', en: 'Internal Organs' },
  { uz: 'Yurak-tomir', ru: 'Сердечно-сосудистая', en: 'Cardiovascular' },
  { uz: 'Nafas', ru: 'Дыхательная', en: 'Respiratory' },
  { uz: 'Skelet', ru: 'Скелет', en: 'Skeletal' },
  { uz: 'Mushaklar', ru: 'Мышцы', en: 'Muscular' },
  { uz: 'Ayol anatomiyasi', ru: 'Женская анатомия', en: 'Female Anatomy' },
  { uz: 'Teri', ru: 'Кожа', en: 'Dermatology' },
  { uz: 'Patologiya', ru: 'Патология', en: 'Pathology' },
  { uz: 'Ko‘z', ru: 'Офтальмология', en: 'Ophthalmology' },
  { uz: 'LOR', ru: 'ЛОР', en: 'ENT' },
  { uz: 'Qo‘l-oyoq', ru: 'Конечности', en: 'Limbs' },
  { uz: 'Tish', ru: 'Стоматология', en: 'Dental' },
]

// helper to keep entries compact
const T = (uz: string, ru: string, en: string): LocalizedText => ({ uz, ru, en })

export const ANATOMY_MODELS: AnatomyModel[] = [
  // ───────── Full body ─────────
  {
    id: 'full-human-body-anatomy',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/9b0b079953b840bc9a13f524b60041e4/embed',
    title: T('To‘liq odam anatomiyasi', 'Полная анатомия человека', 'Full Human Body Anatomy'),
    description: T(
      'Inson tanasining barcha asosiy tizimlarini ko‘rsatuvchi to‘liq animatsiyali model. O‘quv maqsadida tana tizimlarini birgalikda kuzatish imkonini beradi.',
      'Полная анимированная модель, показывающая все основные системы тела человека для совместного изучения.',
      'A complete animated model showing every major body system together for integrated study.'
    ),
    parts: [
      T('Skelet', 'Скелет', 'Skeleton'),
      T('Bosh miya', 'Головной мозг', 'Brain'),
      T('Hazm tizimi', 'Пищеварительная система', 'Digestive system'),
      T('O‘pkalar', 'Лёгкие', 'Lungs'),
      T('Yurak', 'Сердце', 'Heart'),
      T('Siydik tizimi', 'Мочевая система', 'Urinary system'),
      T('Jigar', 'Печень', 'Liver'),
      T('Qon aylanish tizimi', 'Кровеносная система', 'Circulatory system'),
      T('Teri', 'Кожа', 'Skin'),
      T('Mushaklar', 'Мышцы', 'Muscles'),
    ],
  },
  {
    id: 'animated-human-body',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/51ebbf617d4f4faeb099d70336e13a58/embed',
    title: T('Animatsiyali odam anatomiyasi', 'Анимированная анатомия человека', 'Animated Human Body Anatomy'),
    description: T(
      'Asosiy organlar va tizimlar harakatda ko‘rsatilgan animatsiyali to‘liq tana modeli.',
      'Анимированная модель тела с основными органами и системами в движении.',
      'An animated full-body model with the main organs and systems shown in motion.'
    ),
    parts: [
      T('Skelet', 'Скелет', 'Skeleton'),
      T('Bosh miya', 'Головной мозг', 'Brain'),
      T('Hazm tizimi', 'Пищеварительная система', 'Digestive system'),
      T('O‘pkalar', 'Лёгкие', 'Lungs'),
      T('Yurak', 'Сердце', 'Heart'),
      T('Ichki organlar', 'Внутренние органы', 'Internal organs'),
    ],
  },
  {
    id: 'male-full-body-anatomy',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/1688cedcfb3b4f3ea7a03e3a3e34bdd8/embed',
    title: T('Erkak tanasi anatomiyasi', 'Анатомия мужского тела', 'Male Full Body Anatomy'),
    description: T(
      'Erkak tanasining to‘liq anatomik modeli — tashqi va ichki tuzilmalar.',
      'Полная анатомическая модель мужского тела — наружные и внутренние структуры.',
      'A complete anatomical model of the male body — external and internal structures.'
    ),
    parts: [
      T('Skelet', 'Скелет', 'Skeleton'),
      T('Mushaklar', 'Мышцы', 'Muscles'),
      T('Ichki organlar', 'Внутренние органы', 'Internal organs'),
    ],
  },
  {
    id: 'full-body-anatomy-general',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/e6899d35dd0741daa94a8a4e7bde1e99/embed',
    title: T('Umumiy tana anatomiyasi', 'Общая анатомия тела', 'Full Body Anatomy'),
    description: T(
      'Skelet, organlar va tizimlarni qamrab oluvchi umumiy o‘quv modeli.',
      'Общая учебная модель, охватывающая скелет, органы и системы.',
      'A general educational model covering the skeleton, organs and systems.'
    ),
    parts: [
      T('Skelet', 'Скелет', 'Skeleton'),
      T('Bosh miya', 'Головной мозг', 'Brain'),
      T('Yurak', 'Сердце', 'Heart'),
      T('Mushaklar', 'Мышцы', 'Muscles'),
      T('Jigar', 'Печень', 'Liver'),
      T('O‘pkalar', 'Лёгкие', 'Lungs'),
      T('Umurtqa pog‘onasi', 'Позвоночник', 'Spine'),
      T('Qon aylanish tizimi', 'Кровеносная система', 'Circulatory system'),
      T('Hazm tizimi', 'Пищеварительная система', 'Digestive system'),
    ],
  },
  {
    id: 'complete-human-anatomy-3d4sci',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/c904a5a65ae145a0bc535645c7e693af/embed',
    title: T('To‘liq inson anatomiyasi', 'Полная анатомия человека', 'Complete Human Anatomy'),
    description: T(
      'Yuqori aniqlikdagi to‘liq anatomiya modeli (~2 mln uchburchak). Mobil qurilmada sekinroq yuklanishi mumkin.',
      'Высокодетализированная полная модель (~2 млн треугольников). На мобильных может грузиться медленнее.',
      'A high-detail complete anatomy model (~2M triangles). May load slower on mobile.'
    ),
    parts: [
      T('Skelet', 'Скелет', 'Skeleton'),
      T('Mushaklar', 'Мышцы', 'Muscles'),
      T('Ichki organlar', 'Внутренние органы', 'Internal organs'),
      T('Asab tizimi', 'Нервная система', 'Nervous system'),
    ],
  },
  {
    id: 'human-anatomy-male-explosive-view',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/7fff13988a094eaca9cb5057fb2fd1f2/embed',
    title: T('Erkak anatomiyasi — ajratilgan ko‘rinish', 'Анатомия мужчины — разнесённый вид', 'Male Anatomy — Exploded View'),
    description: T(
      'Tana tizimlari ajratilgan (portlatilgan) ko‘rinishda — har bir tizimni alohida ko‘rish qulay.',
      'Системы тела в разнесённом виде — удобно рассматривать каждую систему отдельно.',
      'Body systems shown in an exploded view — handy for examining each system separately.'
    ),
    parts: [
      T('Skelet', 'Скелет', 'Skeleton'),
      T('Mushaklar', 'Мышцы', 'Muscles'),
      T('Ichki organlar', 'Внутренние органы', 'Internal organs'),
    ],
  },
  {
    id: 'human-anatomy-kylap',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/9306344c4b554268a520c72c0d988b5b/embed',
    title: T('Inson anatomiyasi modeli', 'Модель анатомии человека', 'Human Anatomy'),
    description: T(
      'Umumiy inson anatomiyasi o‘quv modeli.',
      'Общая учебная модель анатомии человека.',
      'A general human anatomy educational model.'
    ),
    parts: [T('Skelet', 'Скелет', 'Skeleton'), T('Organlar', 'Органы', 'Organs')],
  },
  {
    id: 'human-anatomy-glb',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/14191ef860b44925be0e94462c84ffe6/embed',
    title: T('Inson anatomiyasi (GLB)', 'Анатомия человека (GLB)', 'Human Anatomy (GLB)'),
    description: T(
      'Yuklab olinadigan inson anatomiyasi modeli.',
      'Загружаемая модель анатомии человека.',
      'A downloadable human anatomy model.'
    ),
    parts: [T('Skelet', 'Скелет', 'Skeleton'), T('Organlar', 'Органы', 'Organs')],
  },

  // ───────── Female ─────────
  {
    id: 'woman-body-anatomy',
    category: 'Female Anatomy',
    embedUrl: 'https://sketchfab.com/models/b62a790eacba45bba09218f27925c92f/embed',
    title: T('Ayol tanasi anatomiyasi', 'Анатомия женского тела', 'Woman Body Anatomy'),
    description: T(
      'Ayol tanasi anatomiyasi — organlar va asosiy tana tizimlari bilan.',
      'Анатомия женского тела с органами и основными системами.',
      'Female body anatomy with organs and the main body systems.'
    ),
    parts: [
      T('Skelet', 'Скелет', 'Skeleton'),
      T('Ichki organlar', 'Внутренние органы', 'Internal organs'),
      T('Reproduktiv tizim', 'Репродуктивная система', 'Reproductive system'),
    ],
  },
  {
    id: 'internal-anatomy-complete',
    category: 'Internal Organs',
    embedUrl: 'https://sketchfab.com/models/f72003aa4e3f4c83ad1cad616cac48ab/embed',
    title: T('To‘liq ichki anatomiya', 'Полная внутренняя анатомия', 'Complete Internal Anatomy'),
    description: T(
      'Erkak va ayol uchun ko‘p tizimli ichki anatomiya modeli.',
      'Многосистемная модель внутренней анатомии для мужчин и женщин.',
      'A multi-system internal anatomy model for male and female.'
    ),
    parts: [
      T('Yurak', 'Сердце', 'Heart'),
      T('O‘pkalar', 'Лёгкие', 'Lungs'),
      T('Jigar', 'Печень', 'Liver'),
      T('Buyraklar', 'Почки', 'Kidneys'),
      T('Hazm tizimi', 'Пищеварительная система', 'Digestive system'),
    ],
  },

  // ───────── Internal organs ─────────
  {
    id: 'human-organs',
    category: 'Internal Organs',
    embedUrl: 'https://sketchfab.com/models/035316622877438cb62de673b8f19217/embed',
    title: T('Ichki organlar', 'Внутренние органы', 'Human Organs'),
    description: T(
      'Asosiy ichki organlarni ko‘rsatuvchi soddalashtirilgan model.',
      'Упрощённая модель основных внутренних органов.',
      'A simplified model of the main internal organs.'
    ),
    parts: [
      T('Yurak', 'Сердце', 'Heart'),
      T('O‘pkalar', 'Лёгкие', 'Lungs'),
      T('Jigar', 'Печень', 'Liver'),
      T('Oshqozon', 'Желудок', 'Stomach'),
      T('Buyraklar', 'Почки', 'Kidneys'),
    ],
  },
  {
    id: 'human-internal-organs-anatomy',
    category: 'Internal Organs',
    embedUrl: 'https://sketchfab.com/models/8a43f3a308994699a4000b17004d5220/embed',
    title: T('Inson ichki organlari anatomiyasi', 'Анатомия внутренних органов человека', 'Human Internal Organs Anatomy'),
    description: T(
      'Ko‘krak va qorin bo‘shlig‘idagi organlarni batafsil ko‘rsatuvchi anatomik model.',
      'Подробная анатомическая модель органов грудной и брюшной полости.',
      'A detailed anatomical model of the thoracic and abdominal organs.'
    ),
    parts: [
      T('Yurak', 'Сердце', 'Heart'),
      T('O‘pkalar', 'Лёгкие', 'Lungs'),
      T('Hiqildoq', 'Гортань', 'Larynx'),
      T('Traxeya', 'Трахея', 'Trachea'),
      T('Diafragma', 'Диафрагма', 'Diaphragm'),
      T('Buyraklar', 'Почки', 'Kidneys'),
      T('Qovuq', 'Мочевой пузырь', 'Bladder'),
      T('Og‘iz bo‘shlig‘i', 'Ротовая полость', 'Oral cavity'),
      T('Jigar', 'Печень', 'Liver'),
      T('Oshqozon', 'Желудок', 'Stomach'),
      T('Oshqozon osti bezi', 'Поджелудочная железа', 'Pancreas'),
      T('Ichaklar', 'Кишечник', 'Intestines'),
    ],
  },
  {
    id: 'human-anatomy-organs-pack',
    category: 'Internal Organs',
    embedUrl: 'https://sketchfab.com/models/7fd440196fe3480587de330967737848/embed',
    title: T('Organlar anatomiyasi paketi', 'Набор моделей органов', 'Human Anatomy Organs Pack'),
    description: T(
      'Asosiy organlar va ularning kesma ko‘rinishlaridan iborat to‘plam.',
      'Набор основных органов с их моделями в разрезе.',
      'A pack of the main organs including cross-section models.'
    ),
    parts: [
      T('Bosh miya', 'Головной мозг', 'Brain'),
      T('Yurak', 'Сердце', 'Heart'),
      T('Buyrak', 'Почка', 'Kidney'),
      T('Jigar', 'Печень', 'Liver'),
      T('O‘pka', 'Лёгкое', 'Lung'),
      T('Oshqozon', 'Желудок', 'Stomach'),
    ],
  },

  // ───────── Cardiovascular ─────────
  {
    id: 'circulatory-system',
    category: 'Cardiovascular',
    embedUrl: 'https://sketchfab.com/models/6a7a537a71444f6e8201e18a685a013d/embed',
    title: T('Qon aylanish tizimi', 'Кровеносная система', 'Circulatory System'),
    description: T(
      'Tana bo‘ylab qon aylanishini animatsiya bilan ko‘rsatuvchi model.',
      'Модель с анимацией кровообращения по всему телу.',
      'A model with an animation of blood circulation through the body.'
    ),
    parts: [
      T('Yurak', 'Сердце', 'Heart'),
      T('Arteriyalar', 'Артерии', 'Arteries'),
      T('Venalar', 'Вены', 'Veins'),
      T('Aorta', 'Аорта', 'Aorta'),
    ],
  },
  {
    id: 'heart-inside-ribcage',
    category: 'Cardiovascular',
    embedUrl: 'https://sketchfab.com/models/26b5044d922340988cd3d13ca0f0d176/embed',
    title: T('Ko‘krak qafasi ichidagi yurak', 'Сердце внутри грудной клетки', 'Heart Inside Ribcage'),
    description: T(
      'Ko‘krak qafasi ichida urayotgan yurakning vizualizatsiyasi.',
      'Визуализация бьющегося сердца внутри грудной клетки.',
      'A visualization of the beating heart inside the ribcage.'
    ),
    parts: [
      T('Yurak', 'Сердце', 'Heart'),
      T('Qovurg‘alar', 'Рёбра', 'Ribs'),
      T('Ko‘krak qafasi', 'Грудная клетка', 'Ribcage'),
      T('To‘sh suyagi', 'Грудина', 'Sternum'),
    ],
  },
  {
    id: 'internal-heart-anatomy-hh0056',
    category: 'Cardiovascular',
    embedUrl: 'https://sketchfab.com/models/404b19dad89d4ab3aa60d7268c0a47b1/embed',
    title: T('Yurak ichki anatomiyasi', 'Внутренняя анатомия сердца', 'Internal Heart Anatomy'),
    description: T(
      'Haqiqiy donor yurak asosidagi yuqori aniqlikdagi model (~3.4 mln uchburchak). Mobil qurilmada og‘ir.',
      'Высокодетализированная модель на основе реального донорского сердца (~3.4 млн треугольников). Тяжёлая для мобильных.',
      'A high-detail model based on a real donated heart (~3.4M triangles). Heavy on mobile.'
    ),
    parts: [
      T('Qorinchalar', 'Желудочки', 'Ventricles'),
      T('Bo‘lmachalar', 'Предсердия', 'Atria'),
      T('Klapanlar', 'Клапаны', 'Valves'),
      T('Aorta', 'Аорта', 'Aorta'),
      T('Koronar tomirlar', 'Коронарные сосуды', 'Coronary vessels'),
    ],
  },
  {
    id: 'adult-heart-and-lungs',
    category: 'Cardiovascular',
    embedUrl: 'https://sketchfab.com/models/be4465abad5b45529d586b7b07c1afc5/embed',
    title: T('Yurak va o‘pkalar', 'Сердце и лёгкие', 'Adult Heart and Lungs'),
    description: T(
      'Kattalar yuragi va o‘pkalarining birgalikdagi anatomik modeli.',
      'Анатомическая модель сердца и лёгких взрослого человека вместе.',
      'An anatomical model of the adult heart and lungs together.'
    ),
    parts: [
      T('Yurak', 'Сердце', 'Heart'),
      T('O‘pkalar', 'Лёгкие', 'Lungs'),
      T('Traxeya', 'Трахея', 'Trachea'),
      T('Bronxlar', 'Бронхи', 'Bronchi'),
    ],
  },
  {
    id: 'peripheral-artery-disease',
    category: 'Pathology',
    embedUrl: 'https://sketchfab.com/models/0aa072f1bd7e4a768ad08be1db714823/embed',
    title: T('Periferik arteriya kasalligi', 'Заболевание периферических артерий', 'Peripheral Artery Disease'),
    description: T(
      'Torayган arteriyalar va qon oqimining kamayishini ko‘rsatuvchi patologik model.',
      'Патологическая модель, показывающая сужение артерий и снижение кровотока.',
      'A pathology model showing narrowed arteries and reduced blood flow.'
    ),
    parts: [
      T('Arteriya', 'Артерия', 'Artery'),
      T('Atero­sklerotik plaka', 'Атеросклеротическая бляшка', 'Atherosclerotic plaque'),
    ],
  },

  // ───────── Respiratory ─────────
  {
    id: 'human-lungs-devden',
    category: 'Respiratory',
    embedUrl: 'https://sketchfab.com/models/bab4f49aa5ed4f939c8f1cf88732ac0a/embed',
    title: T('Inson o‘pkalari', 'Лёгкие человека', 'Human Lungs'),
    description: T(
      'Realistik inson o‘pkalari modeli — bronxlar va diafragma bilan.',
      'Реалистичная модель лёгких человека с бронхами и диафрагмой.',
      'A realistic human lungs model with bronchi and diaphragm.'
    ),
    parts: [
      T('Chap o‘pka', 'Левое лёгкое', 'Left lung'),
      T('O‘ng o‘pka', 'Правое лёгкое', 'Right lung'),
      T('Bronxlar', 'Бронхи', 'Bronchi'),
      T('Diafragma', 'Диафрагма', 'Diaphragm'),
    ],
  },
  {
    id: 'copd-lung-disease',
    category: 'Pathology',
    embedUrl: 'https://sketchfab.com/models/e659d205ea244328bebc530d614866de/embed',
    title: T('Surunkali obstruktiv o‘pka kasalligi (COPD)', 'ХОБЛ', 'Chronic Obstructive Pulmonary Disease (COPD)'),
    description: T(
      'Sog‘lom va shikastlangan o‘pkani solishtirib ko‘rsatuvchi COPD modeli.',
      'Модель ХОБЛ, сравнивающая здоровое и повреждённое лёгкое.',
      'A COPD model comparing a healthy and a damaged lung.'
    ),
    parts: [
      T('Sog‘lom o‘pka', 'Здоровое лёгкое', 'Healthy lung'),
      T('Shikastlangan o‘pka', 'Повреждённое лёгкое', 'Damaged lung'),
      T('Bronxlar', 'Бронхи', 'Bronchi'),
    ],
  },

  // ───────── Renal pathology ─────────
  {
    id: 'kidney-with-disease',
    category: 'Pathology',
    embedUrl: 'https://sketchfab.com/models/3797127d41634650ada94ac1b1ac6b52/embed',
    title: T('Buyrak kasalligi modeli', 'Модель болезни почки', 'Kidney with Disease'),
    description: T(
      'Bir tomonda sog‘lom, ikkinchi tomonda kasallangan buyrakni ko‘rsatadi.',
      'Показывает здоровую почку с одной стороны и больную с другой.',
      'Shows a healthy kidney on one side and a diseased kidney on the other.'
    ),
    parts: [
      T('Sog‘lom buyrak', 'Здоровая почка', 'Healthy kidney'),
      T('Kasallangan buyrak', 'Больная почка', 'Diseased kidney'),
      T('Buyrak jomi', 'Почечная лоханка', 'Renal pelvis'),
    ],
  },

  // ───────── Skeletal ─────────
  {
    id: 'human-skeleton',
    category: 'Skeletal',
    embedUrl: 'https://sketchfab.com/models/657a31ed9704423c8c4e752fb2506a74/embed',
    title: T('Odam skeleti', 'Скелет человека', 'Human Skeleton'),
    description: T(
      'Yuqori aniqlikdagi to‘liq odam skeleti modeli.',
      'Высокодетализированная модель полного скелета человека.',
      'A high-resolution complete human skeleton model.'
    ),
    parts: [
      T('Bosh suyagi', 'Череп', 'Skull'),
      T('Umurtqa pog‘onasi', 'Позвоночник', 'Spine'),
      T('Qovurg‘alar', 'Рёбра', 'Ribs'),
      T('Chanoq', 'Таз', 'Pelvis'),
      T('Qo‘l-oyoq suyaklari', 'Кости конечностей', 'Limb bones'),
    ],
  },

  // ───────── Muscular ─────────
  {
    id: 'muscle-anatomy',
    category: 'Muscular',
    embedUrl: 'https://sketchfab.com/models/d32f5724fc294048888d03d215b9a1ff/embed',
    title: T('Mushak anatomiyasi', 'Анатомия мышц', 'Muscle Anatomy'),
    description: T(
      'Mushaklar tizimini o‘rganish uchun anatomik model.',
      'Анатомическая модель для изучения мышечной системы.',
      'An anatomical model for studying the muscular system.'
    ),
    parts: [
      T('Yuza mushaklar', 'Поверхностные мышцы', 'Superficial muscles'),
      T('Chuqur mushaklar', 'Глубокие мышцы', 'Deep muscles'),
      T('Paylar', 'Сухожилия', 'Tendons'),
    ],
  },
  {
    id: 'muscle-system-human-body',
    category: 'Muscular',
    embedUrl: 'https://sketchfab.com/models/7ea21567ff9942bf9511e2d99efe85d9/embed',
    title: T('Tanadagi mushak tizimi', 'Мышечная система тела', 'Muscle System in Human Body'),
    description: T(
      'Butun tana mushak tizimini ko‘rsatuvchi o‘quv modeli.',
      'Учебная модель, показывающая мышечную систему всего тела.',
      'An educational model showing the muscular system of the whole body.'
    ),
    parts: [
      T('Bosh va bo‘yin mushaklari', 'Мышцы головы и шеи', 'Head & neck muscles'),
      T('Tana mushaklari', 'Мышцы туловища', 'Trunk muscles'),
      T('Qo‘l-oyoq mushaklari', 'Мышцы конечностей', 'Limb muscles'),
    ],
  },

  // ───────── Skin ─────────
  {
    id: 'skin-anatomy',
    category: 'Dermatology',
    embedUrl: 'https://sketchfab.com/models/56c98c3710d94360a3481dc81aa4910f/embed',
    title: T('Teri anatomiyasi', 'Анатомия кожи', 'Anatomy of the Skin'),
    description: T(
      'Teri qatlamlari va tuzilmalarini ko‘rsatuvchi kesma model.',
      'Модель в разрезе, показывающая слои и структуры кожи.',
      'A cross-section model showing the skin layers and structures.'
    ),
    parts: [
      T('Epidermis', 'Эпидермис', 'Epidermis'),
      T('Derma', 'Дерма', 'Dermis'),
      T('Teri osti yog‘i', 'Подкожная клетчатка', 'Subcutaneous fat'),
      T('Soch follikulasi', 'Волосяной фолликул', 'Hair follicle'),
      T('Ter bezi', 'Потовая железа', 'Sweat gland'),
    ],
  },

  // ───────── Pathology / organs ─────────
  {
    id: 'liver-diseases',
    category: 'Pathology',
    embedUrl: 'https://sketchfab.com/models/693dfd967c524d23aee22c673acb58b1/embed',
    title: T('Jigar kasalliklari', 'Болезни печени', 'Liver Diseases'),
    description: T(
      'Jigarning turli kasalliklarini ko‘rsatuvchi 3D model.',
      '3D-модель, показывающая различные болезни печени.',
      'A 3D model showing various liver diseases.'
    ),
    parts: [
      T('Sog‘lom jigar', 'Здоровая печень', 'Healthy liver'),
      T('Sirroz', 'Цирроз', 'Cirrhosis'),
      T('Yog‘li jigar', 'Жировой гепатоз', 'Fatty liver'),
    ],
  },

  // ───────── ENT / eye / dental ─────────
  {
    id: 'human-ear-anatomy',
    category: 'ENT',
    embedUrl: 'https://sketchfab.com/models/c3e65826b8ac48f9ba472d5a384813ad/embed',
    title: T('Quloq anatomiyasi', 'Анатомия уха', 'Human Ear Anatomy'),
    description: T(
      'Tashqi, o‘rta va ichki quloqni yuqori sifatli teksturalar bilan ko‘rsatuvchi model.',
      'Модель наружного, среднего и внутреннего уха с качественными текстурами.',
      'A model of the outer, middle and inner ear with high-quality textures.'
    ),
    parts: [
      T('Tashqi quloq', 'Наружное ухо', 'Outer ear'),
      T('Quloq pardasi', 'Барабанная перепонка', 'Eardrum'),
      T('O‘rta quloq suyakchalari', 'Слуховые косточки', 'Middle ear ossicles'),
      T('Chig‘anoq (koxlea)', 'Улитка', 'Cochlea'),
      T('Vestibulyar apparat', 'Вестибулярный аппарат', 'Vestibular system'),
    ],
  },
  {
    id: 'diabetes-eye-diseases',
    category: 'Ophthalmology',
    embedUrl: 'https://sketchfab.com/models/24a1efa00d484074b74dd86f06aed55f/embed',
    title: T('Diabetdagi ko‘z kasalliklari', 'Глазные болезни при диабете', 'Diabetes Eye Diseases'),
    description: T(
      'Diabet asoratlari: retinopatiya, katarakta va glaukomani ko‘rsatuvchi belgilangan model.',
      'Размеченная модель осложнений диабета: ретинопатия, катаракта и глаукома.',
      'A labelled model of diabetic complications: retinopathy, cataract and glaucoma.'
    ),
    parts: [
      T('Diabetik retinopatiya', 'Диабетическая ретинопатия', 'Diabetic retinopathy'),
      T('Katarakta', 'Катаракта', 'Cataract'),
      T('Glaukoma', 'Глаукома', 'Glaucoma'),
    ],
  },
  {
    id: 'eye-stargardt-macular-dystrophy',
    category: 'Ophthalmology',
    embedUrl: 'https://sketchfab.com/models/6b48b6cf626a4c04ab1f28b260d92057/embed',
    title: T('Ko‘z anatomiyasi va Stargardt kasalligi', 'Анатомия глаза и болезнь Штаргардта', 'Eye Anatomy with Stargardt Dystrophy'),
    description: T(
      'Makula atrofidagi retinal degeneratsiyani ko‘rsatuvchi ko‘z kesma modeli.',
      'Модель глаза в разрезе с дегенерацией сетчатки вокруг макулы.',
      'A cross-section eye model showing retinal degeneration around the macula.'
    ),
    parts: [
      T('Shox parda', 'Роговица', 'Cornea'),
      T('Gavhar', 'Хрусталик', 'Lens'),
      T('To‘r parda (retina)', 'Сетчатка', 'Retina'),
      T('Makula', 'Макула', 'Macula'),
    ],
  },
  {
    id: 'mandible-djd',
    category: 'Dental',
    embedUrl: 'https://sketchfab.com/models/f86e3f045bb84a32ab4febc83b4ca7f3/embed',
    title: T('Pastki jag‘ degenerativ kasalligi', 'Дегенеративное заболевание нижней челюсти', 'Edentulous Mandible with DJD'),
    description: T(
      'Tishsiz pastki jag‘ va bo‘g‘imning degenerativ kasalligi modeli.',
      'Модель беззубой нижней челюсти с дегенеративным заболеванием сустава.',
      'A model of an edentulous mandible with degenerative joint disease.'
    ),
    parts: [
      T('Pastki jag‘ suyagi', 'Нижняя челюсть', 'Mandible'),
      T('Chakka-pastki jag‘ bo‘g‘imi', 'Височно-нижнечелюстной сустав', 'Temporomandibular joint'),
    ],
  },

  // ───────── Limbs ─────────
  {
    id: 'hand-forearm',
    category: 'Limbs',
    embedUrl: 'https://sketchfab.com/models/463edeaa8db94bbc975e0dce75dcd795/embed',
    title: T('Qo‘l va bilak anatomiyasi', 'Анатомия кисти и предплечья', 'Anatomy of the Hand and Forearm'),
    description: T(
      'Qo‘l va bilakning suyak, mushak va paylarini ko‘rsatuvchi anatomik model.',
      'Анатомическая модель костей, мышц и сухожилий кисти и предплечья.',
      'An anatomical model of the bones, muscles and tendons of the hand and forearm.'
    ),
    parts: [
      T('Bilak suyaklari', 'Кости предплечья', 'Forearm bones'),
      T('Kaft suyaklari', 'Кости кисти', 'Hand bones'),
      T('Mushaklar', 'Мышцы', 'Muscles'),
      T('Paylar', 'Сухожилия', 'Tendons'),
    ],
  },
]
