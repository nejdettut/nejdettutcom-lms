# AI Destekli LMS — nejdettut.com (MVP)

Küçük ölçekli, yapay zekâ destekli öğrenim yönetim sistemi.

- **Mimari:** Next.js 16 + Supabase (`lms` schema) + Groq
- **Kapsam (MVP):**
  - Eğitmen Panel (`/yonetici`): kurs + modül + ders + ödev oluştur
  - Ders metni eklendiğinde AI otomatik özet üretir
  - Öğrenci: `/kurs/<slug>` adresinden kursu açar, ödevini anonim teslim eder
  - AI öğrenci teslimini 0-100 puanlar + feedback + güçlü yönler + geliştirilecek alanlar
- **Auth:** Eğitmen için `LMS_INSTRUCTOR_SECRET` env (header). Öğrenci anonim.
- **Veritabanı:** `nejdettut.com` ana Supabase projesinin `lms` schema'sı (ayrı proje değil).

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
LMS_INSTRUCTOR_SECRET=
```

## Migration

Repo kökündeki `supabase/migrations/20261108130000_lms_schema.sql` (ana nejdettut.com repo) ile
tablolar oluşur: `lms.courses`, `lms.modules`, `lms.lessons`, `lms.assignments`, `lms.submissions`.

## Geliştirme

```bash
npm install
cp .env.example .env.local
npm run dev
```
