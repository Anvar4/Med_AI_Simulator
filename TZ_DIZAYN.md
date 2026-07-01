# TEXNIK TOPSHIRIQ (TZ)
## Med AI Simulator — To'liq Dizayn Yangilanishi (UI/UX Redesign)

**Hujjat versiyasi:** 1.0
**Sana:** 2026-07-01
**Buyurtmachi:** Med AI Simulator jamoasi
**Ijrochi:** UI/UX Dizayner
**Domen:** medaisimulator.uz

---

## 0. HUJJAT MAQSADI

Ushbu hujjat **Med AI Simulator** platformasining **to'liq vizual dizaynini qaytadan ishlab chiqish** uchun tuzilgan. Loyihaning **barcha sahifalari, komponentlari va oqimlarini** qamrab oladi. Hech bir sahifa yoki ekran e'tibordan chetda qolmasligi kerak — TZ butun mahsulot dizaynini yangilashni ko'zda tutadi.

**Asosiy urg'u:** Klinik holat (case) ishlash muhitini **o'yinlashtirilgan (gamified), immersiv simulyatsiyaga** aylantirish — bemor shifokor oldiga kelib simptomlarni aytadigan, real klinik ish jarayonini to'liq takrorlaydigan interaktiv tajriba.

---

## 1. MAHSULOT HAQIDA UMUMIY MA'LUMOT

**Med AI Simulator** — bu tibbiyot talabalari va yosh shifokorlar uchun mo'ljallangan **sun'iy intellekt asosidagi virtual klinik simulyator** platformasi. Foydalanuvchi virtual bemorlar bilan ishlaydi, tashxis qo'yadi, davolash rejasini tuzadi, va AI uni 0-100 ball bilan baholaydi — real bemorga zarar yetkazmasdan klinik ko'nikma oshiriladi.

**Maqsadli auditoriya:**
- Tibbiyot instituti talabalari (1-6 kurs)
- Rezidentlar va yosh shifokorlar
- Klinik ko'nikmalarni oshirmoqchi bo'lgan mutaxassislar

**Platforma turlari:**
- Web (asosiy) — Next.js, to'liq responsiv (desktop + mobil)
- 3 tilli: **O'zbek (asosiy), Rus, Ingliz**

**Foydalanuvchi rollari va subdomenlar:**
| Rol | Subdomen | Tavsif |
|-----|----------|--------|
| Oddiy foydalanuvchi (student) | `medaisimulator.uz` | Asosiy o'quv muhiti |
| Content Manager | `manager.medaisimulator.uz` | Kontent (case, kurs, kitob) boshqaruvi |
| Admin | `admin.medaisimulator.uz` | To'liq tizim boshqaruvi |

---

## 2. HOZIRGI DIZAYN TIZIMI (mavjud — asos sifatida)

> Dizayner quyidagilarni **bilishi kerak**, lekin **erkin yangilashi mumkin**. Bular hozirgi holat, majburiy cheklov emas.

