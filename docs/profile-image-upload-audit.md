# SoapyFans Hub — Auditoría y Corrección del Guardado de Avatar/Banner

> **Documento de auditoría técnica y resolución de fallo de carga de imágenes en el perfil.**  
> Rutas intervenidas: `/profile/edit`.  
> Archivos modificados: `next.config.ts`, `app/(main)/profile/edit/actions.ts`, `components/profile/ProfileEditForm.tsx`, `utils/image-validation.ts`, `tests/profile-edit.test.ts`.

---

## 01 — Symptom

Al editar el perfil desde [`/profile/edit`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/profile/edit/page.tsx):
1. El usuario seleccionaba simultáneamente un **avatar** (p. ej. 1.5 MB) y un **banner** (p. ej. 2.5 MB).
2. Pulsaba `Save Changes`.
3. La interfaz no guardaba y era interceptada por el error boundary global ([`app/(main)/error.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/error.tsx)):

```text
Something went wrong
Unexpected Error
The archive hit an unexpected snag. Give it another try.
```

---

## 02 — Reproduction Matrix

Se evaluó la matriz completa de casos de carga de imágenes:

| Caso | Configuración de Archivos | Tamaño Total Estimado | Resultado Previo | Causa Técnica | Resultado Corregido |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | Avatar pequeño (100 KB) + Banner pequeño (200 KB) | ~300 KB | ✅ Exitoso | Dentro del límite anterior (3 MB) | ✅ Guardado exitoso |
| **B** | Solo avatar (1.5 MB) | ~1.5 MB | ✅ Exitoso | Dentro del límite anterior | ✅ Guardado exitoso |
| **C** | Solo banner (2.5 MB) | ~2.5 MB | ✅ Exitoso | Dentro del límite anterior | ✅ Guardado exitoso |
| **D** | Avatar (1.8 MB) + Banner pequeño (200 KB) | ~2.0 MB | ✅ Exitoso | Dentro del límite anterior | ✅ Guardado exitoso |
| **E** | Avatar pequeño (200 KB) + Banner (2.9 MB) | ~3.1 MB | ❌ **Error Boundary** | Supera `bodySizeLimit: '3mb'` en Server Action | ✅ Guardado exitoso |
| **F** | Avatar (1.5 MB) + Banner (2.5 MB) | ~4.0 MB | ❌ **Error Boundary** | Supera `bodySizeLimit: '3mb'` en Server Action | ✅ Guardado exitoso |
| **G** | Avatar (500 KB) + Banner (1.5 MB) | ~2.0 MB | ✅ Exitoso | Dentro del límite anterior | ✅ Guardado exitoso |
| **H** | Avatar > 2 MB (p. ej. 2.5 MB) | 2.5 MB | ❌ Sin validación cliente | Error en servidor o límite | ⚠️ Toast controlado |
| **I** | Banner > 3 MB (p. ej. 3.5 MB) | 3.5 MB | ❌ Sin validación cliente | Error en servidor o límite | ⚠️ Toast controlado |
| **J** | Avatar (2 MB) + Banner (3.5 MB) (> 5 MB) | ~5.5 MB | ❌ Sin validación combinada | Error en servidor o límite | ⚠️ Toast controlado |

---

## 03 — Root Cause

La causa raíz fue un **desajuste entre la suma de límites individuales de subida y el límite de transporte HTTP de las Server Actions de Next.js**:

1. **Límites Individuales Permitidos:**
   - Avatar: hasta `2 MB`.
   - Banner: hasta `3 MB`.
   - Carga simultánea válida: hasta `5 MB` (+ metadatos FormData multipart = ~5.1 MB).
2. **Configuración de Next.js anterior ([`next.config.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/next.config.ts)):**
   ```ts
   experimental: {
     serverActions: {
       bodySizeLimit: '3mb', // INSUFICIENTE para Avatar (2MB) + Banner (3MB)
     },
   }
   ```
3. **Mecanismo de Fallo:**
   - Cuando el payload multipart superaba `3 MB`, el middleware/gateway interno de Next.js rechazaba el request antes de invocar la Server Action [`saveProfile()`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/profile/edit/actions.ts).
   - Como la petición fallaba en el runtime de React Server Components sin una captura granular, Next.js invocaba el Error Boundary global `(main)/error.tsx` mostrando `Unexpected Error`.
