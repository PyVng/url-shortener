# Инструкция по обновлению Supabase

## Шаг 1: Обновить RLS политики

1. Зайдите в **Supabase Dashboard**: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (левое меню)
4. Выполните следующие команды для обновления политик:

```sql
-- Сначала удалите старые конфликтующие политики (если есть)
DROP POLICY IF EXISTS "Users can view own urls" ON urls;
DROP POLICY IF EXISTS "Users can insert own urls" ON urls;

-- Создайте новые политики с анонимным доступом
CREATE POLICY "Allow anonymous read all urls" ON urls
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert" ON urls
  FOR INSERT WITH CHECK (true);

-- Пересоздайте политики для авторизованных пользователей
CREATE POLICY "Users can view own urls" ON urls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own urls" ON urls
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Шаг 2: Убедитесь, что Email Authentication включен

1. В Supabase Dashboard перейдите в **Authentication** → **Providers**
2. Найдите **Email** провайдер
3. Убедитесь, что он **включен**
4. Для тестирования можно отключить **Confirm email** (установите переключатель в OFF)

## Шаг 3: Проверьте тестового пользователя

Убедитесь, что в базе есть тестовый пользователь:
- Email: `krupnovsergey@gmail.com`
- Password: `123123qqq`

Если нет, создайте его:
1. **Authentication** → **Users** → **Add User**
2. Введите email и пароль
3. Auto Confirm User: **ON**

## Шаг 4: Запустите тесты снова

После обновления базы данных запустите:

```bash
npm run test:all
```

## Что было исправлено:

1. ✅ **CSS для header-container** - добавлен `display: block !important`
2. ✅ **RLS политики** - добавлен анонимный доступ для чтения и создания URL
3. ✅ **Документация** - обновлены инструкции по настройке

## Ожидаемый результат:

После этих изменений E2E тесты должны проходить успешно, так как:
- Header будет отображаться корректно
- Анонимные пользователи смогут создавать и читать короткие ссылки
- Авторизованные пользователи смогут управлять своими ссылками
