/**
 * 3D anatomy model catalog (Sketchfab embeds).
 *
 * Each model is shown through an embedded iframe with the Sketchfab UI stripped
 * down via embed parameters (no toolbar, annotations, info, hint, AR/VR, etc.)
 * so the viewer feels native to the platform. `buildEmbedSrc()` appends those
 * params consistently.
 *
 * NOTE: the small Sketchfab logo/attribution cannot be fully removed for models
 * you do not own — that is a Sketchfab requirement. The params below hide every
 * other UI control; the remaining mark is minimized in the viewer chrome.
 */

export interface AnatomyModel {
  id: string
  titleUz: string
  titleEn: string
  category: string
  embedUrl: string
  note?: string
}

// Embed UI flags: hide as much chrome as the platform allows.
const EMBED_PARAMS: Record<string, string> = {
  autostart: '1',
  preload: '1',
  transparent: '1',
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
  ui_annotations: '0',
  ui_loading: '0',
  ui_inspector: '0',
  dnt: '1',
  scrollwheel: '1',
}

/** Build a cleaned embed URL with the UI-suppressing query params appended. */
export function buildEmbedSrc(embedUrl: string): string {
  const qs = Object.entries(EMBED_PARAMS).map(([k, v]) => `${k}=${v}`).join('&')
  const sep = embedUrl.includes('?') ? '&' : '?'
  return `${embedUrl}${sep}${qs}`
}

export const ANATOMY_CATEGORIES = [
  'Barchasi',
  'Full Body',
  'Internal Organs',
  'Internal Anatomy',
  'Cardiovascular System',
  'Skeletal System',
  'Muscular System',
  'Female Anatomy',
  'Dermatology',
  'Pathology',
  'Ophthalmology',
  'Dental / Pathology',
  'Upper Limb',
] as const

export const ANATOMY_MODELS: AnatomyModel[] = [
  {
    id: 'full-human-body-anatomy',
    titleUz: 'To‘liq odam anatomiyasi',
    titleEn: 'Animated Full Human Body Anatomy',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/9b0b079953b840bc9a13f524b60041e4/embed',
    note: 'Skelet, miya, hazm tizimi, o‘pka, yurak, siydik tizimi, jigar, qon aylanish, teri, mushaklar',
  },
  {
    id: 'human-skeleton',
    titleUz: 'Odam skeleti',
    titleEn: 'Human Skeleton High-resolution Model',
    category: 'Skeletal System',
    embedUrl: 'https://sketchfab.com/models/657a31ed9704423c8c4e752fb2506a74/embed',
    note: 'To‘liq odam skeleti',
  },
  {
    id: 'male-full-body-anatomy',
    titleUz: 'Erkak tanasi anatomiyasi',
    titleEn: 'Male Full Body Anatomy',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/1688cedcfb3b4f3ea7a03e3a3e34bdd8/embed',
    note: 'Erkak tanasi anatomiyasi',
  },
  {
    id: 'human-organs',
    titleUz: 'Ichki organlar',
    titleEn: 'Human Organs',
    category: 'Internal Organs',
    embedUrl: 'https://sketchfab.com/models/035316622877438cb62de673b8f19217/embed',
    note: 'Ichki organlar modeli',
  },
  {
    id: 'animated-human-body',
    titleUz: 'Animatsiyali odam anatomiyasi',
    titleEn: 'Animated Human Body Anatomy',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/51ebbf617d4f4faeb099d70336e13a58/embed',
    note: 'Animatsiyali skelet, miya, hazm tizimi, o‘pka, yurak va organlar',
  },
  {
    id: 'circulatory-system',
    titleUz: 'Qon aylanish tizimi',
    titleEn: 'Animated Human Body with Circulatory System',
    category: 'Cardiovascular System',
    embedUrl: 'https://sketchfab.com/models/6a7a537a71444f6e8201e18a685a013d/embed',
    note: 'Animatsiyali qon aylanish tizimi bilan tana',
  },
  {
    id: 'woman-body-anatomy',
    titleUz: 'Ayol tanasi anatomiyasi',
    titleEn: 'Animated Woman Body Anatomy',
    category: 'Female Anatomy',
    embedUrl: 'https://sketchfab.com/models/b62a790eacba45bba09218f27925c92f/embed',
    note: 'Ayol anatomiyasi: organlar va tana tizimlari',
  },
  {
    id: 'internal-anatomy-complete',
    titleUz: 'To‘liq ichki anatomiya',
    titleEn: 'Male/Female Internal Anatomy (Medical)',
    category: 'Internal Anatomy',
    embedUrl: 'https://sketchfab.com/models/f72003aa4e3f4c83ad1cad616cac48ab/embed',
    note: 'Ko‘p tizimli ichki anatomiya',
  },
  {
    id: 'muscle-anatomy',
    titleUz: 'Mushak anatomiyasi',
    titleEn: 'Muscle Anatomy',
    category: 'Muscular System',
    embedUrl: 'https://sketchfab.com/models/d32f5724fc294048888d03d215b9a1ff/embed',
    note: 'Mushaklar anatomiyasi',
  },
  {
    id: 'skin-anatomy',
    titleUz: 'Teri anatomiyasi',
    titleEn: 'Anatomy of the Skin',
    category: 'Dermatology',
    embedUrl: 'https://sketchfab.com/models/56c98c3710d94360a3481dc81aa4910f/embed',
    note: 'Teri qatlamlari anatomiyasi',
  },
  {
    id: 'liver-diseases',
    titleUz: 'Jigar kasalliklari',
    titleEn: '3D Liver Diseases',
    category: 'Pathology',
    embedUrl: 'https://sketchfab.com/models/693dfd967c524d23aee22c673acb58b1/embed',
    note: 'Jigar kasalliklari modeli',
  },
  {
    id: 'diabetes-eye-diseases',
    titleUz: 'Diabetdagi ko‘z kasalliklari',
    titleEn: 'Diabetes Eye Diseases (Labelled)',
    category: 'Ophthalmology',
    embedUrl: 'https://sketchfab.com/models/24a1efa00d484074b74dd86f06aed55f/embed',
    note: 'Diabetik retinopatiya, katarakta, glaukoma',
  },
  {
    id: 'mandible-djd',
    titleUz: 'Pastki jag‘ degenerativ kasalligi',
    titleEn: 'Edentulous Mandible with DJD',
    category: 'Dental / Pathology',
    embedUrl: 'https://sketchfab.com/models/f86e3f045bb84a32ab4febc83b4ca7f3/embed',
    note: 'Bo‘g‘imning degenerativ kasalligi',
  },
  {
    id: 'hand-forearm',
    titleUz: 'Qo‘l va bilak anatomiyasi',
    titleEn: 'Anatomy of the Hand and Forearm',
    category: 'Upper Limb',
    embedUrl: 'https://sketchfab.com/models/463edeaa8db94bbc975e0dce75dcd795/embed',
    note: 'Qo‘l va bilak anatomiyasi',
  },
  {
    id: 'full-body-anatomy-general',
    titleUz: 'Umumiy tana anatomiyasi',
    titleEn: 'Full Body Anatomy',
    category: 'Full Body',
    embedUrl: 'https://sketchfab.com/models/e6899d35dd0741daa94a8a4e7bde1e99/embed',
    note: 'Skelet, miya, yurak, mushak, jigar, o‘pka, umurtqa, qon aylanish va hazm tizimi',
  },
]