**Ranglar (Dark theme — asosiy):**
- Fon (secondary): to'q ko'k-qora (`#0f1729` atrofida)
- Surface / kartalar: biroz ochiqroq to'q ko'k
- Primary (asosiy urg'u): cyan / turkuaz (`#2dd4bf` / `#22d3ee` atrofida — logotipdagi rang)
- Accent (ogohlantirish/xato): qizil
- Success: yashil, Warning: sariq/apelsin
- Matn: oq (primary), och kulrang (secondary)

**Tipografiya:** Sans-serif, zamonaviy. Sarlavhalar qalin (bold), body — o'rtacha.

**Uslub:** Zamonaviy, "glassmorphism" elementlari (shaffof/blur kartalar), yumaloq burchaklar (rounded-xl/2xl), yumshoq animatsiyalar (Framer Motion).

**Logotip:** "Med AI Simulator" — stetoskop + AI motividagi cyan rangli belgi.

**Dizayner uchun erkinlik:** Ranglar palitrasi, tipografiya, komponent uslublari — **to'liq qayta ko'rib chiqilishi mumkin**. Yagona talab: brend identifikatsiyasi (Med AI Simulator, tibbiy + AI kontekst) saqlanishi va professional, ishonchli, zamonaviy taassurot qoldirishi.

---

## 3. ASOSIY DIZAYN YO'NALISHI VA FALSAFASI

Yangi dizayn quyidagi tamoyillarga asoslanishi kerak:

1. **Immersiv klinik muhit** — foydalanuvchi haqiqiy shifoxonada, real bemor bilan ishlayotgandek his qilishi kerak. Case ishlash sahifasi markaziy tajriba.
2. **O'yinlashtirish (Gamification)** — ballar, darajalar, progress, yutuqlar, taymer, "reyting" — o'rganishni o'yin kabi qiziqarli qilish.
3. **Klinik ishonchlilik** — tibbiy professional muhit; jiddiy, aniq, chalg'itmaydigan. "O'yin" bo'lsa-da, tibbiy jiddiylikni yo'qotmaslik.
4. **Aniqlik va fokus** — har bir ekranda foydalanuvchi nima qilishi kerakligi ravshan bo'lsin.
5. **Responsivlik** — barcha ekranlar mobil va desktopda mukammal ishlashi shart.

---

## 4. GLOBAL / UMUMIY KOMPONENTLAR

Bu komponentlar deyarli barcha sahifalarda takrorlanadi — ular uchun **yagona, izchil dizayn tizimi** kerak.

### 4.1. Sidebar (Yon menyu) — kirgan foydalanuvchilar uchun
Barcha ichki sahifalarda chap tomonda joylashgan navigatsiya paneli.

**Desktop holati:**
- Yig'iladigan (collapsible) — kengaytirilgan (256px) yoki yig'ilgan (72px, faqat ikonkalar)
- Yuqorida: logotip
- O'rtada: navigatsiya elementlari (ikonka + matn)
- Pastda: foydalanuvchi profili (avatar, ism, email), Sozlamalar, Chiqish, Yig'ish tugmasi

**Navigatsiya elementlari (oddiy foydalanuvchi):**
1. Bosh sahifa (Dashboard) — uy ikonkasi
2. Klinik holatlar (Cases) — stetoskop
3. Statistika — grafik
4. 3D Simulyator — aktivlik ikonkasi
5. Kurslar — play tugmasi
6. Kutubxona — kitob
7. Karyera tahlili — miya
8. Reyting (Leaderboard) — kubok
9. Shoshilinch yordam (Emergency) — chaqmoq
10. Obuna (Subscription) — karta
11. Aloqa (Contact) — xabar

**Content Manager uchun qo'shimcha:** "Kontent boshqaruvi" elementi.
**Admin uchun qo'shimcha:** "Admin panel" elementi.

**Mobil holati:**
- Yuqorida fiksatsiyalangan panel (logotip + hamburger menyu + profil qismi)
- Hamburger bosilганda chapdan chiqadigan drawer (slide-in)
- Drawer ichida: barcha nav elementlari + til almashtirgich + TTS toggle + bildirishnoma + ballar

**Yuqori o'ng burchak elementlari (har bir sahifada):**
- **Til almashtirgich** (UZ / RU / EN) — bayroq + kod
- **TTS toggle** (ovozli o'qish yoqish/o'chirish)
- **Bildirishnoma qo'ng'irog'i** (NotificationBell) — o'qilmagan sonli badge bilan
- **Ballar badge** (PointsBadge) — foydalanuvchi to'plagan ballar

### 4.2. Navbar (Landing sahifa uchun — kirmagan foydalanuvchilar)
Landing sahifada yuqori navigatsiya: logotip + menyu ("Imkoniyatlar", "Narxlar", "Qanday ishlaydi", "Fikrlar") + til almashtirgich + "Kirish" + "Bepul Boshlash" tugmalari.

### 4.3. Beta banner
Yuqorida yuguruvchi (marquee) matn: "Sayt beta versiyada ishlamoqda. Muammo yoki taklif bo'lsa murojaat qiling." — barcha sahifalarda. Dizayner buni chiroyli, chalg'itmaydigan qilishi kerak.

### 4.4. Umumiy UI komponentlari
Butun tizim bo'ylab ishlatiladigan atom-komponentlar (barchasi uchun yagona uslub):
- **Button** — variantlar: primary, ghost, danger; o'lchamlar: sm, lg
- **Card** — kontent konteyneri (hover effekti bilan/holda)
- **Badge** — teg/yorliq: default, danger, warning, success, "PRO"
- **StatCard** — statistika kartochkasi (ikonka + raqam + label)
- **ProgressBar** — progress ko'rsatkichi
- **Toast** — bildirishnoma (success/error/info)
- **Dialog / Modal** — dialog oynalari
- **Charts** — grafiklar (ActivityChart va boshqalar)

### 4.5. Chat Widget
O'ng pastki burchakda suzuvchi AI chat yordamchisi tugmasi — barcha sahifalarda. Bosilganda chat oynasi ochiladi (savol-javob, kunlik limit).

### 4.6. Boshqa takrorlanuvchi komponentlar
- **ThemeSwitcher** — dark/light tema almashtirgich
- **LanguageSwitcher** — til almashtirgich (bayroq + UZ/RU/EN), Flag ikonkalari bilan
- **MedicalMedia / MediaViewer** — tibbiy media (rasm/video) ko'ruvchi + **LabResults** (laborator natijalar jadvali, norma bilan taqqoslash: past/normal/yuqori)
- **BalanceTopUpModal** — balans to'ldirish oynasi
- **PdfReader** — PDF o'qigich (kutubxona uchun)
- **Footer** — landing va ochiq sahifalar uchun pastki qism

---

## 5. SAHIFALAR — TO'LIQ RO'YXAT VA TAVSIF

> **DIQQAT:** Quyidagi HAMMA sahifa dizayni yangilanadi. Har biri uchun desktop + mobil variant kerak.

---

### 🌟 5.1. LANDING (Bosh sahifa — kirmagan foydalanuvchi) — `/`
**Maqsad:** Mahsulotni sotish, ro'yxatdan o'tishga undash.

**Bloklar (yuqoridan pastga):**
1. **Navbar** (yuqorida)
2. **Hero bo'lim** — katta sarlavha "Virtual Klinik Muhit", tavsif, CTA tugmalari ("Bepul Boshlash", "Demo ko'rish"), statistika (500+ klinik holat, 98% aniqlik, 24/7)
3. **Imkoniyatlar (Features)** — 6 ta kartochka:
   - AI Evaluator (baholovchi)
   - Operatsiya Zali (Virtual OR)
   - Karyera Tahlil
   - Shoshilinch Yordam
   - Pediatriya + Tug'ruq
   - (va boshqalar)
4. **Qanday ishlaydi** — 3-4 bosqichli jarayon
5. **Narxlar (Pricing)** — obuna tariflari
6. **Fikrlar (Testimonials)** — foydalanuvchi sharhlari (avatar, ism, rol, reyting yulduzlari)
7. **CTA bo'lim** — yakuniy chaqiruv
8. **Footer** — havolalar, ijtimoiy tarmoqlar, huquqiy sahifalar

**Uslub:** Ta'sirchan, zamonaviy SaaS landing. Animatsiyalar (scroll reveal). Tibbiy + texnologik his.

---

### 🔐 5.2. KIRISH (Login) — `/login`
**Maqsad:** Tizimga kirish.

**Tuzilishi:** Ikki ustunli (desktop):
- **Chap:** Brending paneli (logotip, "Virtual Klinik Muhit" sarlavha, tavsif, statistika kartochkalari) — gradient fon
- **O'ng:** Kirish formasi kartochkasi:
  - Sarlavha "Tizimga kirish"
  - **Google bilan kirish** tugmasi (rasmiy widget — tanlangan tilda: "Sign in with Google" / "Google bilan kirish" / "Войти через Google")
  - "yoki" ajratgich
  - Login maydoni
  - Parol maydoni (ko'rsatish/yashirish ikonkasi bilan)
  - "Parolni unutdingizmi?" havolasi
  - "Kirish" tugmasi
  - "Ro'yxatdan o'tish" havolasi

**MUHIM — subdomen farqlari:**
- `admin.` va `manager.` subdomenlarida: **Google tugmasi YO'Q**, "Ro'yxatdan o'tish" YO'Q, "Parolni unutdingizmi" YO'Q — **faqat login/parol maydonlari va Kirish tugmasi**. Dizayner ushbu **soddalashtirilgan panel variantini** ham chizishi kerak.

**Mobil:** Bir ustun, brending logotip yuqorida.

---

### 📝 5.3. RO'YXATDAN O'TISH (Register) — `/register`
**Maqsad:** Yangi hisob yaratish. **Ko'p bosqichli sehr (wizard).**

**Bosqichlar:**
1. **Usul tanlash (method):** "Google orqali" tugmasi + "yoki" + "Qo'lda ro'yxatdan o'tish" tugmasi + "Akkauntingiz bormi? Kirish"
2. **Shaxsiy ma'lumotlar (personal):** avatar yuklash (ixtiyoriy, max 3MB), Ism, Familiya
3. **Login va parol (credentials):** login (kamida 6 belgi), parol — real-time validatsiya (✓/✗ indikator)
4. **Email (email):** email kiritish → tasdiqlash kodi yuboriladi
5. **OTP (otp):** 6 xonali kod kiritish (6 ta alohida input), qayta yuborish taymeri

**Har bosqichda:** yuqorida progress indikatori (4 ta chiziq), "Orqaga" tugmasi, animatsiyali o'tishlar (slide).

**Uslub:** Toza, bosqichma-bosqich, chalkashtirmaydigan. Progress ko'rinib tursin.

---

### 🔑 5.4. PAROLNI UNUTDINGIZMI — `/forgot-password`
Email kiritish → OTP → yangi parol o'rnatish oqimi. (Faqat asosiy domenda.)

---

### 🏠 5.5. DASHBOARD (Boshqaruv paneli) — `/dashboard`
**Maqsad:** Kirgan foydalanuvchining bosh sahifasi — umumiy holat.

**Bloklar:**
- Salomlashuv ("Xush kelibsiz, [ism]")
- **Statistika kartalari (StatCard):** jami keyslar, o'rtacha ball, haftalik faollik, streak (ketma-ket kunlar 🔥)
- **Faollik grafigi (ActivityChart)** — haftalik/oylik progress
- **Progress bar** — maqsadga erishish
- **Tavsiya etilgan keyslar** — 3 ta CaseCard
- Tezkor havolalar

**Gamification urg'usi:** streak, ballar, progress — vizual jozibador.

---

### 🩺 5.6. KLINIK HOLATLAR RO'YXATI (Cases) — `/cases`
**Maqsad:** Barcha mavjud keyslarni ko'rish va tanlash.

**Elementlar:**
- **Qidiruv paneli** (search)
- **Filtrlash:** kategoriya bo'yicha + tur bo'yicha (Barchasi / Diagnostika / Jarrohlik / Shoshilinch)
- **AI tavsiyalari** (Sparkles ikonka) — shaxsiylashtirilgan tavsiyalar bloki
- **Tarix havolasi** (History)
- **Keyslar to'ri (grid):** har biri **CaseCard**:
  - Kategoriya va tur badge'lari
  - "PRO" badge (premium keyslar uchun)
  - Sarlavha
  - Bemor haqida qisqa ma'lumot
  - Qiyinlik darajasi
  - "Boshlash" tugmasi

**Uslub:** Kartochkalar to'ri, filtrlash oson, qidiruv tez.

---

### ⭐⭐⭐ 5.7. KLINIK HOLAT ISHLASH (Case Detail) — `/cases/[id]`
> **BU LOYIHANING MARKAZIY VA ENG MUHIM SAHIFASI.** Aynan shu yerni **o'yinlashtirilgan, immersiv klinik simulyatsiyaga** aylantirish kerak. Dizayner bunga eng ko'p e'tibor berishi shart.

**KONSEPSIYA:** Foydalanuvchi virtual shifokor. Bemor uning oldiga keladi, simptomlarini aytadi (ovoz + matn). Shifokor tekshiruvlar buyuradi, natijalarni ko'radi, tashxis qo'yadi, davolash rejasini yozadi. AI uni baholaydi. **Butun jarayon real klinik qabulni takrorlashi kerak.**

**HOZIRGI TUZILISH (yangilanadi):**

**A) Sarlavha bloki:**
- "Orqaga" tugmasi
- Kategoriya + tur badge'lari (Diagnostika/Jarrohlik/Shoshilinch) + PRO badge
- Keys sarlavhasi
- Muallif

**B) BEMOR SIMULYATORI (PatientSimulator) — eng muhim komponent:**
- **Bemor avatari** (erkak/ayol rasmi) — **jonli animatsiya bilan:**
  - Ko'krak siqish animatsiyasi (og'riq holatida — nafas olish/siqilish harakati)
  - Og'riq pulsatsiyasi (qizil nur ko'krak sohasida pulslaydi)
  - "Og'riq" badge (pulslaydigan)
