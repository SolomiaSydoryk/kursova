Курсовий проєкт з дисципліни "Документування програмного забезпечення та шаблони проектування". Онлайн-сервіс бронювання спортивних залів та секцій

**Мета роботи:** Практичне засвоєння методів проектування та розробки програмного забезпечення із використанням технології об'єктно-орієнтованого програмування та шаблонів проектування.

---

## Архітектура проєкту

Проєкт використовує **3-рівневу архітектуру (Three-Tier Architecture)**:

1. **Presentation Layer (Frontend)** - React.js інтерфейс користувача
2. **Business Logic Layer (Backend)** - Django REST Framework API
3. **Data Access Layer** - Django ORM з SQLite базою даних

**Додаткові архітектурні рішення:**
- RESTful API для комунікації між frontend та backend
- JWT Authentication для безпечної аутентифікації
- Service Layer Pattern для інкапсуляції бізнес-логіки
- Layered Architecture з чітким розділенням відповідальностей

---

## Структура проєкту

```
kursovasoftware/
├── api/                          # Django backend додаток
│   ├── management/
│   │   └── commands/
│   │       └── seed.py           # Команда для заповнення тестовими даними
│   ├── migrations/               # Міграції бази даних
│   ├── services/                 # Бізнес-логіка та патерни (Service Layer)
│   │   ├── booking.py            # Логіка бронювань
│   │   ├── card_factory.py       # Factory Method для карток
│   │   ├── loyalty.py            # Система лояльності
│   │   ├── notification.py       # Створення сповіщень
│   │   ├── observer_pattern.py   # Observer Pattern
│   │   └── payment_strategies.py # Strategy Pattern для оплат
│   ├── models.py                 # Django моделі (ORM)
│   ├── serializers.py            # DRF серіалізатори
│   ├── signals.py                # Django signals (Pub/Sub)
│   ├── urls.py                   # URL маршрутизація
│   └── views.py                  # REST-контролери (API views)
├── booking_project/              # Django project settings
│   ├── settings.py
│   └── urls.py
├── frontend/                      # React.js frontend
│   └── src/
│       ├── components/           # React компоненти
│       │   ├── bookings/         # Компоненти бронювань
│       │   ├── catalog/          # Компоненти каталогу
│       │   └── common/           # Загальні компоненти
│       ├── pages/                # Сторінки додатку
│       │   ├── admin/            # Адміністративні сторінки
│       │   └── client/            # Клієнтські сторінки
│       ├── services/             # API сервіси
│       └── theme/                # Теми та стилі
├── media/                         # Завантажені файли (фото користувачів)
├── manage.py                      # Django management script
├── requirements.txt               # Python залежності
└── db.sqlite3                     # SQLite база даних
```

---

## GoF-шаблони проектування

### 1. **Strategy Pattern** 
**Файл:** `api/services/payment_strategies.py`

Інкапсулює різні алгоритми оплати в окремі класи:
- `PaymentStrategy` (абстрактний клас)
- `CardPaymentStrategy` - оплата карткою онлайн
- `CashPaymentStrategy` - оплата готівкою на місці
- `BonusPaymentStrategy` - оплата бонусними балами

**Переваги:** Легко додати нові способи оплати без зміни існуючого коду, відокремлення логіки оплати від основної бізнес-логіки.

### 2. **Factory Method Pattern** 
**Файл:** `api/services/card_factory.py`

Створення різних типів карток лояльності:
- `CardFactory` (абстрактна фабрика)
- `StandardCardFactory` - створення стандартних карток
- `PremiumCardFactory` - створення преміум карток
- `CardFactoryMethod` - метод для отримання відповідної фабрики

**Переваги:** Інкапсуляція логіки створення об'єктів, легке розширення для нових типів карток.

### 3. **Observer Pattern**
**Файл:** `api/services/observer_pattern.py`

Сповіщення різних компонентів про створення нових сповіщень:
- `Observer` (абстрактний спостерігач)
- `UIObserver` - обробка для UI
- `LogObserver` - логування сповіщень
- `NotificationSubject` - суб'єкт, який сповіщає спостерігачів
- `NotificationManager` - Singleton для управління сповіщеннями

**Переваги:** Слабке зв'язування між компонентами, легко додати нові канали сповіщень (email, SMS) без зміни основного коду.

### 4. **Singleton Pattern** 
**Файл:** `api/services/observer_pattern.py` (клас `NotificationManager`)

Забезпечення єдиного екземпляра менеджера сповіщень для глобального доступу до системи сповіщень.

---

## Архітектурні стилі та принципи

### SOLID принципи

