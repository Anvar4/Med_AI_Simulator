/**
 * Medical organ catalog for the procedural 3D simulator (no external API).
 * Each organ has clickable parts; each part carries localized name, description,
 * physiology, pathology and related diseases. The 3D geometry is built in code
 * by components/simulator/OrganModels.tsx, keyed by `organ.model`.
 */
import type { Locale } from './i18n'

export type OrganCategory = 'cardiovascular' | 'respiratory' | 'digestive' | 'nervous' | 'urinary' | 'endocrine' | 'skeletal'

export interface LocalizedText {
  uz: string
  ru: string
  en: string
}

export interface OrganPart {
  id: string                 // matches a mesh name in the 3D model
  color: string              // base material color (hex)
  name: LocalizedText
  description: LocalizedText
  physiology: LocalizedText
  pathology: LocalizedText
  diseases: LocalizedText    // comma-separated related diseases
}

export interface Organ {
  key: string
  model: string              // which procedural model component to render
  category: OrganCategory
  name: LocalizedText
  summary: LocalizedText
  parts: OrganPart[]
}

export const ORGAN_CATEGORIES: { value: OrganCategory | 'all'; label: LocalizedText }[] = [
  { value: 'all', label: { uz: 'Barchasi', ru: 'Все', en: 'All' } },
  { value: 'cardiovascular', label: { uz: 'Yurak-tomir', ru: 'Сердечно-сосудистая', en: 'Cardiovascular' } },
  { value: 'respiratory', label: { uz: 'Nafas', ru: 'Дыхательная', en: 'Respiratory' } },
  { value: 'digestive', label: { uz: 'Hazm', ru: 'Пищеварительная', en: 'Digestive' } },
  { value: 'nervous', label: { uz: 'Asab', ru: 'Нервная', en: 'Nervous' } },
  { value: 'urinary', label: { uz: 'Siydik', ru: 'Мочевая', en: 'Urinary' } },
  { value: 'endocrine', label: { uz: 'Endokrin', ru: 'Эндокринная', en: 'Endocrine' } },
  { value: 'skeletal', label: { uz: 'Skelet', ru: 'Скелетная', en: 'Skeletal' } },
]

export function tl(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.uz
}

