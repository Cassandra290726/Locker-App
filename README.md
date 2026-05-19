# Locker App

Aplicación web educativa (docentes y alumnos) para registro, inicio de sesión y acceso a opciones (agenda, perfil). UI con **react-native-web** sobre **Next.js App Router**.

## Stack

- Next.js 16, React 19, TypeScript
- react-native-web (pantallas tipo móvil)
- Tailwind CSS 4 (páginas protegidas y layout)
- Autenticación en servidor: bcrypt + JWT en cookie httpOnly (`jose`)

## Requisitos

- Node.js 20+
- npm

## Configuración

```bash
npm install
cp .env.example .env.local
# Edita SESSION_SECRET en .env.local (producción: valor aleatorio largo)
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Ver en el celular

Guía completa: [docs/MOBILE.md](docs/MOBILE.md) (navegador o Expo Go con la carpeta `LOCKER-APP/`).

### Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Flujo principal (splash, login, registro, opciones) |
| `/login` | Redirige a `/?phase=login` |
| `/crear-cuenta` | Redirige a `/?phase=role` |
| `/agenda` | Protegida — requiere sesión |
| `/perfil` | Protegida — requiere sesión |

Las cuentas se guardan en `data/accounts.json` (creado en runtime, no versionado). Las contraseñas se almacenan con **hash bcrypt**; la sesión va en cookie **httpOnly**.

## Scripts

```bash
npm run dev    # servidor de desarrollo
npm run build  # build de producción
npm run start  # servir build
npm run lint   # ESLint
```

## Seguridad

- **Demo / desarrollo:** adecuado para prototipos locales.
- **Producción:** define `SESSION_SECRET` fuerte; despliega con HTTPS (p. ej. Vercel).
- No uses contraseñas reales hasta tener base de datos gestionada, verificación de email y recuperación de cuenta.

### Migración desde localStorage

Versiones anteriores guardaban cuentas en `localStorage` del navegador. La auth actual es **solo en servidor**; hay que **volver a registrarse** tras actualizar.

## Estructura

```
src/
  app/           # Rutas Next.js + API auth
  components/    # Pantallas RN-web + SplashGate
  lib/           # authShared, authServer, session, lockerAuth (cliente)
  middleware.ts  # Protege /agenda y /perfil
```
