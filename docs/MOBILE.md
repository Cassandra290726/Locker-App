# Ver Locker App en el celular

Locker App es una **aplicación web Next.js** (no una app Expo pura). El servidor de desarrollo debe estar corriendo en tu PC para que funcionen login, registro y APIs.

## Opción A — Navegador del celular (más simple)

1. En la PC, en la carpeta raíz del repo:
   ```bash
   npm install
   cp .env.example .env.local
   npm run dev
   ```
2. Obtén la IP local de tu PC (Windows: `ipconfig` → **IPv4**, ej. `192.168.1.42`).
3. Conéctate a la **misma red Wi‑Fi** que el celular.
4. En el navegador del celular abre: `http://TU_IP:3000`  
   Ejemplo: `http://192.168.1.42:3000`
5. Si no carga, permite el puerto **3000** en el firewall de Windows.

## Opción B — Expo Go (contenedor con WebView)

La carpeta [`LOCKER-APP/`](../LOCKER-APP/) abre tu proyecto web dentro de **Expo Go**.

### Requisitos

- [Expo Go](https://expo.dev/go) instalado en Android o iPhone.
- Node.js 20+ en la PC.
- Misma red Wi‑Fi.

### Pasos

**Terminal 1** (servidor Next.js, carpeta raíz):

```bash
npm run dev
```

**Terminal 2** (Expo, carpeta `LOCKER-APP`):

```bash
cd LOCKER-APP
npm install
npx expo install react-native-webview
copy .env.example .env
# Edita .env y pon EXPO_PUBLIC_LOCKER_URL=http://TU_IP:3000
npx expo start
```

1. Escanea el **código QR** con Expo Go (Android) o la cámara (iOS).
2. En la pantalla inicial escribe `http://TU_IP:3000` (la misma IP que en el navegador).
3. Pulsa **Abrir Locker**.

### Problemas frecuentes

| Síntoma | Qué hacer |
|--------|-----------|
| **"Project is incompatible with this version of Expo Go"** | Actualiza **Expo Go** desde Play Store / App Store. El proyecto usa SDK 55 y exige la última versión de la app. |
| Pantalla en blanca / error de red | Comprueba que `npm run dev` sigue activo y la IP es correcta. |
| No conecta | Misma Wi‑Fi; desactiva VPN; revisa firewall (puerto 3000). |
| Confundir URLs | El QR de Expo abre `exp://…:8081` (contenedor). La app Locker vive en `http://TU_IP:3000` (navegador o pantalla dentro del contenedor). |
| Expo no escanea QR | Actualiza Expo Go; o usa solo el **navegador** con `http://TU_IP:3000` (sin Expo). |
| APIs no guardan datos | El servidor debe estar en la PC; no cierres la terminal de `npm run dev`. |

## ¿Por qué no es solo Expo?

El proyecto usa **API Routes de Next.js** (`/api/auth`, `/api/alumno/...`) y archivos JSON en `data/`. Eso requiere el servidor Node en la PC (o un despliegue como Vercel). Expo Go por sí solo no ejecuta ese backend.

Para una app 100 % nativa sin PC encendida haría falta desplegar el backend y migrar las pantallas a React Native puro.