export const ORGANS: Organ[] = [
  // ─── HEART ───────────────────────────────────────────────────
  {
    key: 'heart',
    model: 'heart',
    category: 'cardiovascular',
    name: { uz: 'Yurak', ru: 'Сердце', en: 'Heart' },
    summary: {
      uz: "Qonni butun tana bo'ylab haydovchi mushak a'zo. To'rt kameradan iborat.",
      ru: 'Мышечный орган, перекачивающий кровь по всему телу. Состоит из четырёх камер.',
      en: 'A muscular organ that pumps blood throughout the body. It has four chambers.',
    },
    parts: [
      {
        id: 'left-ventricle', color: '#b3322f',
        name: { uz: 'Chap qorincha', ru: 'Левый желудочек', en: 'Left ventricle' },
        description: {
          uz: "Yurakning eng kuchli kamerasi; oksigenlangan qonni aortaga haydaydi.",
          ru: 'Самая мощная камера сердца; выталкивает оксигенированную кровь в аорту.',
          en: 'The strongest chamber; pumps oxygenated blood into the aorta.',
        },
        physiology: {
          uz: "Sistola paytida qisqarib, qonni katta qon aylanish doirasiga yuboradi.",
          ru: 'Во время систолы сокращается, направляя кровь в большой круг кровообращения.',
          en: 'During systole it contracts, sending blood into the systemic circulation.',
        },
        pathology: {
          uz: "Gipertrofiya, miokard infarkti va yurak yetishmovchiligi ko'p uchraydi.",
          ru: 'Часто встречаются гипертрофия, инфаркт миокарда и сердечная недостаточность.',
          en: 'Hypertrophy, myocardial infarction and heart failure are common here.',
        },
        diseases: {
          uz: 'Yurak yetishmovchiligi, miokard infarkti, gipertrofiya',
          ru: 'Сердечная недостаточность, инфаркт миокарда, гипертрофия',
          en: 'Heart failure, myocardial infarction, hypertrophy',
        },
      },
      {
        id: 'right-ventricle', color: '#c25450',
        name: { uz: "O'ng qorincha", ru: 'Правый желудочек', en: 'Right ventricle' },
        description: {
          uz: "Venoz qonni o'pka arteriyasi orqali o'pkaga haydaydi.",
          ru: 'Перекачивает венозную кровь в лёгкие через лёгочную артерию.',
          en: 'Pumps venous blood to the lungs via the pulmonary artery.',
        },
        physiology: {
          uz: "Kichik qon aylanish doirasiga past bosim bilan qon yuboradi.",
          ru: 'Направляет кровь в малый круг кровообращения под низким давлением.',
          en: 'Sends blood into the pulmonary circulation at low pressure.',
        },
        pathology: {
          uz: "O'pka gipertenziyasida o'ng qorincha yetishmovchiligi rivojlanadi.",
          ru: 'При лёгочной гипертензии развивается правожелудочковая недостаточность.',
          en: 'Pulmonary hypertension leads to right ventricular failure.',
        },
        diseases: {
          uz: "O'pka yuragi, o'ng qorincha yetishmovchiligi",
          ru: 'Лёгочное сердце, правожелудочковая недостаточность',
          en: 'Cor pulmonale, right heart failure',
        },
      },
      {
        id: 'left-atrium', color: '#9c4a6e',
        name: { uz: "Chap bo'lmacha", ru: 'Левое предсердие', en: 'Left atrium' },
        description: {
          uz: "O'pka venalaridan oksigenlangan qonni qabul qiladi.",
          ru: 'Принимает оксигенированную кровь из лёгочных вен.',
          en: 'Receives oxygenated blood from the pulmonary veins.',
        },
        physiology: {
          uz: "Qonni mitral klapan orqali chap qorinchaga uzatadi.",
          ru: 'Передаёт кровь в левый желудочек через митральный клапан.',
          en: 'Passes blood to the left ventricle through the mitral valve.',
        },
        pathology: {
          uz: "Bo'lmachalar fibrillyatsiyasi va kengayishi ko'p uchraydi.",
          ru: 'Часто встречаются фибрилляция предсердий и их расширение.',
          en: 'Atrial fibrillation and dilation are common.',
        },
        diseases: {
          uz: "Bo'lmachalar fibrillyatsiyasi, mitral stenoz",
          ru: 'Фибрилляция предсердий, митральный стеноз',
          en: 'Atrial fibrillation, mitral stenosis',
        },
      },
      {
        id: 'right-atrium', color: '#a85d57',
        name: { uz: "O'ng bo'lmacha", ru: 'Правое предсердие', en: 'Right atrium' },
        description: {
          uz: "Tana venalaridan kelgan venoz qonni qabul qiladi. Sinus tuguni shu yerda.",
          ru: 'Принимает венозную кровь из вен тела. Здесь находится синусовый узел.',
          en: 'Receives venous blood from the body. Contains the sinoatrial node.',
        },
        physiology: {
          uz: "Yurak ritmini boshqaruvchi sinus tugunini saqlaydi.",
          ru: 'Содержит синусовый узел, задающий ритм сердца.',
          en: 'Holds the SA node, the heart\'s natural pacemaker.',
        },
        pathology: {
          uz: "Sinus tuguni disfunksiyasi bradikardiya keltirib chiqaradi.",
          ru: 'Дисфункция синусового узла вызывает брадикардию.',
          en: 'SA node dysfunction causes bradycardia.',
        },
        diseases: {
          uz: 'Sinus tuguni sindromi, bradikardiya',
          ru: 'Синдром слабости синусового узла, брадикардия',
          en: 'Sick sinus syndrome, bradycardia',
        },
      },
      {
        id: 'aorta', color: '#d98880',
        name: { uz: 'Aorta', ru: 'Аорта', en: 'Aorta' },
        description: {
          uz: "Tanadagi eng katta arteriya; chap qorinchadan qon chiqadi.",
          ru: 'Самая крупная артерия тела; выходит из левого желудочка.',
          en: 'The largest artery; arises from the left ventricle.',
        },
        physiology: {
          uz: "Oksigenlangan qonni butun tanaga taqsimlaydi.",
          ru: 'Распределяет оксигенированную кровь по всему телу.',
          en: 'Distributes oxygenated blood to the whole body.',
        },
        pathology: {
          uz: "Aorta anevrizmasi va atgetoskleroz xavfli holatlar.",
          ru: 'Аневризма аорты и атеросклероз — опасные состояния.',
          en: 'Aortic aneurysm and atherosclerosis are dangerous conditions.',
        },
        diseases: {
          uz: 'Aorta anevrizmasi, ateroskleroz, dissektsiya',
          ru: 'Аневризма аорты, атеросклероз, расслоение',
          en: 'Aortic aneurysm, atherosclerosis, dissection',
        },
      },
    ],
  },

  // ─── LUNGS ───────────────────────────────────────────────────
  {
    key: 'lungs',
    model: 'lungs',
    category: 'respiratory',
    name: { uz: "O'pka", ru: 'Лёгкие', en: 'Lungs' },
    summary: {
      uz: "Gaz almashinuvini ta'minlovchi juft a'zo: kislorod qabul qilib, karbonat angidridni chiqaradi.",
      ru: 'Парный орган газообмена: поглощает кислород и выделяет углекислый газ.',
      en: 'A paired organ of gas exchange: takes in oxygen and releases carbon dioxide.',
    },
    parts: [
      {
        id: 'left-lung', color: '#d98aa0',
        name: { uz: "Chap o'pka", ru: 'Левое лёгкое', en: 'Left lung' },
        description: {
          uz: "Ikki bo'lakdan iborat; yurak uchun joy qoldiradi (yurak o'ymasi).",
          ru: 'Состоит из двух долей; имеет сердечную вырезку.',
          en: 'Has two lobes; contains the cardiac notch for the heart.',
        },
        physiology: {
          uz: "Alveolalar orqali qonga kislorod o'tkazadi.",
          ru: 'Передаёт кислород в кровь через альвеолы.',
          en: 'Transfers oxygen to the blood through the alveoli.',
        },
        pathology: {
          uz: "Pnevmoniya, bronxit va o'pka shishi rivojlanishi mumkin.",
          ru: 'Могут развиваться пневмония, бронхит и отёк лёгких.',
          en: 'Pneumonia, bronchitis and pulmonary edema may develop.',
        },
        diseases: {
          uz: 'Pnevmoniya, astma, XOBL, o\'pka raki',
          ru: 'Пневмония, астма, ХОБЛ, рак лёгкого',
          en: 'Pneumonia, asthma, COPD, lung cancer',
        },
      },
      {
        id: 'right-lung', color: '#e0a0b4',
        name: { uz: "O'ng o'pka", ru: 'Правое лёгкое', en: 'Right lung' },
        description: {
          uz: "Uch bo'lakdan iborat; chap o'pkadan kattaroq.",
          ru: 'Состоит из трёх долей; больше левого лёгкого.',
          en: 'Has three lobes; larger than the left lung.',
        },
        physiology: {
          uz: "Nafas olishning katta qismini ta'minlaydi.",
          ru: 'Обеспечивает большую часть дыхания.',
          en: 'Provides the larger share of breathing.',
        },
        pathology: {
          uz: "Aspiratsion pnevmoniya ko'pincha o'ng o'pkada uchraydi.",
          ru: 'Аспирационная пневмония чаще возникает в правом лёгком.',
          en: 'Aspiration pneumonia more often affects the right lung.',
        },
        diseases: {
          uz: 'Pnevmoniya, tuberkulyoz, plevrit',
          ru: 'Пневмония, туберкулёз, плеврит',
          en: 'Pneumonia, tuberculosis, pleurisy',
        },
      },
      {
        id: 'trachea', color: '#cdd6dd',
        name: { uz: 'Traxeya (kekirdak)', ru: 'Трахея', en: 'Trachea' },
        description: {
          uz: "Havoni hiqildoqdan bronxlarga olib boruvchi naysimon yo'l.",
          ru: 'Трубчатый путь, проводящий воздух от гортани к бронхам.',
          en: 'A tube carrying air from the larynx to the bronchi.',
        },
        physiology: {
          uz: "Tog'ay halqalari yordamida ochiq turadi va havoni filtrlaydi.",
          ru: 'Поддерживается хрящевыми кольцами и фильтрует воздух.',
          en: 'Kept open by cartilage rings and filters incoming air.',
        },
        pathology: {
          uz: "Traxeit va obstruksiya nafas olishni qiyinlashtiradi.",
          ru: 'Трахеит и обструкция затрудняют дыхание.',
          en: 'Tracheitis and obstruction impair breathing.',
        },
        diseases: {
          uz: 'Traxeit, traxeya stenozi',
          ru: 'Трахеит, стеноз трахеи',
          en: 'Tracheitis, tracheal stenosis',
        },
      },
      {
        id: 'bronchi', color: '#b9c4cc',
        name: { uz: 'Bronxlar', ru: 'Бронхи', en: 'Bronchi' },
        description: {
          uz: "Traxeyadan tarmoqlanib, har bir o'pkaga havo olib boradi.",
          ru: 'Ответвляются от трахеи и подводят воздух к каждому лёгкому.',
          en: 'Branch from the trachea and deliver air to each lung.',
        },
        physiology: {
          uz: "Havoni alveolalargacha bo'lgan mayda yo'llarga taqsimlaydi.",
          ru: 'Распределяют воздух по мелким путям вплоть до альвеол.',
          en: 'Distribute air down to the smallest airways and alveoli.',
        },
        pathology: {
          uz: "Bronxit va astmada bronxlar torayadi.",
          ru: 'При бронхите и астме бронхи сужаются.',
          en: 'In bronchitis and asthma the bronchi narrow.',
        },
        diseases: {
          uz: 'Bronxit, astma, bronxoektaz',
          ru: 'Бронхит, астма, бронхоэктазы',
          en: 'Bronchitis, asthma, bronchiectasis',
        },
      },
    ],
  },

  // ─── LIVER ───────────────────────────────────────────────────
  {
    key: 'liver',
    model: 'liver',
    category: 'digestive',
    name: { uz: 'Jigar', ru: 'Печень', en: 'Liver' },
    summary: {
      uz: "Eng katta ichki bez: zaharsizlantirish, o't suyuqligi ishlab chiqarish va moddalar almashinuvini boshqaradi.",
      ru: 'Самая крупная железа: детоксикация, выработка желчи и регуляция обмена веществ.',
      en: 'The largest gland: detoxification, bile production and metabolism regulation.',
    },
    parts: [
      {
        id: 'right-lobe', color: '#7b4b3a',
        name: { uz: "O'ng bo'lak", ru: 'Правая доля', en: 'Right lobe' },
        description: {
          uz: "Jigarning eng katta qismi; metabolik funksiyalarning asosiy o'rni.",
          ru: 'Самая крупная часть печени; основное место метаболизма.',
          en: 'The largest part; the main site of metabolic activity.',
        },
        physiology: {
          uz: "Oqsil sintezi, glikogen saqlash va detoksifikatsiyani amalga oshiradi.",
          ru: 'Осуществляет синтез белков, хранение гликогена и детоксикацию.',
          en: 'Performs protein synthesis, glycogen storage and detoxification.',
        },
        pathology: {
          uz: "Gepatit, sirroz va jigar raki ko'p uchraydi.",
          ru: 'Часто встречаются гепатит, цирроз и рак печени.',
          en: 'Hepatitis, cirrhosis and liver cancer are common.',
        },
        diseases: {
          uz: 'Gepatit, sirroz, jigar raki, yog\'li jigar',
          ru: 'Гепатит, цирроз, рак печени, жировой гепатоз',
          en: 'Hepatitis, cirrhosis, liver cancer, fatty liver',
        },
      },
      {
        id: 'left-lobe', color: '#8a5544',
        name: { uz: "Chap bo'lak", ru: 'Левая доля', en: 'Left lobe' },
        description: {
          uz: "O'ng bo'lakdan kichikroq; oshqozon ustida joylashgan.",
          ru: 'Меньше правой доли; расположена над желудком.',
          en: 'Smaller than the right lobe; lies over the stomach.',
        },
        physiology: {
          uz: "O't suyuqligi ishlab chiqarishda ishtirok etadi.",
          ru: 'Участвует в выработке желчи.',
          en: 'Participates in bile production.',
        },
        pathology: {
          uz: "Steatoz va fokal o'zgarishlar uchrashi mumkin.",
          ru: 'Возможны стеатоз и очаговые изменения.',
          en: 'Steatosis and focal lesions may occur.',
        },
        diseases: {
          uz: 'Steatoz, jigar kistasi',
          ru: 'Стеатоз, киста печени',
          en: 'Steatosis, hepatic cyst',
        },
      },
      {
        id: 'gallbladder', color: '#5f7d3a',
        name: { uz: "O't pufagi", ru: 'Жёлчный пузырь', en: 'Gallbladder' },
        description: {
          uz: "O't suyuqligini saqlovchi va to'plovchi kichik a'zo.",
          ru: 'Небольшой орган, накапливающий и хранящий желчь.',
          en: 'A small organ that stores and concentrates bile.',
        },
        physiology: {
          uz: "Ovqat hazm qilishda yog'larni emulsiyalovchi o't suyuqligini chiqaradi.",
          ru: 'Выделяет желчь для эмульгирования жиров при пищеварении.',
          en: 'Releases bile to emulsify fats during digestion.',
        },
        pathology: {
          uz: "O't tosh kasalligi va xolesistit eng ko'p uchraydi.",
          ru: 'Чаще всего встречаются желчнокаменная болезнь и холецистит.',
          en: 'Gallstones and cholecystitis are most common.',
        },
        diseases: {
          uz: "O't tosh kasalligi, xolesistit",
          ru: 'Желчнокаменная болезнь, холецистит',
          en: 'Gallstones, cholecystitis',
        },
      },
    ],
  },

  // ─── KIDNEYS ─────────────────────────────────────────────────
  {
    key: 'kidney',
    model: 'kidney',
    category: 'urinary',
    name: { uz: 'Buyrak', ru: 'Почка', en: 'Kidney' },
    summary: {
      uz: "Qonni filtrlovchi va siydik hosil qiluvchi juft a'zo; suv-tuz balansini boshqaradi.",
      ru: 'Парный орган, фильтрующий кровь и образующий мочу; регулирует водно-солевой баланс.',
      en: 'A paired organ that filters blood and forms urine; regulates fluid balance.',
    },
    parts: [
      {
        id: 'cortex', color: '#9b5a4a',
        name: { uz: "Po'stloq (korteks)", ru: 'Корковое вещество', en: 'Cortex' },
        description: {
          uz: "Buyrakning tashqi qatlami; nefronlarning koptokchalari shu yerda.",
          ru: 'Наружный слой почки; здесь расположены клубочки нефронов.',
          en: 'The outer layer; contains the glomeruli of the nephrons.',
        },
        physiology: {
          uz: "Qonni filtrlash birinchi bosqichda shu yerda boshlanadi.",
          ru: 'Фильтрация крови начинается именно здесь.',
          en: 'Blood filtration begins here in the glomeruli.',
        },
        pathology: {
          uz: "Glomerulonefrit po'stloq nefronlarini shikastlaydi.",
          ru: 'Гломерулонефрит повреждает нефроны коркового слоя.',
          en: 'Glomerulonephritis damages cortical nephrons.',
        },
        diseases: {
          uz: 'Glomerulonefrit, surunkali buyrak kasalligi',
          ru: 'Гломерулонефрит, хроническая болезнь почек',
          en: 'Glomerulonephritis, chronic kidney disease',
        },
      },
      {
        id: 'medulla', color: '#b06b58',
        name: { uz: "Mag'iz (medulla)", ru: 'Мозговое вещество', en: 'Medulla' },
        description: {
          uz: "Ichki qatlam; buyrak piramidalaridan iborat.",
          ru: 'Внутренний слой; состоит из почечных пирамид.',
          en: 'The inner layer; made of renal pyramids.',
        },
        physiology: {
          uz: "Siydikni konsentratsiyalashda muhim rol o'ynaydi.",
          ru: 'Играет ключевую роль в концентрировании мочи.',
          en: 'Plays a key role in concentrating urine.',
        },
        pathology: {
          uz: "Piyelonefrit va medulla nekrozi xavfli holatlar.",
          ru: 'Пиелонефрит и некроз сосочков — опасные состояния.',
          en: 'Pyelonephritis and papillary necrosis are serious.',
        },
        diseases: {
          uz: 'Piyelonefrit, buyrak toshi',
          ru: 'Пиелонефрит, камни почек',
          en: 'Pyelonephritis, kidney stones',
        },
      },
      {
        id: 'renal-pelvis', color: '#caa07a',
        name: { uz: 'Buyrak jomi', ru: 'Почечная лоханка', en: 'Renal pelvis' },
        description: {
          uz: "Siydikni to'plab, siydik nayiga uzatuvchi voronkasimon bo'shliq.",
          ru: 'Воронкообразная полость, собирающая мочу и передающая её в мочеточник.',
          en: 'A funnel that collects urine and passes it to the ureter.',
        },
        physiology: {
          uz: "Hosil bo'lgan siydikni qovuq tomon yo'naltiradi.",
          ru: 'Направляет образовавшуюся мочу к мочевому пузырю.',
          en: 'Channels formed urine toward the bladder.',
        },
        pathology: {
          uz: "Toshlar jomda tiqilib, gidronefroz keltirib chiqaradi.",
          ru: 'Камни могут застрять в лоханке, вызывая гидронефроз.',
          en: 'Stones may lodge here causing hydronephrosis.',
        },
        diseases: {
          uz: 'Gidronefroz, buyrak toshi',
          ru: 'Гидронефроз, камни почек',
          en: 'Hydronephrosis, kidney stones',
        },
      },
    ],
  },

  // ─── BRAIN ───────────────────────────────────────────────────
  {
    key: 'brain',
    model: 'brain',
    category: 'nervous',
    name: { uz: 'Bosh miya', ru: 'Головной мозг', en: 'Brain' },
    summary: {
      uz: "Markaziy asab tizimining boshqaruv markazi: fikrlash, harakat va sezgini boshqaradi.",
      ru: 'Управляющий центр ЦНС: контролирует мышление, движение и чувства.',
      en: 'The control center of the CNS: governs thought, movement and sensation.',
    },
    parts: [
      {
        id: 'cerebrum', color: '#c79bb0',
        name: { uz: 'Katta yarim sharlar', ru: 'Большой мозг', en: 'Cerebrum' },
        description: {
          uz: "Miyaning eng katta qismi; ong, xotira va ixtiyoriy harakatlar markazi.",
          ru: 'Самая крупная часть мозга; центр сознания, памяти и движений.',
          en: 'The largest part; center of consciousness, memory and movement.',
        },
        physiology: {
          uz: "Po'stloq orqali yuqori asabiy faoliyatni ta'minlaydi.",
          ru: 'Через кору обеспечивает высшую нервную деятельность.',
          en: 'Supports higher functions through the cerebral cortex.',
        },
        pathology: {
          uz: "Insult, o'sma va Alzheimer kasalligi shu yerda namoyon bo'ladi.",
          ru: 'Инсульт, опухоли и болезнь Альцгеймера проявляются здесь.',
          en: 'Stroke, tumors and Alzheimer\'s manifest here.',
        },
        diseases: {
          uz: 'Insult, Alzheimer, miya o\'smasi, epilepsiya',
          ru: 'Инсульт, Альцгеймер, опухоль мозга, эпилепсия',
          en: 'Stroke, Alzheimer\'s, brain tumor, epilepsy',
        },
      },
      {
        id: 'cerebellum', color: '#a87d92',
        name: { uz: 'Miyacha', ru: 'Мозжечок', en: 'Cerebellum' },
        description: {
          uz: "Harakatlar muvofiqligi va muvozanatni boshqaruvchi qism.",
          ru: 'Контролирует координацию движений и равновесие.',
          en: 'Controls movement coordination and balance.',
        },
        physiology: {
          uz: "Aniq harakatlarni nozik sozlaydi va vaziyatni saqlaydi.",
          ru: 'Точно настраивает движения и поддерживает позу.',
          en: 'Fine-tunes precise movements and maintains posture.',
        },
        pathology: {
          uz: "Shikastlanishi ataksiya va muvozanat buzilishiga olib keladi.",
          ru: 'Поражение приводит к атаксии и нарушению равновесия.',
          en: 'Damage causes ataxia and balance disorders.',
        },
        diseases: {
          uz: 'Ataksiya, miyacha o\'smasi',
          ru: 'Атаксия, опухоль мозжечка',
          en: 'Ataxia, cerebellar tumor',
        },
      },
      {
        id: 'brainstem', color: '#d8b89a',
        name: { uz: 'Miya ustuni', ru: 'Ствол мозга', en: 'Brainstem' },
        description: {
          uz: "Hayotiy muhim markazlar: nafas, yurak urishi va qon bosimi.",
          ru: 'Жизненно важные центры: дыхание, сердцебиение и давление.',
          en: 'Vital centers: breathing, heartbeat and blood pressure.',
        },
        physiology: {
          uz: "Bosh miya va orqa miya o'rtasida signal o'tkazadi.",
          ru: 'Проводит сигналы между головным и спинным мозгом.',
          en: 'Relays signals between the brain and spinal cord.',
        },
        pathology: {
          uz: "Shikastlanishi hayot uchun xavfli, koma keltirib chiqaradi.",
          ru: 'Повреждение опасно для жизни, может вызвать кому.',
          en: 'Injury is life-threatening and may cause coma.',
        },
        diseases: {
          uz: 'Miya ustuni insulti, lokin-in sindromi',
          ru: 'Инсульт ствола, синдром запертого человека',
          en: 'Brainstem stroke, locked-in syndrome',
        },
      },
    ],
  },

  // ─── STOMACH ─────────────────────────────────────────────────
  {
    key: 'stomach',
    model: 'stomach',
    category: 'digestive',
    name: { uz: 'Oshqozon', ru: 'Желудок', en: 'Stomach' },
    summary: {
      uz: "Ovqatni kislota va fermentlar bilan parchalovchi mushak a'zo.",
      ru: 'Мышечный орган, расщепляющий пищу кислотой и ферментами.',
      en: 'A muscular organ that breaks down food with acid and enzymes.',
    },
    parts: [
      {
        id: 'fundus', color: '#c98a6a',
        name: { uz: 'Tub (fundus)', ru: 'Дно (фундус)', en: 'Fundus' },
        description: {
          uz: "Oshqozonning yuqori qismi; gaz va ovqat vaqtincha to'planadi.",
          ru: 'Верхняя часть желудка; временно накапливает газ и пищу.',
          en: 'The upper part; temporarily holds gas and food.',
        },
        physiology: {
          uz: "Ovqatni saqlaydi va sekin aralashtiradi.",
          ru: 'Удерживает пищу и медленно перемешивает её.',
          en: 'Stores food and mixes it slowly.',
        },
        pathology: {
          uz: "Fundus gastriti va o'smalar uchrashi mumkin.",
          ru: 'Возможны гастрит дна и опухоли.',
          en: 'Fundic gastritis and tumors may occur.',
        },
        diseases: {
          uz: 'Gastrit, oshqozon o\'smasi',
          ru: 'Гастрит, опухоль желудка',
          en: 'Gastritis, gastric tumor',
        },
      },
      {
        id: 'body', color: '#d89a78',
        name: { uz: 'Tana', ru: 'Тело', en: 'Body' },
        description: {
          uz: "Asosiy hazm qismi; xlorid kislota va pepsin ishlab chiqaradi.",
          ru: 'Основная часть пищеварения; вырабатывает соляную кислоту и пепсин.',
          en: 'The main digestive part; secretes HCl and pepsin.',
        },
        physiology: {
          uz: "Ovqatni kimyoviy va mexanik parchalaydi.",
          ru: 'Расщепляет пищу химически и механически.',
          en: 'Breaks food down chemically and mechanically.',
        },
        pathology: {
          uz: "Yara kasalligi va H. pylori infeksiyasi tarqalgan.",
          ru: 'Распространены язвенная болезнь и инфекция H. pylori.',
          en: 'Peptic ulcer and H. pylori infection are common.',
        },
        diseases: {
          uz: 'Oshqozon yarasi, H. pylori, gastrit',
          ru: 'Язва желудка, H. pylori, гастрит',
          en: 'Gastric ulcer, H. pylori, gastritis',
        },
      },
      {
        id: 'pylorus', color: '#b87a5a',
        name: { uz: 'Pilorus', ru: 'Привратник', en: 'Pylorus' },
        description: {
          uz: "Oshqozondan ichakka chiqish; sfinkter bilan boshqariladi.",
          ru: 'Выход из желудка в кишечник; регулируется сфинктером.',
          en: 'The exit to the intestine; controlled by a sphincter.',
        },
        physiology: {
          uz: "Hazm bo'lgan ovqatni nazorat bilan o'n ikki barmoq ichakka o'tkazadi.",
          ru: 'Контролируемо передаёт пищу в двенадцатиперстную кишку.',
          en: 'Releases chyme into the duodenum in a controlled way.',
        },
        pathology: {
          uz: "Pilorik stenoz oshqozon bo'shashini buzadi.",
          ru: 'Пилорический стеноз нарушает опорожнение желудка.',
          en: 'Pyloric stenosis impairs gastric emptying.',
        },
        diseases: {
          uz: 'Pilorik stenoz, yara',
          ru: 'Пилорический стеноз, язва',
          en: 'Pyloric stenosis, ulcer',
        },
      },
    ],
  },

  // ─── THYROID ─────────────────────────────────────────────────
  {
    key: 'thyroid',
    model: 'thyroid',
    category: 'endocrine',
    name: { uz: 'Qalqonsimon bez', ru: 'Щитовидная железа', en: 'Thyroid gland' },
    summary: {
      uz: "Bo'yinda joylashgan bez; moddalar almashinuvini boshqaruvchi gormonlar ishlab chiqaradi.",
      ru: 'Железа на шее; вырабатывает гормоны, регулирующие обмен веществ.',
      en: 'A neck gland; produces hormones that regulate metabolism.',
    },
    parts: [
      {
        id: 'right-lobe', color: '#a8556a',
        name: { uz: "O'ng bo'lak", ru: 'Правая доля', en: 'Right lobe' },
        description: {
          uz: "Tireoid gormonlar (T3, T4) ishlab chiqaruvchi qism.",
          ru: 'Часть, вырабатывающая тиреоидные гормоны (Т3, Т4).',
          en: 'Produces thyroid hormones (T3, T4).',
        },
        physiology: {
          uz: "Metabolizm tezligi va energiya almashinuvini boshqaradi.",
          ru: 'Регулирует скорость метаболизма и энергообмен.',
          en: 'Controls metabolic rate and energy use.',
        },
        pathology: {
          uz: "Gipertireoz, gipotireoz va tugunlar uchraydi.",
          ru: 'Встречаются гипертиреоз, гипотиреоз и узлы.',
          en: 'Hyperthyroidism, hypothyroidism and nodules occur.',
        },
        diseases: {
          uz: 'Gipertireoz, gipotireoz, bo\'qoq',
          ru: 'Гипертиреоз, гипотиреоз, зоб',
          en: 'Hyperthyroidism, hypothyroidism, goiter',
        },
      },
      {
        id: 'left-lobe', color: '#b56676',
        name: { uz: "Chap bo'lak", ru: 'Левая доля', en: 'Left lobe' },
        description: {
          uz: "Traxeyaning chap tomonida joylashgan simmetrik bo'lak.",
          ru: 'Симметричная доля слева от трахеи.',
          en: 'A symmetric lobe to the left of the trachea.',
        },
        physiology: {
          uz: "Yod yutib, gormon sintezida ishtirok etadi.",
          ru: 'Поглощает йод и участвует в синтезе гормонов.',
          en: 'Takes up iodine and helps synthesize hormones.',
        },
        pathology: {
          uz: "Tugunlar va autoimmun tireoidit rivojlanishi mumkin.",
          ru: 'Возможны узлы и аутоиммунный тиреоидит.',
          en: 'Nodules and autoimmune thyroiditis may develop.',
        },
        diseases: {
          uz: 'Xashimoto tireoiditi, tugunlar',
          ru: 'Тиреоидит Хашимото, узлы',
          en: 'Hashimoto\'s thyroiditis, nodules',
        },
      },
      {
        id: 'isthmus', color: '#c47788',
        name: { uz: 'Istmus', ru: 'Перешеек', en: 'Isthmus' },
        description: {
          uz: "Ikki bo'lakni bog'lovchi torgina ko'prik.",
          ru: 'Узкий мостик, соединяющий две доли.',
          en: 'A narrow bridge connecting the two lobes.',
        },
        physiology: {
          uz: "Bezning yaxlit ishlashini ta'minlaydi.",
          ru: 'Обеспечивает целостную работу железы.',
          en: 'Keeps the gland working as a unit.',
        },
        pathology: {
          uz: "Istmus o'smalari nafas yo'lini bosishi mumkin.",
          ru: 'Опухоли перешейка могут сдавливать дыхательные пути.',
          en: 'Isthmus tumors may compress the airway.',
        },
        diseases: {
          uz: 'Bez o\'smasi',
          ru: 'Опухоль железы',
          en: 'Thyroid tumor',
        },
      },
    ],
  },
]

export const ORGAN_MAP = Object.fromEntries(ORGANS.map(o => [o.key, o]))