- **SRP (Single Responsibility)** - кожен сервіс відповідає за одну область (`BookingService`, `LoyaltyService`, `PaymentStrategy`)
- **OCP (Open/Closed)** - стратегії оплати та спостерігачі можна розширювати без зміни існуючого коду
- **LSP (Liskov Substitution)** - конкретні стратегії та фабрики можуть замінювати абстрактні класи
- **ISP (Interface Segregation)** - абстрактні класи містять тільки необхідні методи
- **DIP (Dependency Inversion)** - високорівневі модулі залежать від абстракцій, а не від конкретних реалізацій

### GRASP патерни

- **Information Expert** - `BookingService` (`api/services/booking.py`) містить знання про правила бронювання, `LoyaltyService` (`api/services/loyalty.py`) - про розрахунок бонусів
- **Creator** - `BookingService` створює `Reservation`, `CardFactory` (`api/services/card_factory.py`) створює `Card`
- **Controller** - `BookingCreateView` (`api/views.py`) координує створення бронювання, `UpdateReservationStatusView` - оновлення статусу
- **Low Coupling** - сервіси слабо пов'язані між собою через використання абстракцій (Strategy, Observer)
- **High Cohesion** - класи з високою зв'язністю: `BookingService`, `LoyaltyService`, `PaymentStrategy`

### KISS (Keep It Simple, Stupid)

Принцип простоти реалізовано через:
- **Service Layer** (`api/services/`) - проста структура з чіткими методами (`create_booking`, `award_points_for_reservation`)
- **Чіткі назви** - зрозумілі назви класів та методів (`BookingService`, `LoyaltyService`, `CardPaymentStrategy`)
- **Мінімальна складність** - уникнення надмірної абстракції, прямолінійна логіка в `api/views.py`
- **Проста структура моделей** - Django ORM моделі (`api/models.py`) з мінімальною складністю

### DRY (Don't Repeat Yourself)

Уникнення повторення коду досягнуто через:
- **Функція `create_and_notify`** (`api/services/notification.py`) - використовується в `BookingService`, `LoyaltyService`, `signals.py` замість повторення логіки створення сповіщень
- **Service класи** - інкапсуляція повторюваної бізнес-логіки (`BookingService.create_booking`, `LoyaltyService.calculate_points`)
- **Django ORM** - уникнення повторення SQL запитів через ORM методи
- **Абстракції** - Strategy Pattern (`api/services/payment_strategies.py`) та Factory Method (`api/services/card_factory.py`) для уникнення дублювання логіки
- **ViewSets** - використання DRF ViewSets (`HallViewSet`, `SectionViewSet`) замість повторюваних CRUD операцій

### YAGNI (You Aren't Gonna Need It)

Принцип "не додавати непотрібне" застосовано:
- **Видалення email/SMS нотифікацій** - видалено `EmailNotifier`, `SMSNotifier` з `api/services/notification.py`, залишено тільки UI сповіщення
- **Видалення полів з Notification** - міграції `0012_remove_notification_send_fields.py` та `0013_remove_notification_is_read.py` видалили невикористовувані поля `send_at`, `is_sent`, `sent_at`, `is_read`
- **Видалення команди send_pending_notifications** - видалено `api/management/commands/send_pending_notifications.py`, оскільки сповіщення створюються одразу
- **Тільки необхідна функціональність** - реалізовано тільки те, що потрібно зараз (UI сповіщення, без відкладених)

### Архітектурні стилі

1. **Layered Architecture** - чітке розділення на рівні (Presentation, Business, Data)
2. **RESTful API** - стандартизована комунікація через HTTP
3. **Service Layer Pattern** - інкапсуляція бізнес-логіки в сервісах
4. **Repository Pattern** (частково) - Django ORM як репозиторій для доступу до даних

---

## Технологічний стек

### Backend
- Python 3.x
- Django 5.2.6 - веб-фреймворк
- Django REST Framework 3.16.1 - REST API
- djangorestframework-simplejwt 5.5.1 - JWT аутентифікація
- Pillow 11.3.0 - обробка зображень
- django-cors-headers 4.9.0 - CORS підтримка
- SQLite3 - база даних

### Frontend
- React 19.2.0 - UI бібліотека
- Material-UI (MUI) 7.3.5 - компоненти інтерфейсу
- React Router DOM 7.9.6 - маршрутизація
- Axios 1.13.2 - HTTP клієнт
- @mui/x-date-pickers 8.21.0 - компоненти вибору дати
- date-fns 4.1.0 - робота з датами

### Інструменти розробки
- ESLint - лінтер для JavaScript
- Django Migrations - управління схемою БД

---

## API Endpoints

### Аутентифікація
- `POST /api/auth/register/` - Реєстрація користувача
- `POST /api/auth/login/` - Вхід через email
- `GET /api/auth/profile/` - Отримання профілю
- `PUT /api/auth/profile/` - Оновлення профілю

