# SoapyFans Hub — Fase 6.1: About Me y Cierre Minimalista del Perfil

> **Documento maestro de entrega para la Fase 6.1 del rediseño visual de SoapyFans Hub.**  
> Rutas intervenidas: `/profile/[username]`, `/profile/edit`.  
> Componentes y utilidades actualizados: `app/(main)/profile/[username]/page.tsx`, `app/(main)/profile/edit/page.tsx`, `app/(main)/profile/edit/actions.ts`, `components/profile/ProfileEditForm.tsx`, `components/ui/Footer.tsx`, `components/ui/FooterClientWrapper.tsx`, `utils/supabase/database.types.ts`, `supabase/migrations/20260818_add_about_me_to_profiles.sql`, `tests/profile-edit.test.ts`.

---

## 01 — Motivation

Durante la validación de perfiles tras la Fase 6, se observó que aquellos perfiles con poco contenido (por ejemplo, 1 o 2 Sophie Picks y sin reseñas públicas) podían sentirse visualmente desiertos o incompletos, mientras que al final de la página se acumulaba innecesariamente el Footer editorial global masivo del archivo.

La solución de la Fase 6.1 resuelve esta tensión mediante dos pilares:
1. **`About Me` (Narrativa personal libre):** Proporciona un espacio de texto extendido y personal (hasta 2,000 caracteres) donde el usuario puede contar su historia, su conexión con la filmografía o música de Sophie Thatcher, o reflexiones libres, sin necesidad de rellenar el perfil con widgets o cards SaaS artificiales.
2. **`Minimal Profile Closure` Real:** Reemplaza el Footer editorial gigante en las rutas de perfil público por una barra de cierre discreta y elegante que conecta limpiamente de vuelta al archivo y a los enlaces legales esenciales (`Privacy`, `Terms`).

---

## 02 — Data Model

Se añadió el campo `about_me` a la tabla `profiles` de forma segura, no destructiva y retrocompatible:

