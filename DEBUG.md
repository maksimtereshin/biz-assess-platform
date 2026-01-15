# Debug Guide for BizAssess Platform

Руководство по настройке и использованию отладчика в Cursor IDE.

## Быстрый старт

### Вариант 1: Local Debug (Рекомендуется)

**Самый простой способ - запуск backend локально с отладчиком:**

1. **Остановите Docker backend контейнер:**
   ```bash
   docker stop bizass-backend-dev
   ```

2. **В Cursor откройте Run and Debug panel:**
   - Нажмите `Cmd+Shift+D` (macOS) или `Ctrl+Shift+D` (Windows/Linux)
   - Или нажмите на иконку "Run and Debug" в левой панели

3. **Выберите конфигурацию:**
   - Выберите `🐛 Backend: Debug (Local)` из dropdown
   - Нажмите зелёную кнопку "Start Debugging" (F5)

4. **Поставьте breakpoint:**
   - Откройте любой файл (например, `backend/src/main.ts`)
   - Кликните слева от номера строки - появится красная точка
   - Когда выполнение дойдёт до этой строки, программа остановится

5. **Запросы будут останавливаться на breakpoints:**
   - Используйте Postman/curl для отправки запросов
   - Или откройте frontend в браузере

### Вариант 2: Docker Debug

**Отладка внутри Docker контейнера (ближе к production):**

1. **Убедитесь что backend контейнер запущен с debug:**
   ```bash
   ./dev.sh up
   ```

2. **Проверьте что debug порт открыт:**
   ```bash
   docker ps | grep bizass-backend-dev
   # Должно быть: 0.0.0.0:9229->9229/tcp
   ```

3. **В Cursor выберите конфигурацию:**
   - `🐳 Backend: Attach to Docker`
   - Нажмите F5

4. **Поставьте breakpoints и тестируйте**

---

## Детальная настройка

### Конфигурация Cursor

Файл `.vscode/launch.json` содержит 3 конфигурации:

#### 1. 🐛 Backend: Debug (Local)

**Что делает:**
- Запускает backend локально (вне Docker)
- Автоматически перезапускается при изменении кода
- Использует `npm run start:debug`

**Когда использовать:**
- ✅ Быстрая отладка
- ✅ Быстрый рестарт после изменений
- ✅ Полный доступ к source maps

**Требования:**
- Остановить Docker backend: `docker stop bizass-backend-dev`
- PostgreSQL должен быть запущен: `docker ps | grep postgres`

---

#### 2. 🐳 Backend: Attach to Docker

**Что делает:**
- Подключается к запущенному Docker контейнеру
- Контейнер должен быть запущен с --inspect

**Когда использовать:**
- ✅ Отладка в environment близком к production
- ✅ Проверка Docker-specific issues
- ✅ Когда нужно отлаживать взаимодействие сервисов

**Требования:**
- Контейнер запущен: `./dev.sh up`
- Debug порт открыт (уже настроено в docker-compose.dev.yml)

---

#### 3. 🧪 Backend: Debug Tests

**Что делает:**
- Запускает Jest тесты с отладчиком
- Останавливается на breakpoints в тестах

**Когда использовать:**
- ✅ Отладка failing tests
- ✅ Написание сложных test cases
- ✅ Debugging test helpers

**Как использовать:**
```bash
# 1. Поставьте breakpoint в тесте
# Например: backend/src/auth/auth.service.spec.ts

# 2. Выберите конфигурацию "🧪 Backend: Debug Tests"
# 3. Нажмите F5
```

---

## Горячие клавиши отладчика

| Клавиша | Действие |
|---------|----------|
| `F5` | Start/Continue debugging |
| `F9` | Toggle breakpoint |
| `F10` | Step over (следующая строка) |
| `F11` | Step into (войти в функцию) |
| `Shift+F11` | Step out (выйти из функции) |
| `Shift+F5` | Stop debugging |
| `Cmd+Shift+F5` | Restart debugging |

---

## Типы breakpoints

### 1. Line Breakpoint (обычный)

Кликните слева от номера строки:
```typescript
function authenticate(username: string) {
  // ← Кликните здесь
  const user = await findUser(username);
  return user;
}
```

### 2. Conditional Breakpoint

Правый клик на breakpoint → "Edit Breakpoint" → "Conditional Breakpoint":
```typescript
username === "maksim_tereshin"  // Остановится только для этого username
```

### 3. Logpoint

Правый клик на breakpoint → "Edit Breakpoint" → "Logpoint":
```typescript
User: {username}, ID: {user.id}  // Выведет в console, не останавливая выполнение
```

---

## Примеры отладки

### Пример 1: Отладка AdminJS authentication

1. **Поставьте breakpoint в auth provider:**
   ```typescript
   // backend/src/admin/providers/telegram-auth.provider.ts
   authenticate: async (context: any) => {
     const { request } = context;
     const { initData } = request.body || {};  // ← BREAKPOINT ЗДЕСЬ

     if (!initData) {
       console.error('[AUTH] No initData provided');
       return null;
     }
   }
   ```

2. **Запустите debug:** `🐛 Backend: Debug (Local)`

3. **Откройте админ-панель через Telegram bot**

4. **Программа остановится на breakpoint:**
   - Проверьте значение `initData`
   - Посмотрите `request.body`
   - Используйте Debug Console для вычисления выражений