- **Nutq pufakchasi (speech bubble):** bemor gapiradi — matn **yozilib chiqadi (typing animatsiya)** + **ovozli o'qiladi (TTS, jinsga mos ovoz)**. Misol: *"Assalomu alaykum, doktor. Mening ismim Aziz, yoshim 45da. Ko'krak qafasimda kuchli og'riq bor..."*
- Ovoz boshqaruvi (play/stop tugmasi)

> **DIZAYNER UCHUN VAZIFA:** Bu komponentni **maksimal darajada jonli va real** qilish. Bemor haqiqatan kasal, azob chekayotgandek ko'rinishi kerak. Turli holatlar uchun turli animatsiyalar (ko'krak og'rig'i, bosh og'rig'i, nafas qisilishi, va h.k.) haqida g'oyalar bering. Ideal holatda — turli tana qismlaridagi og'riqni ko'rsatuvchi vizual indikatorlar.

**C) CHAP USTUN — Bemor profili va natijalar:**
- **Bemor ma'lumoti kartasi:** ism, yosh, jins, yosh guruhi + **Vital ko'rsatkichlar (VitalSigns):**
  - BP (qon bosimi), HR (yurak urishi), Temp (harorat), SpO₂ (kislorod)
  - **Har biri rangli holat indikatori bilan:** normal (yashil) / warning (sariq) / danger (qizil) — pulslaydigan nuqta bilan