### Бронювання
- `POST /api/bookings/create/` - Створення бронювання
- `GET /api/bookings/my/` - Мої бронювання
- `GET /api/bookings/all/` - Всі бронювання (тільки адміністратор)
- `PATCH /api/bookings/<id>/status/` - Оновлення статусу (тільки адміністратор)

### Зали та секції
- `GET /api/halls/`, `POST /api/halls/` - CRUD операції для залів
- `GET /api/sections/`, `POST /api/sections/` - CRUD операції для секцій
- `GET /api/trainers/` - Список тренерів

### Timeslots та розклад
- `GET /api/sections/<id>/timeslots/` - Timeslots для секції
- `GET /api/available-timeslots/` - Доступні timeslots
- `POST /api/timeslots/create/` - Створення timeslot (тільки адміністратор)
- `GET /api/schedule/`, `POST /api/schedule/` - CRUD операції для розкладу

### Лояльність
- `GET /api/loyalty/me/` - Моя інформація про лояльність
- `POST /api/loyalty/redeem/` - Використання бонусних балів

### Сповіщення та абонементи
- `GET /api/notifications/` - Список сповіщень користувача
- `GET /api/subscriptions/` - Список доступних абонементів
- `POST /api/subscriptions/<id>/purchase/` - Покупка абонемента
- `GET /api/subscriptions/my/` - Мої абонементи

---

## Основні компоненти

### Backend

**Моделі** (`api/models.py`): `CustomUser`, `Card`, `Subscription`, `UserSubscription`, `Hall`, `Section`, `Trainer`, `TimeSlot`, `SectionSchedule`, `Reservation`, `Notification`

**Сервіси** (`api/services/`):
- `BookingService` - логіка створення та валідації бронювань
- `LoyaltyService` - розрахунок та нарахування бонусних балів
- `Payment Strategies` - різні способи оплати (Strategy Pattern)
- `Card Factory` - створення карток (Factory Method Pattern)
- `Observer Pattern` - система сповіщень
- `Notification Service` - створення та відправка сповіщень

**Views** (`api/views.py`): `BookingCreateView`, `UpdateReservationStatusView`, `HallViewSet`, `SectionViewSet`, `ProfileView`

### Frontend

**Сторінки** (`frontend/src/pages/`):
- Клієнтські: `CatalogPage`, `BookingConfirmPage`, `BookingsHistoryPage`, `ProfilePage`, `SubscriptionsPage`, `NotificationsPage`
- Адміністративні: `AdminDashboard`, `CreateHallPage`, `EditHallPage`, `CreateSectionPage`, `EditSectionPage`, `ReservationsManagementPage`

**Компоненти** (`frontend/src/components/`): `BookingDialog`, `PaymentDialog`, `TimeSlotSelector`, `SectionCard`, `HallCard`, `SectionFilters`, `HallFilters`

**Сервіси** (`frontend/src/services/`): `api.js`, `authService.js`, `bookingService.js`, `hallService.js`, `sectionService.js`, `notificationService.js`

---

## Налаштування та запуск

### Вимоги
- Python 3.8+
- Node.js 14+
- npm або yarn

### Backend

1. Створення та активація віртуального середовища:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

2. Встановлення залежностей та застосування міграцій:
```bash
pip install -r requirements.txt
python manage.py migrate
```

3. Створення суперкористувача та заповнення тестовими даними (опціонально):
```bash
python manage.py createsuperuser
python manage.py seed
```

4. Запуск сервера:
```bash
python manage.py runserver
```
Сервер запуститься на `http://127.0.0.1:8000/`

### Frontend

1. Встановлення залежностей:
```bash
cd frontend
npm install
```

2. Запуск додатку:
```bash
npm start
```
Додаток відкриється на `http://localhost:3000/`

### Доступ до адміністративної панелі Django
- URL: `http://127.0.0.1:8000/admin/`
- Використовуйте облікові дані суперкористувача

---

## Особливості реалізації

**Система лояльності:**
- Бонуси нараховуються тільки за бронювання секцій
- Premium картка дає 50% знижку на плавання
- Бонуси можна використовувати для оплати

**Бронювання:**
- Секції бронюються автоматично (статус CONFIRMED)
- Зали потребують підтвердження адміністратора (статус PENDING)
- Секції блокують зали на той самий день

**Оплата:**
- Онлайн карткою - миттєва оплата та нарахування бонусів
- Готівкою на місці - очікує підтвердження адміністратора
- Абонементом - використання активного абонемента
- Бонусами - часткова або повна оплата бонусними балами

**Сповіщення:**
- Нагадування про бронювання
- Сповіщення про нарахування бонусів
- Промо-сповіщення про нові секції
- Сповіщення про зміну статусу бронювання