### Пример 2: Отладка Telegram webhook

1. **Breakpoint в webhook handler:**
   ```typescript
   // backend/src/telegram/telegram.service.ts
   async handleWebhook(payload: TelegramWebhookPayload) {
     this.logger.log('Received webhook payload');  // ← BREAKPOINT ЗДЕСЬ

     // Остановится на каждом webhook от Telegram
   }
   ```

2. **Запустите debug**

3. **Отправьте команду боту**

4. **Изучите payload:**
   - Hover over `payload` - увидите содержимое
   - Expand объект в Variables panel
   - Используйте Watch expressions для отслеживания значений

### Пример 3: Отладка database queries

1. **Breakpoint в repository:**
   ```typescript
   // backend/src/admin/admin.service.ts
   async findByUsername(telegramUsername: string): Promise<Admin | null> {
     const normalizedUsername = telegramUsername.trim().toLowerCase();  // ← BREAKPOINT
     return this.adminRepository.findOne({
       where: { telegram_username: ILike(normalizedUsername) },
     });
   }
   ```

2. **Watch expressions:**
   - Добавьте `telegramUsername` в Watch panel
   - Добавьте `normalizedUsername` после вычисления
   - Посмотрите результат query в `result` variable

---

## Debug Console

Во время остановки на breakpoint вы можете:

### Выполнять код

```typescript
// В Debug Console введите:
request.body
request.headers
telegramUsername.toLowerCase()
await this.adminService.isAdmin('maksim_tereshin')
```

### Изменять переменные

```typescript
// Изменить значение переменной:
telegramUsername = "test_user"
```

### Вызывать функции

```typescript
// Вызвать любую функцию из scope:
this.logger.log('Debug message')
console.log(JSON.stringify(payload, null, 2))
```

---

## Troubleshooting

### Problem: "Cannot connect to runtime process"

**Причина:** Backend не запущен с --inspect флагом

**Решение:**
```bash
# Для Local Debug:
docker stop bizass-backend-dev
# Потом в Cursor: F5 на "Backend: Debug (Local)"

# Для Docker Debug:
./dev.sh rebuild  # Перезапустит с debug флагом
```

---

### Problem: Breakpoints неактивны (серые)

**Причина:** Source maps не загружены или путь неверный

**Решение:**
1. Убедитесь что backend скомпилирован: `cd backend && npm run build`
2. Проверьте что `outFiles` в launch.json указывает на `dist/`
3. Перезапустите debugger: `Cmd+Shift+F5`

---

### Problem: "Port 9229 already in use"

**Причина:** Другой процесс использует debug порт

**Решение:**
```bash
# Найти процесс:
lsof -i :9229

# Убить процесс:
kill -9 <PID>

# Или перезапустите Docker:
./dev.sh restart
```

---

### Problem: Breakpoints не срабатывают в Docker

**Причина:** Пути source maps не совпадают

**Решение:**
1. Проверьте `localRoot` и `remoteRoot` в конфигурации `Attach to Docker`
2. Убедитесь что volumes правильно смонтированы в docker-compose.dev.yml
3. Перезапустите контейнер: `docker restart bizass-backend-dev`

---

## Best Practices

### 1. Используйте conditional breakpoints

Вместо:
```typescript
if (username === "maksim_tereshin") {
  debugger;  // ❌ Плохо - нужно удалить после debug
}
```

Используйте Conditional Breakpoint:
```
username === "maksim_tereshin"  // ✅ Хорошо - не нужно менять код
```

### 2. Logpoints вместо console.log

Вместо:
```typescript
console.log('User:', username);  // ❌ Плохо - останется в коде
```

Используйте Logpoint:
```
User: {username}  // ✅ Хорошо - не изменяет код
```

### 3. Watch expressions для мониторинга

Добавьте в Watch panel:
```
request.body.initData
validatedData.user?.username
admin?.telegram_username
```

Будут обновляться автоматически на каждом breakpoint.

---

## Полезные команды

### Проверить что debug работает

```bash
# Local debug:
ps aux | grep "nest start --debug"

# Docker debug:
docker exec bizass-backend-dev ps aux | grep node
# Должно быть: --inspect=0.0.0.0:9229
```

### Логи Docker контейнера

```bash
# Все логи:
docker logs bizass-backend-dev

# Follow логи (real-time):
docker logs -f bizass-backend-dev

# Последние 50 строк:
docker logs --tail 50 bizass-backend-dev
```

### Перезапуск с очисткой

```bash
# Полная очистка и rebuild:
./dev.sh rebuild

# Только backend:
docker restart bizass-backend-dev
```

---

## Дополнительные ресурсы

- [Cursor Debug Documentation](https://cursor.sh/docs)
- [VS Code Node.js Debugging](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
- [NestJS Debugging Guide](https://docs.nestjs.com/recipes/debugging)
- [Node.js Inspector](https://nodejs.org/en/docs/guides/debugging-getting-started/)

---

## Быстрые команды для копирования

### Start Local Debug
```bash
docker stop bizass-backend-dev && cd /Users/maksimtereshin/Projects/Personal/biz-assess-platform/backend && npm run start:debug
```

### Start Docker Debug
```bash
./dev.sh up
```

### Rebuild Everything
```bash
./dev.sh rebuild
```

---

**Удачной отладки! 🐛**