- **Shikoyatlar** kartasi
- **Anamnez** kartasi
- **Tekshiruv natijalari** (shartli ko'rinadi — faqat buyurtma qilingandan keyin):
  - Rentgen / KT / MRT natijalari (media viewer — rasmlar)
  - EKG natijalari
  - UZI natijalari
  - Endoskopiya natijalari
  - Qon analizi (jadval — LabResults)
  - Bioximik analiz (jadval)
  - Siydik analizi (jadval)

**D) O'NG USTUN — Shifokor paneli (ishchi joy):**
- **Taymer va progress kartasi:**
  - O'tgan vaqt (MM:SS, monospace)
  - **4 bosqichli progress:** Ko'rik → Tahlil → Tashxis → Davolash (har biri bajarilganda ✓ bo'ladi)
- **Tekshiruv menyulari (accordion):**
  - Instrumental tekshiruvlar (EKG, UZI, Rentgen, KT, MRT, Endoskopiya) — checkbox
  - Laborator tekshiruvlar (Qon, Siydik, Bioximik) — checkbox
  - *Belgilangandan keyin mos natija chap ustunда ochiladi*
- **Tashxis** — textarea (shifokor tashxisni yozadi)
- **Davolash rejasi** — textarea
- **"Boshlash" / "AI Baholash" tugmasi**