4. **Deficiencias de Soporte Detectadas:**
   - Ausencia de validación temprana en el cliente (`onChange` y `onSubmit` en [`ProfileEditForm.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/profile/ProfileEditForm.tsx)).
   - Falta de atomicidad: si fallaba el banner o el update a DB, el avatar antiguo se borraba prematuramente y el nuevo quedaba huérfano.

---

## 04 — Evidence

* **Punto de falla:** La solicitud HTTP POST hacia el endpoint de Server Actions era truncada/rechazada a nivel de middleware Next.js antes de ejecutar el código de `saveProfile()`.
* **Error Boundary:** El componente [`app/(main)/error.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/error.tsx) renderizaba literalmente:
  - *Title:* "Unexpected Error"
  - *Description:* "The archive hit an unexpected snag. Give it another try."

---

## 05 — Architecture Decision

Se evaluaron dos arquitecturas de subida:

| Criterio | Opción A: Browser → Server Action → Supabase Storage | Opción B: Direct Browser Upload a Supabase Storage |
| :--- | :--- | :--- |
| **Seguridad de Binarios** | ⭐⭐⭐ **Alta**: Validación de magic-bytes en servidor ([`detectImageFormat`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/utils/image-validation.ts)) previene MIME spoofing y archivos maliciosos antes de persistir. | ⭐ **Baja**: Requiere políticas RLS cliente y no puede validar magic-bytes en un entorno de confianza. |
| **Atomicidad y Rollback** | ⭐⭐⭐ **Alta**: Gestión transaccional completa en servidor (rollback de archivos si falla la DB o el segundo upload). | ⭐ **Baja**: Si el cliente sube y luego aborta la petición a DB, quedan archivos huérfanos en Storage. |
| **Simplicidad** | ⭐⭐⭐ **Alta**: Flujo único y determinista. | ⭐⭐ **Media**: Requiere firmado previo de URLs y doble handshake cliente-servidor. |

**Decisión:** Se mantiene la **Opción A**, ajustando el `bodySizeLimit` a `6mb` y añadiendo validaciones estrictas y transaccionalidad atómica.

---

## 06 — Fix

1. **Next.js Server Actions Body Size Limit ([`next.config.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/next.config.ts)):**
   ```ts
   experimental: {
     serverActions: {
       bodySizeLimit: '6mb',
     },
   }
   ```
2. **Validación de Tamaños Centralizada ([`utils/image-validation.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/utils/image-validation.ts)):**
   - Exporta `MAX_AVATAR_BYTES` (2 MB), `MAX_BANNER_BYTES` (3 MB), `MAX_COMBINED_BYTES` (5 MB).
   - Exporta funciones puras `validateImageSize()` y `validateCombinedImageSizes()`.
3. **Validación Temprana en Cliente ([`components/profile/ProfileEditForm.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/profile/ProfileEditForm.tsx)):**
   - Validación instantánea en `onAvatarChange` y `onBannerChange`.
   - Limpieza del input de archivo si es inválido.
   - Validación pre-submit en `handleSubmit`.
   - Mensajes toast específicos (p. ej. *"Avatar image is too large. Maximum size is 2 MB."*).
4. **Validación y Atomicidad en Servidor ([`app/(main)/profile/edit/actions.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/profile/edit/actions.ts)):**
   - Verificación de límites individuales y combinados antes de cualquier operación de red.
   - Subida secuencial con registro de artefactos (`UploadedArtifact`).
   - Rollback automático de imágenes subidas si la subida de un segundo archivo o la actualización de base de datos fallan.
   - Eliminación de imágenes antiguas **únicamente** tras la confirmación exitosa del update en PostgreSQL.

---

## 07 — Upload Limits

* **Avatar:**
  - Tamaño máximo: `2 MB` (`2,097,152 bytes`).
  - Formatos permitidos: `JPEG`, `PNG`, `WebP`, `GIF` (verificados por magic-bytes binarios).
  - Dimensiones recomendadas: `400x400` a `800x800 px` (aspecto 1:1).
* **Banner:**
  - Tamaño máximo: `3 MB` (`3,145,728 bytes`).
  - Formatos permitidos: `JPEG`, `PNG`, `WebP`, `GIF` (verificados por magic-bytes binarios).
  - Dimensiones recomendadas: `1920x640` a `2400x800 px` (aspecto 3:1).
* **Combinado (Avatar + Banner en la misma petición):**
  - Tamaño máximo combinado: `5 MB` (`5,242,880 bytes`).

---

## 08 — Error Handling

Los errores ya no provocan un choque en el error boundary global. Se presentan con mensajes accionables y contextuales:

* *Avatar excedido:* `"Avatar image is too large. Maximum size is 2 MB."`
* *Banner excedido:* `"Banner image is too large. Maximum size is 3 MB."`
* *Total excedido:* `"Combined image size exceeds the 5 MB limit. Please select smaller images."`
* *MIME / Magic-bytes inválido:* `"Unsupported image format. Please upload a valid JPEG, PNG, WebP, or GIF."`

---

## 09 — Atomicity & Safe Image Cleanup

El pipeline de guardado en [`saveProfile()`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/profile/edit/actions.ts) sigue un ciclo transaccional estricto:

```
1. Validación de tamaño (Avatar, Banner, Combinado)
        ↓
2. Subida de Avatar → { url, bucket, path }
        ↓
3. Subida de Banner → { url, bucket, path }
   [Si falla → Se elimina Avatar recién subido de Storage y se retorna error]
        ↓
4. Actualización en DB (supabase.from('profiles').update)
   [Si falla → Se eliminan Avatar y Banner recién subidos y se retorna error]
        ↓
5. Cleanup Seguro Post-DB:
   - Se eliminan las URLs antiguas únicamente si pertenecen al usuario (userId/...)
   - Se ignoran avatares predeterminados (default-...)
   - Se ignoran URLs externas (Discord, Google)
```

---

## 10 — Regression Tests

Se incorporaron suites de prueba en [`tests/profile-edit.test.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/tests/profile-edit.test.ts):

1. **`Image Upload Size and Payload Limits`**:
   - Validación de límite de Avatar (2 MB exacto vs 2 MB + 1 byte).
   - Validación de límite de Banner (3 MB exacto vs 3 MB + 1 byte).
   - Validación de límite combinado (4 MB válido, 5 MB válido, 5.5 MB rechazado).
2. **`Storage Old-Image Cleanup Path Protection`**:
   - Permite eliminación de archivos propios (`usr_abc123/1720000000.jpg`).
   - Bloquea eliminación de imágenes default (`usr_abc123/default-avatar.png`).
   - Bloquea intentos de eliminación de archivos de otros usuarios (`victim_user_999/...`).
   - Ignora URLs externas (Discord / Google).

---

## 11 — Verification

* **Typecheck (`npm run typecheck`):** **0 errores**.
* **Unit Tests (`npm test`):** **64 tests pasando en 17 suites (100% pass)**.
* **Production Build (`npm run build`):** **18 rutas compiladas exitosamente**.