* **Columna:** `about_me TEXT NULL`
* **Definición de Tipos ([`utils/supabase/database.types.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/utils/supabase/database.types.ts)):**
  - `Row`: `about_me: string | null`
  - `Insert`: `about_me?: string | null`
  - `Update`: `about_me?: string | null`
* **Migración SQL Documentada ([`supabase/migrations/20260818_add_about_me_to_profiles.sql`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/supabase/migrations/20260818_add_about_me_to_profiles.sql)):**
  ```sql
  ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS about_me TEXT NULL;

  COMMENT ON COLUMN public.profiles.about_me IS 'Extended freeform personal description (max 2000 chars), with line breaks and paragraph spacing preserved.';
  ```
* **Compatibilidad:** Los perfiles existentes sin este campo cargan con `about_me: null` sin requerir migraciones de datos.

---

## 03 — Editor (Atelier UX)

En [`components/profile/ProfileEditForm.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/profile/ProfileEditForm.tsx):

1. **Ubicación Intuitiva:** Se integra en la sección `01 · Identity`, inmediatamente después de la `Short Bio` (300 caracteres).
2. **Controles y UX:**
   - **Label:** `About Me`
   - **Contador en Vivo:** Formato tabular (`X / 2,000`) con advertencia visual si se superan los 1,900 caracteres.
   - **Textarea:** `rows={5}` con redimensionamiento vertical (`resize-y`) y placeholder inspirador:
     > *"Tell visitors a little more about you, your connection to Sophie, or what you like about the archive…"*
   - **Helper Text:** *"Tell visitors a little more about you, your connection to Sophie, or what you like about the archive. Line breaks and paragraphs are preserved."*
3. **Validación Dual:**
   - *Cliente:* Límite HTML `maxLength={2000}`.
   - *Servidor ([`app/(main)/profile/edit/actions.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/profile/edit/actions.ts)):* Sanitización y validación estricta de longitud (`aboutMeRaw.length > 2000` rechaza con mensaje amigable).
4. **Detección de Cambios (Dirty State):** Modificar el texto de `About Me` activa instantáneamente el indicador de cambios sin guardar en la barra persistente de acción.

---

## 04 — Public Profile

En [`app/(main)/profile/[username]/page.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/profile/[username]/page.tsx):

* **Jerarquía de Lectura:**
  ```
  Banner & Avatar
         ↓
  Identidad (Nombre, Handle, Pronombres, Short Bio)
         ↓
  Sophie Picks (Top 6 Favoritos)
         ↓
  About Me (Solo si contiene texto)
         ↓
  Recent Activity (Feed de Reseñas, si está habilitado)
         ↓
  Minimal Profile Closure
  ```
* **Comportamiento Condicional:** Si `profile.about_me` está vacío (`null` o `""`), la sección no se renderiza en absoluto (sin placeholders ni espacios en blanco).
* **Formateo Seguro:**
  - Emplea `whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)] text-pretty max-w-3xl sm:text-base`.
  - Respeta saltos de línea y párrafos múltiples.
  - Inmune a inyecciones XSS (renderizado nativo de cadenas de React).

---

## 05 — Preview

En el diálogo modal de **Live Canvas Preview** (`CssPreviewPanel`):

* Refleja exactamente el bloque `About Me` con su encabezado y párrafos formateados en tiempo real.
* Permite al usuario verificar cómo interactúan sus estilos personalizados de `#profile-canvas` con su texto descriptivo antes de guardar.

---

## 06 — Minimal Closure

Para evitar la duplicación del gigantesco Footer editorial global debajo del lienzo de perfil:

1. **Aislamiento Condicional del Footer Global ([`components/ui/FooterClientWrapper.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/FooterClientWrapper.tsx)):**
   - Detecta la ruta actual mediante `usePathname()`.
   - Si la ruta corresponde a un perfil público (`/profile/[username]` o `/profile/[uuid]`), omite el Footer global devolviendo `null`.
   - Mantiene el Footer global intacto en todas las demás páginas (`/`, `/films`, `/music`, `/about`, `/profile/edit`, etc.).
2. **Minimal Profile Closure en el Canvas:**
   - Concluye el perfil con una barra estilizada en la base del canvas:
     - Marca: `SoapyFans Hub · Fan Archive Profile`
     - Enlaces de retorno y legales: `Explore Archive →` · `Privacy` · `Terms`
   - Escala visual limpia, sin Ko-fi masivo ni avisos repetidos de TMDB.

---

## 07 — Empty Profiles

Un perfil con mínima información (ej. avatar, banner, short bio, 1 Sophie Pick, sin About Me y sin actividad):

* **Resultado:** Se presenta limpio, intencional y equilibrado.
* **Sin Relleno:** No aparecen avisos intrusivos de "¡Añade más contenido!" ni tarjetas vacías desoladas.
* **Cierre Inmediato:** El canvas concluye naturalmente en el Minimal Profile Closure.

---

## 08 — CSS Compatibility

* La sección `About Me` se encuentra dentro del selector `#profile-canvas`.
* El usuario puede aplicar bordes, fuentes, colores, espaciados y efectos mediante `profile_css` sin romper el layout exterior ni el Navbar global.

---

## 09 — Accessibility (a11y)

* **Formulario:** `label` asociado con `htmlFor="about_me"`.
* **Contador Accesible:** Visible y con contraste adecuado.
* **Jerarquía de Encabezados:** Estructura semántica correcta con `SectionHeader` (`kicker="About Me"`, `title="A little more about me"`).
* **Navegación por Teclado:** Totalmente accesible mediante tabulación y `:focus-visible`.

---

## 10 — Verification

* **Typecheck (`npm run typecheck`):** **0 errores**.
* **Unit Tests (`npm test`):** **73 tests pasando en 19 suites (100% pass)**.
  - *Nueva suite:* `About Me Extended Bio Validation and Multi-Paragraph Preservation` (5 tests).
  - *Nueva suite:* `Minimal Profile Closure vs Global Footer Visibility Rules` (3 tests).
* **Production Build (`npm run build`):** **18 rutas generadas y optimizadas exitosamente**.

---

## 11 — Remaining Issues

Ninguno. El sistema de perfiles y editor de SoapyFans Hub es completamente estable, seguro, extensible y fiel a la dirección de diseño editorial y comunitaria.