**E) AI NATIJA MODALI (AIResultModal) — baholashdan keyin:**
- **Katta doiraviy ball ko'rsatkichi** (0-100, aylanma progress) — rangi ballga qarab
- Holat: "A'lo natija ✓" (≥80) / "Qisman To'g'ri" (≥50) / "Yaxshilash kerak"
- **Kuchli tomonlar** (ThumbsUp, yashil ro'yxat)
- **Zaif tomonlar** (ThumbsDown, qizil ro'yxat)
- **To'g'ri tashxis vs foydalanuvchi tashxisi** taqqoslash
- **To'g'ri davolash vs foydalanuvchi davolashi** taqqoslash
- **Batafsil AI tahlili** (kengaytiriladigan)
- Feedback matni

> **O'YINLASHTIRISH G'OYALARI (dizayner tavsiyasi uchun):**
> - Ball olinganda animatsiya/konfetti (a'lo natijada)
> - Bosqichlar bajarilganda vizual mukofot
> - "Combo" / "streak" tizimlari
> - Bemorning holati vaqt o'tishi bilan yomonlashishi (shoshilinch keyslarda) — vizual keskinlik
> - Darajalar, unvonlar (masalan "Rezident" → "Shifokor" → "Mutaxassis")

**F) 4 XIL KEYS TURI UCHUN DIZAYN VARIANTLARI:**
1. **Diagnostika** — standart tashxis qo'yish (yuqoridagi asosiy oqim)
2. **Jarrohlik (Operatsiya Zali)** — virtual operatsiya muhiti, real vaqt monitoring, qadamma-qadam jarrohlik. **Bu alohida, boyroq muhit talab qiladi.**
3. **Shoshilinch (Emergency)** — vaqt bosimi ostida, taymer keskin, bemor holati yomonlashishi mumkin
4. **Pediatriya / Tug'ruq** — bola/chaqaloq/homilador bemor uchun maxsus vizual

---

### 📖 5.8. KEYS TARIXI (Cases History) — `/cases/history` va `/history`
Foydalanuvchi bajargan keyslar tarixi: sana, ball, holat, qayta ko'rish imkoniyati.

---

### ⚡ 5.9. SHOSHILINCH YORDAM (Emergency) — `/emergency`
**Maqsad:** Vaqt bosimi ostida ishlash — alohida shoshilinch rejim.

**Elementlar:**
- Keyslar ro'yxati (qidiruv, kategoriya, qiyinlik filtri: easy/medium/hard)
- **Faol sessiya:** keskin **taymer** (5 daqiqa fallback), bemor simulyatori, tez qaror qabul qilish
- Vaqt tugashi bilan holatning o'zgarishi

> **DIZAYN:** Keskinlik, adrenalin hissi. Qizil ogohlantirishlar, tez pulsatsiyalar, "vaqt ketmoqda" bosimi. Real shifoxona shoshilinch bo'limi atmosferasi.

---

### 🎮 5.10. 3D SIMULYATOR (Anatomiya) — `/simulator`
**Maqsad:** 3D anatomiya modellari bilan interaktiv ishlash.

**Elementlar:**
- **3D ko'ruvchi (Sketchfab viewer)** — markazda, aylantiriladigan 3D model
- **Model ro'yxati paneli** (chap) — turli anatomik modellar (yig'iladigan)
- **Ma'lumot paneli** (o'ng) — tanlangan model tavsifi, tarkibiy qismlar
- **Ovozli o'qish** (model tavsifini TTS)
- **To'liq ekran** rejimi
- Ba'zi modellar **premium** (qulf ikonkasi bilan)

