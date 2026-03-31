# Ilchevska Pharmacy – Медицинска Платформа

Пълна онлайн платформа за медицински консултации с резервация на часове, имейл потвърждения и панели за лекари и администратор.

---

## Стъпка 1: Supabase настройка

### 1.1 Създаване на проект
1. Отидете на https://supabase.com и регистрирайте безплатен акаунт
2. Натиснете "New Project"
3. Попълнете: Project name, Database password (запазете го!), Region: Europe (Frankfurt)
4. Изчакайте ~2 минути за инициализация

### 1.2 Намиране на ключовете
- Settings → API
- Копирайте "Project URL" → `SUPABASE_URL` в supabase-config.js
- Копирайте "anon public" key → `SUPABASE_ANON` в supabase-config.js

### 1.3 Създаване на таблиците
- SQL Editor → New query → копирайте и стартирайте следния SQL:

```sql
-- ТАБЛИЦА: doctors
CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  specialty TEXT NOT NULL,
  photo_url TEXT,
  description TEXT,
  education JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  price INTEGER NOT NULL DEFAULT 50,
  duration INTEGER DEFAULT 30,
  languages TEXT[] DEFAULT ARRAY[]::TEXT[],
  experience INTEGER DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#0d2d4e',
  initials TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ТАБЛИЦА: time_slots
CREATE TABLE time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  is_pending BOOLEAN DEFAULT false,
  pending_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(doctor_id, date, time)
);

-- ТАБЛИЦА: bookings
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES time_slots(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT,
  complaint TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ТАБЛИЦА: reviews
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ТАБЛИЦА: applications
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  uin TEXT NOT NULL,
  city TEXT NOT NULL,
  experience INTEGER DEFAULT 0,
  profile_url TEXT,
  motivation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_apply" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_manages_applications" ON applications FOR ALL
  USING (auth.email() = 'karaivanovtodor668@gmail.com');

-- RLS: Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ПОЛИТИКИ
CREATE POLICY "public_read_doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "auth_update_own_doctor" ON doctors FOR UPDATE USING (auth.email() = email);

CREATE POLICY "public_read_slots" ON time_slots FOR SELECT USING (true);
CREATE POLICY "auth_manage_own_slots" ON time_slots FOR ALL
  USING (doctor_id IN (SELECT id FROM doctors WHERE email = auth.email()));

CREATE POLICY "public_insert_booking" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "doctor_read_own_bookings" ON bookings FOR SELECT
  USING (doctor_id IN (SELECT id FROM doctors WHERE email = auth.email()));
CREATE POLICY "doctor_update_own_bookings" ON bookings FOR UPDATE
  USING (doctor_id IN (SELECT id FROM doctors WHERE email = auth.email()));

CREATE POLICY "public_read_reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "public_insert_review" ON reviews FOR INSERT WITH CHECK (true);

-- Специална политика за admin (сменете с вашия имейл)
CREATE POLICY "admin_all_bookings" ON bookings FOR ALL
  USING (auth.email() = 'todor@ilchevska.bg');
CREATE POLICY "admin_all_doctors" ON doctors FOR ALL
  USING (auth.email() = 'todor@ilchevska.bg');
CREATE POLICY "admin_all_slots" ON time_slots FOR ALL
  USING (auth.email() = 'todor@ilchevska.bg');

-- RPC ФУНКЦИЯ: reserve_slot (атомарна резервация)
CREATE OR REPLACE FUNCTION reserve_slot(slot_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE rows_affected INTEGER;
BEGIN
  UPDATE time_slots
  SET is_pending = true,
      pending_until = now() + interval '2 minutes'
  WHERE id = slot_id
    AND is_booked = false
    AND (is_pending = false OR pending_until < now());
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- RPC ФУНКЦИЯ: confirm_booking
CREATE OR REPLACE FUNCTION confirm_booking(
  p_slot_id UUID,
  p_patient_name TEXT,
  p_patient_email TEXT,
  p_patient_phone TEXT,
  p_complaint TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doctor_id UUID;
  v_booking_id UUID;
BEGIN
  SELECT doctor_id INTO v_doctor_id FROM time_slots
  WHERE id = p_slot_id AND is_pending = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Часът не е резервиран или е изтекъл';
  END IF;
  UPDATE time_slots SET is_booked = true, is_pending = false, pending_until = NULL WHERE id = p_slot_id;
  INSERT INTO bookings (doctor_id, slot_id, patient_name, patient_email, patient_phone, complaint, status)
  VALUES (v_doctor_id, p_slot_id, p_patient_name, p_patient_email, p_patient_phone, p_complaint, 'confirmed')
  RETURNING id INTO v_booking_id;
  RETURN v_booking_id;
END;
$$;
```

### 1.4 Създаване на акаунт за Admin
Authentication → Users → Invite user → Въведете вашия имейл (`todor@ilchevska.bg`)

### 1.5 Създаване на акаунти за лекари
За всеки лекар: Authentication → Users → Invite user → имейл на лекаря

> **ВАЖНО:** Имейлът трябва да съвпада с полето `email` в таблица `doctors`!

### 1.6 Добавяне на лекари в базата
Table Editor → doctors → Insert row (или чрез admin.html след настройката)

---

## Стъпка 2: EmailJS настройка

### 2.1 Регистрация
1. https://www.emailjs.com → безплатен акаунт (200 имейла/месец)
2. Email Services → Add New Service → Gmail (или друг)
3. Оторизирайте Gmail акаунта

