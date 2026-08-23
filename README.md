# IFC Viewer

Веб-приложение для загрузки, просмотра и анализа IFC-моделей (BIM) прямо в браузере. Фронтенд на React + Three.js рендерит 3D-модель и дерево структуры здания, бэкенд на Django REST Framework хранит и отдаёт IFC-файлы через REST API с JWT-аутентификацией.

## Возможности

- Загрузка и отображение IFC-моделей в 3D-просмотрщике (web-ifc / Three.js)
- Дерево пространственной структуры модели с навигацией по элементам
- Подсветка объектов при клике в 3D-сцене или в дереве, синхронизация выделения
- Панель свойств объекта (атрибуты + property sets) с копированием в JSON
- Скрытие/показ отдельных элементов и целых веток дерева
- Срезы (clipping planes): создание по двойному клику, перемещение/вращение/масштабирование и удаление с клавиатуры
- Переключение светлой/тёмной темы
- Управление файлами в облаке: загрузка на сервер, список, скачивание, удаление
- Аутентификация пользователей по JWT
- Backend-тесты (pytest), нагрузочное тестирование (Locust), unit-тесты фронтенда (Vitest)

## Стек технологий

**Frontend:** React, Vite, Three.js, web-ifc / web-ifc-viewer, Zod, Vitest + Testing Library, ESLint

**Backend:** Django, Django REST Framework, djangorestframework-simplejwt (JWT), pytest, Locust

**Инфраструктура:** Docker, docker-compose, Nginx (раздача собранного фронтенда), PostgreSQL (в Docker) / SQLite (локальная разработка)

## Структура проекта

```
.
├── docker-compose.yml
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── locustfile.py
│   ├── Dockerfile
│   ├── backend/               # настройки Django (settings, urls, wsgi, asgi)
│   ├── api/                   # приложение с логикой загрузки/выдачи IFC-файлов
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── migrations/
│   │   └── tests/
│   │       ├── test_api_upload.py
│   │       ├── test_api_download.py
│   │       ├── test_api_list_delete.py
│   │       ├── test_integrity.py
│   │       ├── test_models.py
│   │       ├── test_performance.py
│   │       └── fixtures/      # small/medium/large.ifc — фикстуры для тестов
│   └── uploads/uploads/       # загруженные пользователями IFC-файлы (в .gitignore)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── Dockerfile
    ├── public/
    │   └── wasm/               # web-ifc.wasm, web-ifc-mt.wasm
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── IfcViewer/      # сам просмотрщик и хуки (useClipping, useIfcModel, useIfcViewer, useVisibility, useKeyboard)
        │   ├── shared/         # TreePanel, TreeNode, PropertiesPanel, ClippingPanel, ClippingControls, Loader
        │   └── ui/utils/       # clippingLogic, threeUtils, safeStringify
        └── tests/unit/App.test.jsx
```

## Быстрый старт

### Через Docker (рекомендуется)

```bash
git clone <URL-вашего-репозитория>
cd <папка-проекта>
cp backend/.env.example backend/.env   # заполнить реальными значениями
docker-compose up --build
```

- Backend будет доступен на `http://localhost:8000`
- Frontend (через Nginx) — на `http://localhost:3000`

### Локальная разработка — backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Локальная разработка — frontend

```bash
cd frontend
npm install
npm run dev
```

## Переменные окружения

```env
SECRET_KEY=change-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Используется, если backend работает через docker-compose с Postgres.
# Для локального запуска без Docker по умолчанию используется SQLite (db.sqlite3).
POSTGRES_DB=mydb
POSTGRES_USER=myuser
POSTGRES_PASSWORD=change-me
POSTGRES_HOST=db
POSTGRES_PORT=5432
```
## API

| Метод | Эндпоинт | Описание |
|---|---|---|
| POST | `/api/token/` | Получение JWT-токена (логин) |
| POST | `/api/upload/` | Загрузка IFC-файла |
| GET | `/api/files/` | Список загруженных файлов |
| GET | `/api/file/<filename>/` | Скачивание файла |
| DELETE | `/api/delete/<filename>/` | Удаление файла |

## Тестирование

**Backend (pytest):**
```bash
cd backend
pytest
```

**Нагрузочное тестирование (Locust):**
```bash
cd backend
locust -f locustfile.py
```
Панель Locust — `http://localhost:8089`.

**Frontend (Vitest):**
```bash
cd frontend
npm run test
```

## Управление срезами (Clipping)

| Действие | Клавиши |
|---|---|
| Добавить новый срез | Двойной клик на модели |
| Выбрать срез | Одиночный клик на плоскость |
| Двигать срез вдоль локальных осей | Стрелки ↑↓←→ |
| Изменить размер / масштаб | PageUp / PageDown |
| Вращать вокруг осей | Shift + стрелки — по одной оси, Ctrl + стрелки — по другой |
| Удалить выделенный срез | Delete / Backspace |