**Mobil:** model tanlash — pastdan chiqadigan varaq (sheet).

---

### 📚 5.11. KUTUBXONA (Library) — `/library`
Tibbiy kitoblar ro'yxati (DB-driven). Kategoriyalar, qidiruv. Har bir kitob — kartochka (muqova, sarlavha, muallif).

### 📖 5.12. KITOB O'QISH (Library Read) — `/library/read`
**PDF o'qigich (PDF.js reader)** — kitobni sahifalab o'qish, zoom, navigatsiya.

---

### 🎓 5.13. KURSLAR (Courses) — `/kurslar`
**Maqsad:** Video kurslar ro'yxati va ko'rish.

**Elementlar:**
- Kurslar ro'yxati (kartochkalar: muqova, sarlavha, tavsif, daraja, davomiylik, PRO badge)
- Kategoriya/daraja filtri
- **Kurs ichida:** video player, dars ro'yxati (playlist), progress, izohlar
- **Yakuniy imtihon:** savol banki, ball, **sertifikat** (o'tgandan keyin)

---

### 🏆 5.14. REYTING (Leaderboard) — `/leaderboard`
Foydalanuvchilar reytingi (ballar bo'yicha). Top-3 alohida ajratilgan (podium), qolganlar ro'yxatda. Foydalanuvchi o'z o'rnini ko'radi.

> **GAMIFICATION:** Podium, medallar, unvonlar. Raqobat hissi.

---

### 📊 5.15. STATISTIKA (Statistics) — `/statistics`
Foydalanuvchi bo'yicha batafsil statistika: grafiklar, keyslar bo'yicha taqsimot, o'sish dinamikasi, kuchli/zaif sohalar.

---

### 🧠 5.16. KARYERA TAHLILI (Analysis) — `/analysis`
AI foydalanuvchining kuchli tomonlarini tahlil qiladi va **ixtisoslik tavsiya beradi** (masalan: "Siz kardiologiyada kuchlisiz"). Vizual tahlil, tavsiyalar.

---

### 💳 5.17. OBUNA (Subscription) — `/subscription`
Obuna tariflari (Free / Pro / Clinic / University), narxlar, imkoniyatlar taqqoslash jadvali, **to'lov** oqimi (to'lov kartasi qo'shish).

---

### 🎁 5.18. REFERALLAR (Referrals) — `/referrals`
Referal dasturi: taklif kodi/havolasi, taklif qilinganlar ro'yxati, topilgan ballar/bonuslar.

---

### ⚙️ 5.19. SOZLAMALAR (Settings) — `/settings`
Foydalanuvchi sozlamalari: profil tahrirlash (avatar, ism, email), parol o'zgartirish, til, bildirishnoma sozlamalari, tema (dark/light), ovoz/animatsiya sozlamalari.

---

### 📞 5.20. ALOQA (Contact) — `/contact`
Qo'llab-quvvatlash: murojaat formasi, support ticket, aloqa ma'lumotlari.

---

### 💼 5.21. KARYERA (Career) — `/career`
Ish o'rinlari / vakansiyalar sahifasi (kompaniya haqida, ochiq ish o'rinlari).

---

### 📜 5.22. HUQUQIY SAHIFALAR
- **Maxfiylik siyosati** — `/privacy-policy`
- **To'lov shartlari** — `/payment-terms`

Toza, o'qilishi oson matn sahifalari.

---

### ✅ 5.23. SERTIFIKAT TASDIQLASH (Verify) — `/verify/[serial]`
Sertifikatning haqiqiyligini tekshirish sahifasi (serial raqam bo'yicha). Sertifikat ma'lumotlari, egasi, sana, holat.

---

### 🛡️ 5.24. ADMIN PANEL — `/admin` (faqat `admin.` subdomen)
**Maqsad:** To'liq tizim boshqaruvi.

**Tuzilishi:** Yon menyu yoki gorizontal tab'lar orqali **10 ta bo'lim** (kodga asosan aniq ro'yxat):

1. **Dashboard** — umumiy statistika (foydalanuvchilar soni, keyslar, daromad, server holati/uptime), grafiklar
2. **Foydalanuvchilar (Users)** — ro'yxat, qidiruv, **yaratish/tahrirlash modali** (ism, email, login, parol, rol), rol o'zgartirish, o'chirish, premium/Crown belgisi
3. **Promo kodlar (Promo)** — promo-kod yaratish, ro'yxat, chegirma foizi, muddat
4. **Kategoriyalar (Categories)** — kategoriya qo'shish/tahrirlash/o'chirish
5. **To'lovlar (Payments)** — to'lov so'rovlari (PaymentRequest), tasdiqlash/rad etish
6. **Ko'rib chiqish (Review)** — content manager yaratgan keyslarni moderatsiya (tasdiqlash/rad etish)
7. **To'lov kartalari (Cards)** — tizim to'lov kartalari boshqaruvi
8. **Balans to'ldirishlar (TopUps)** — foydalanuvchi balans to'ldirish so'rovlari
9. **Referallar (Referrals)** — referal tizimi statistikasi va boshqaruvi
10. **Qo'llab-quvvatlash (Support)** — support ticket'lari (foydalanuvchi murojaatlari)

**Qo'shimcha elementlar:** Server salomatligi paneli (uptime, holat), daromad analitikasi (RevenueAnalytics), eksport (Download) funksiyalari.

> **DIZAYN:** Ma'lumotga boy admin paneli — jadvallar, filtrlar, grafiklar, modallar. Professional, funksional. Data-dense lekin toza. Har bir tab uchun alohida ekran dizayni kerak.

---

### 🗂️ 5.25. KONTENT MANAGER PANEL — `/content-manager` (faqat `manager.` subdomen)
**Maqsad:** Kontent yaratish va boshqarish.

**Tuzilishi:** Gorizontal, scroll qilinadigan tab bar orqali **7 ta modul** (kodga asosan aniq ro'yxat):

1. **Dashboard** — kontent statistikasi (yaratilgan keyslar, kurslar, ko'rishlar)
2. **Keyslar (Cases)** — keys ro'yxati + **yangi keys yaratish modali (NewCaseModal):**
   - Sarlavha, kategoriya (Kardiologiya, Nevrologiya, Pediatriya, Shoshilinch, Dermatologiya...), tur (diagnostika/jarrohlik/shoshilinch), qiyinlik darajasi
   - **Bemor ma'lumoti:** ism, yosh, jins, yosh guruhi, shikoyatlar, anamnez
   - **Vital ko'rsatkichlar:** BP, HR, harorat, SpO₂
   - **Tekshiruv natijalari:** media yuklash (rasm/video — rentgen, EKG, UZI, endoskopiya), laborator jadvallar (qon/siydik/bioximik)
   - To'g'ri tashxis va to'g'ri davolash
   - Tahrirlash/o'chirish
3. **Shoshilinch (Emergency)** — shoshilinch keyslar boshqaruvi
4. **Kutubxona (Library)** — kitob qo'shish (PDF yuklash), ro'yxat, tahrirlash
5. **Kurslar (Courses)** — kurs yaratish, video yuklash (drag&drop), darslar (playlist), izohlar, progress
6. **Imtihonlar (Exams)** — imtihon va savol banki boshqaruvi (savollar, javoblar, ball)
7. **Analitika (Analytics)** — kontent bo'yicha analitika, foydalanuvchi faolligi

> **DIZAYN:** Kontent yaratish oson va tushunarli bo'lsin. Ko'p maydonli formalar (ayniqsa keys yaratish modali) chalkashmasin — bosqichlarga bo'lish yoki yaxshi tashkil qilish kerak. Media yuklash qulay (drag&drop, preview). Har bir tab uchun alohida ekran dizayni.

---

## 6. TEXNIK VA DIZAYN TALABLARI

### 6.1. Responsivlik
- **Barcha** sahifalar 3 breakpoint uchun: mobil (< 640px), planshet (640-1024px), desktop (> 1024px)
- Sidebar: desktopda yon panel, mobilда drawer
- Case ishlash sahifasi: desktopda 2 ustun, mobilда bir ustun (vertikal stack)

### 6.2. Tillar
- Butun interfeys 3 tilda: **UZ / RU / EN**
- Matn uzunligi tillarga qarab o'zgaradi (rus tili ~15% uzunroq) — dizayn moslashuvchan bo'lsin
- Til almashtirgich har doim ko'rinadigan joyda

### 6.3. Tema
- **Dark theme — asosiy** (hozirgi)
- Light theme ham qo'llab-quvvatlanadi (settings'da toggle bor) — dizayner ikkalasini ham ko'zda tutsa yaxshi (yoki kamida dark'ni to'liq)

### 6.4. Holatlar (States)
Har bir interaktiv element uchun barcha holatlar:
- Loading (yuklanmoqda — skeleton yoki spinner)
- Empty (bo'sh — "hozircha ma'lumot yo'q")
- Error (xato)
- Success
- Hover / Active / Disabled / Focus

### 6.5. Animatsiyalar
- Framer Motion asosida — yumshoq, tabiiy
- Sahifa o'tishlari, scroll reveal, hover effektlari
- Bemor simulyatoridagi jonli animatsiyalar (eng muhim)
- **Chalg'itmasin** — animatsiya funksiyani kuchaytirsin, xalaqit bermasin

### 6.6. Foydalanuvchi avatarlari
Google orqali kirganlar Google avatariga ega. Avatarsizlar uchun — ism harflaridan iborat rangли doira (fallback).

---

## 7. YETKAZIB BERISH (Deliverables)

Dizaynerdan kutiladigan natijalar:

1. **Figma fayl** (yoki muqobil) — barcha sahifalar dizayni
2. Har bir sahifa uchun: **desktop + mobil** variant
3. **Dizayn tizimi (Design System):** ranglar, tipografiya, komponentlar kutubxonasi, ikonkalar, spacing tizimi
4. **Interaktiv prototip** — asosiy oqimlar (login → dashboard → case ishlash → natija) uchun clickable prototip
5. **Case ishlash sahifasi** uchun alohida batafsil ishlov + animatsiya spetsifikatsiyasi
6. **4 xil keys turi** (diagnostika, jarrohlik, shoshilinch, pediatriya) uchun variantlar
7. **Holatlar** (loading/empty/error) dizaynlari
8. Barcha 3 subdomen (asosiy / admin / manager) uchun login variantlari

---

## 8. PRIORITETLAR (dizayn tartibi)

**1-daraja (eng muhim — birinchi):**
- Case ishlash sahifasi (`/cases/[id]`) + Bemor simulyatori + AI natija modali
- Dashboard
- Cases ro'yxati
- Login / Register

**2-daraja:**
- Emergency, Simulator (3D), Kurslar, Kutubxona
- Leaderboard, Statistics, Analysis
- Sidebar / global komponentlar

**3-daraja:**
- Subscription, Referrals, Settings, Contact, Career
- Admin panel, Content Manager panel
- Huquqiy sahifalar, Verify

---

## 9. YAKUNIY ESLATMALAR

- **Hech bir sahifa e'tibordan chetda qolmasin** — yuqoridagi ro'yxatdagi 25+ ekran to'liq qamrab olingan.
- **Case ishlash muhiti — loyihaning yuragi.** Unga eng ko'p ijodiy kuch sarflansin: immersiv, o'yinlashtirilgan, real klinik his.
- Brend: **tibbiy ishonchlilik + zamonaviy texnologiya (AI) + o'yin qiziqarliligi** — uch muvozanat.
- Maqsadli auditoriya — yosh, texnologiyaga ochiq tibbiyot talabalari. Dizayn zamonaviy, "premium" his qoldirsin, lekin tibbiy jiddiylikni yo'qotmasin.

---

*Ushbu TZ Med AI Simulator platformasining hozirgi to'liq funksional holati asosida tuzilgan. Savol yoki aniqlashtirishlar bo'lsa — buyurtmachi jamoasi bilan bog'laning.*