### 2.2 Шаблон за ЛЕКАР (template_doctor_notify)
Email Templates → Create New Template:
- **Template ID:** `template_doctor_notify`
- **To:** `{{to_email}}`
- **Subject:** `Нова резервация – {{date}} {{time}}`
- **Body:**
```
Здравейте, {{doctor_name}},

Имате нова онлайн резервация:

📅 Дата: {{date}}
🕐 Час: {{time}}

👤 Пациент: {{patient_name}}
📞 Телефон: {{patient_phone}}
✉ Имейл: {{patient_email}}
💬 Оплакване: {{complaint}}

{{pharmacy_name}} | {{pharmacy_phone}}
```

### 2.3 Шаблон за ПАЦИЕНТ (template_patient_confirm)
Email Templates → Create New Template:
- **Template ID:** `template_patient_confirm`
- **To:** `{{to_email}}`
- **Subject:** `Потвърждение – {{pharmacy_name}}`
- **Body:**
```
Здравейте, {{patient_name}},

Вашата консултация е потвърдена!

👨‍⚕️ Специалист: {{doctor_name}} ({{specialty}})
📅 Дата: {{date}}
🕐 Час: {{time}}

Ще се свържем с вас преди консултацията.

{{pharmacy_name}}
📍 {{pharmacy_addr}}
📞 {{pharmacy_phone}}
```

### 2.4 Копиране на ключовете
- Account → General → **Public Key** → `EMAILJS_PUBLIC_KEY` в supabase-config.js
- Email Services → **Service ID** → `EMAILJS_SERVICE_ID` в supabase-config.js

---

## Стъпка 3: Обновяване на supabase-config.js

Отворете `supabase-config.js` и заменете placeholder-ите с реалните стойности:

```javascript
const SUPABASE_URL  = 'https://ВАШИЯ_PROJECT_ID.supabase.co';
const SUPABASE_ANON = 'ВАШИЯ_ANON_KEY';

const EMAILJS_PUBLIC_KEY  = 'ВАШИЯ_PUBLIC_KEY';
const EMAILJS_SERVICE_ID  = 'ВАШИЯ_SERVICE_ID';

const ADMIN_EMAIL = 'todor@ilchevska.bg'; // Вашият имейл
```

> Обновете и `admin_all_*` политиките в Supabase SQL Editor с вашия реален имейл, ако е различен.

---

## Структура на файловете

```
Illchevska doctors/
├── index.html          – Главна страница (пациенти)
├── doctor-panel.html   – Панел за лекарите
├── admin.html          – Панел за администратор (Тодор)
├── supabase-config.js  – Конфигурация (попълнете!)
└── README.md           – Тези инструкции
```

---

## Workflow

1. **Тодор (Admin):** Влиза в `admin.html` → добавя лекари → лекарите получават покана по имейл
2. **Лекар:** Влиза в `doctor-panel.html` → добавя свободни часове → пациентите могат да резервират
3. **Пациент:** Отваря `index.html` → търси специалист → избира дата и час → попълва форма → получава имейл потвърждение

---

## Важни бележки

- Безплатният план на Supabase: 500MB база данни, 50,000 активни потребители/месец
- EmailJS безплатен план: 200 имейла/месец
- За production: качете файловете на хостинг (Netlify/GitHub Pages са безплатни)
- **Хостинг:** Просто качете всички файлове в Netlify чрез drag-and-drop на https://app.netlify.com/drop

---

## Отстраняване на проблеми (Troubleshooting)

### "Грешка при зареждане" на главната страница
- Проверете дали `SUPABASE_URL` и `SUPABASE_ANON` са правилно попълнени в `supabase-config.js`
- Проверете дали таблиците са създадени (SQL от стъпка 1.3)
- Проверете дали RLS политиките са активирани и настроени

### Лекарят не може да влезе в doctor-panel.html
- Уверете се, че имейлът е поканен в Authentication → Users
- Уверете се, че имейлът в `doctors` таблицата съвпада точно с имейла в Auth
- Лекарят трябва да е приел поканата и да е задал парола

### Имейлите не се изпращат
- Проверете `EMAILJS_PUBLIC_KEY` и `EMAILJS_SERVICE_ID` в `supabase-config.js`
- Проверете дали template ID-тата съвпадат точно: `template_doctor_notify` и `template_patient_confirm`
- Проверете лимита на EmailJS (200/месец за безплатния план)
- Отворете конзолата на браузъра (F12) за конкретни грешки

### "Часът вече е зает" при резервация
- Друг потребител е запазил същия час в рамките на 2 минути
- Изберете друг час или презаредете страницата

### Admin не може да влезе
- Проверете дали `ADMIN_EMAIL` в `supabase-config.js` съвпада точно с имейла при вход
- Проверете дали акаунтът е създаден в Authentication → Users

### `confirm_booking` или `reserve_slot` функции не работят
- Уверете се, че RPC функциите са изпълнени в SQL Editor
- Проверете дали са с `SECURITY DEFINER` (важно за RLS обход)
- В Supabase → Database → Functions проверете дали функциите съществуват

### Календарът показва грешни дати
- Проверете дали датите в `time_slots` са в правилния формат `YYYY-MM-DD`
- Уверете се, че сървърният timezone на Supabase е настроен правилно

### Снимките на лекарите не се показват
- URL-ът на снимката трябва да е публично достъпен (https://)
- Ако използвате Supabase Storage: направете bucket-а публичен
- Ако снимката не се зареди, ще се покаже цветен аватар с инициали

---

## Контакти

**Ilchevska Pharmacy**
- Адрес: ул. Тракия 18, кв. Устово, Смолян
- Телефон: 0301 808 36
- Имейл: todor@ilchevska.bg
