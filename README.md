# Didgi Real Payment

Небольшой NestJS-сервис для списания баланса пользователя. Проект компактный, но реализует основные части платежного сценария: валидация на входе, транзакционное обновление баланса, история операций, идемпотентность, health-check endpoints, Docker-окружение и отдельный контейнер для миграций.

## Что Реализовано

- Получение баланса пользователя.
- Получение истории изменения баланса с пагинацией.
- Списание баланса пользователя.
- Транзакционное обновление баланса и запись истории.
- Идемпотентность через заголовок `Idempotency-Key`.
- PostgreSQL-схема и миграции.
- Валидация переменных окружения через `ConfigModule` и Zod.
- Валидация request params/body/query через Standard Schema в NestJS.
- Repository layer между бизнес-логикой и базой данных.
- Структурированное HTTP-логирование на встроенном logger-е NestJS.
- Unit-тесты на Vitest.
- Multistage Dockerfile с отдельными target-ами `prod`, `dev`, `migration`.
- Docker Compose с PostgreSQL, migration-контейнером и контейнером приложения.
- Swagger-документация API на `/docs`.

## Стек

- Node.js 24
- NestJS 12
- TypeScript
- PostgreSQL
- Prisma ORM 8 RC с `@prisma/orm-postgres`
- Zod
- Vitest
- Docker / Docker Compose

## Документация API

После запуска приложения Swagger доступен по адресу:

```text
http://localhost:3000/docs
```


Деньги хранятся в центах, чтобы не работать с floating point для денежных значений. Например, `$100.00` хранится как `10000`.

## Основные Решения

### Транзакционное Списание

Списание баланса и запись истории выполняются в одной транзакции. Само обновление баланса сделано атомарно на уровне базы данных и защищено условием:

```sql
balance_cents >= amount
```

Это не дает балансу уйти в минус, даже если два запроса придут одновременно.

Большинство операций чтения и вставки сделаны через Prisma ORM. Само списание баланса выполнено через небольшой raw SQL-запрос, потому что для PostgreSQL это самый простой и явный способ сделать атомарное условное обновление:

```sql
UPDATE users
SET balance_cents = balance_cents - amount
WHERE id = user_id
  AND balance_cents >= amount
RETURNING ...
```

Поддержание консистентности данных лучше доверить базе данных, а не проверять только на уровне приложения.

### Идемпотентность

Endpoint списания принимает заголовок `Idempotency-Key`. Если клиент повторяет запрос с тем же ключом и той же суммой, сервис возвращает уже созданный результат и не списывает деньги второй раз.

Если тот же ключ используется с другой суммой, сервис возвращает conflict. Это защищает от ситуации, когда клиент повторяет запрос после timeout-а или сетевой ошибки и случайно списывает деньги повторно.

### Repository Layer

Традиционно детали работы с базой изолированы в repository. Это относится к доменной логике `users` и `payments`; `health` оставлен без отдельного repository, потому что там нет бизнес-операций, а есть только инфраструктурная проверка доступности базы. Также этот подход упрощает тестирование: `PaymentsService` можно проверить через in-memory stub repository, не поднимая NestJS-приложение и PostgreSQL.

### Валидация

Переменные окружения валидируются при старте приложения. Params, body и query валидируются на границе controller-ов через Standard Schema поддержку NestJS и Zod-схемы.

### Пагинация

Пагинация нужна только для истории баланса, потому что она может расти бесконечно. Используется offset-пагинация:

```http
GET /users/1/history?limit=20&offset=0
```

Cursor-пагинация была бы стабильнее при очень высокой нагрузке и постоянных вставках, но для тестового задания offset-подход проще, понятнее в Swagger и полностью закрывает текущий сценарий.

### Логирование

В проекте используется встроенный logger NestJS и HTTP interceptor. Логируются метод, путь, params, query, body, response, status code, duration и структурированные детали ошибок.

Pino был бы хорошим вариантом для production-сервиса, но для этого задания встроенный logger уменьшает количество инфраструктурных зависимостей и при этом показывает основной request/response flow.

## Почему Prisma ORM 8

Для такого маленького сервиса Prisma ORM 8 — не самый легкий выбор. Можно было взять ORM с меньшим весом пакетов, 7 версию со стабильными интерфейсами, к тому же даже простого query builder-а было бы достаточно, а dependency tree и Docker image получились бы меньше.

Но все-таки я выбрал Prisma 8 по двум причинам:

1. В задании был разрешен и даже приветствовался NestJS, а Prisma — привычная технология в NestJS-экосистеме.
2. Мне было интересно посмотреть новую версию Prisma.

Конечно, в production сценарии я бы рассмотрел более легковесные и/или зрелые инструменты. Но в тестовом задании дух исследователя взял верх)

## Структура Проекта

```text
src/
  core/
    config/
    database/
    errors/
    filters/
    logging/
    money/
    swagger/
  modules/
    health/
    payments/
    users/
  app.module.ts
  main.ts

prisma/
  contract.prisma
  generated/
  migrations/
  seed.ts
```

`core` содержит общую инфраструктуру. `modules` содержит функциональные модули приложения.

## Environment

Для локального запуска нужно создать `.env`:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgresql://didgi_real_payment:didgi_real_payment@localhost:5432/didgi_real_payment
```

Для Docker используется отдельный файл `.env.docker`, чтобы не переименовывать строки подключения между локальным запуском и Docker-сетью.

## Локальный Запуск

Установить зависимости:

```bash
npm install
```

Сгенерировать Prisma contract files:

```bash
npm run prisma:emit
```

Применить миграции к базе из `DATABASE_URL`:

```bash
npm run prisma:migrate
```

Создать пользователя `id = 1`:

```bash
npm run prisma:seed
```

Запустить приложение в dev-режиме:

```bash
npm run start:dev
```

## Запуск Через Docker

Собрать и запустить PostgreSQL, migration-контейнер и приложение:

```bash
docker compose up --build
```

Если volume PostgreSQL уже существует и нужна чистая база:

```bash
docker compose down -v
docker compose up --build
```

Ожидаемый порядок запуска:

- `postgres` стартует и становится healthy.
- `migration` применяет миграции и завершается с кодом `0`.
- `app` стартует после успешного выполнения миграций.

Проверить приложение:

```bash
curl http://localhost:3000/health
```

## Скрипты

```bash
npm run build          # Собрать Nest-приложение
npm run start:dev      # Запустить приложение в watch mode
npm run start:prod     # Запустить собранное приложение
npm run test           # Запустить unit-тесты
npm run lint           # Запустить oxlint
npm run format         # Отформатировать source и test файлы
npm run prisma:emit    # Сгенерировать Prisma ORM 8 contract files
npm run prisma:migrate # Применить Prisma ORM 8 миграции
npm run prisma:verify  # Проверить database contract
npm run prisma:seed    # Создать начального пользователя
```

## Тесты

```bash
npm test
```

Текущие unit-тесты проверяют:

- успешное списание;
- недостаток средств;
- идемпотентный повтор запроса;
- конфликт идемпотентности;
- валидацию body для списания.


