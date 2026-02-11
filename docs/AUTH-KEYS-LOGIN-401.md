# Login con Google y error 401: qué keys revisar

Si después de iniciar sesión con Google te redirige bien pero al cargar el dashboard o la página de login aparece **401 Unauthorized** al validar el usuario, suele ser un tema de **keys o variables de entorno**. Revisá lo siguiente.

## 1. Backend Medusa (Railway / donde esté desplegado)

### JWT_SECRET (no está “en el repo”, lo definís vos)
- En el código solo hay un **valor por defecto**: en `apps/store/medusa-config.ts` se usa `process.env.JWT_SECRET || "supersecret"`.
- Ese valor **no se guarda en el repo**; lo configurás en el **entorno** (Railway, `.env` local, etc.) como variable `JWT_SECRET`.
- El token que devuelve Google OAuth lo **firma Medusa** con ese `JWT_SECRET`. Cuando el frontend llama a `/store/customers/me`, Medusa **verifica la firma** con el mismo valor.
- Si en producción no está definido `JWT_SECRET`, Medusa usa `"supersecret"`. Si en algún momento cambiaste el valor en Railway, los tokens viejos dejan de ser válidos y Medusa responde **401**.
- **Qué hacer:**
  1. En **Railway** (proyecto del backend Medusa): Variables → que exista `JWT_SECRET`.
  2. Si hoy tenés `JWT_SECRET=supersecret`, está bien para que funcione; para producción conviene usar un valor fuerte y estable (por ejemplo una cadena larga aleatoria o un UUID). Podés generar una con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
  3. **No lo rotes** sin avisar: si cambiás `JWT_SECRET`, todos los usuarios tienen que volver a iniciar sesión.

### Publishable API Key
- En Medusa **todas las rutas `/store/*` exigen** el header `x-publishable-api-key`. Sin él, Medusa suele devolver **401**.
- En el proyecto, `auth.service.ts` ya envía ese header (con `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`) en la petición a `/store/customers/me`.
- En Medusa debe existir al menos una **publishable key** (se crea con el seed o manualmente).
- Esa key debe estar en el frontend como `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`. Si está vacía o no coincide con el backend, seguirás viendo 401.
- **Qué hacer:** En el backend, listar las publishable keys (por ejemplo con el script que tengas o en la DB) y copiar **la misma** key a `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` en el frontend (Vercel, etc.).

## 2. Frontend (Next.js / Vercel / donde esté el www)

Revisá que en el **entorno de producción** estén definidas:

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | URL del backend Medusa (ej. `https://floreria-medusa-production-xxx.up.railway.app`). Sin barra final. |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | La **misma** publishable key que tiene Medusa. |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (ej. `https://www.lasfloresdelaimprenta.com`). Se usa para el callback de Google. |

Si `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` está vacía o no coincide con el backend, es muy probable que veas **401** al llamar a `/store/customers/me`.

## 3. Google Cloud Console (solo si el error es antes de tener token)

Si el problema fuera que **ni siquiera llega el token** (error en el callback de Google), ahí sí importan:

- **Authorized redirect URIs** debe incluir exactamente:  
  `https://www.lasfloresdelaimprenta.com/api/auth/callback/google`
- **Client ID** y **Client secret** configurados en Medusa (variables que use el backend para Google OAuth).

En tu caso, como el callback **sí** devuelve token y se setea la cookie, el fallo está en la **validación del token** en Medusa, no en Google. Por eso lo más probable es **JWT_SECRET** o **publishable key** en backend/front.

## Resumen rápido

1. **Backend Medusa:** `JWT_SECRET` definido y estable; publishable key creada y anotada.
2. **Frontend:** `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` y `NEXT_PUBLIC_SITE_URL` con los valores correctos para producción.
3. Si rotaste `JWT_SECRET` en Medusa, los usuarios tienen que volver a iniciar sesión (los tokens viejos ya no serán válidos).
