# Autenticación (servidor)

## Flujo

1. **Registro** — `POST /api/auth/register` valida email/contraseña (mín. 8 caracteres), hashea con bcrypt y guarda en `data/accounts.json`.
2. **Login** — `POST /api/auth/login` verifica credenciales y emite cookie `locker_session` (JWT firmado, httpOnly).
3. **Sesión** — `GET /api/auth/session` devuelve `{ user: { email, role } | null }`.
4. **Logout** — `POST /api/auth/logout` borra la cookie.

## Protección de rutas

`src/middleware.ts` redirige a `/login` si no hay sesión válida en `/agenda` y `/perfil`.

## Producción

- Definir `SESSION_SECRET` en variables de entorno (ver `.env.example`).
- Sustituir `data/accounts.json` por base de datos (PostgreSQL, Supabase, etc.).
- Añadir verificación de email, recuperación de contraseña y rate limiting en API.
