# SoapyFans Hub — Fase 4: Rediseño de Music Desktop

> **Documento maestro de entrega para la Fase 4 del rediseño visual de SoapyFans Hub.**  
> Rutas intervenidas: `/music`.  
> Componentes actualizados: `app/(main)/music/page.tsx`, `components/media/TrackList.tsx`, `components/media/YoutubeModal.tsx`, `components/forms/MusicReviewForm.tsx`.

---

## 01 — Music Architecture

La sección `/music` ha sido rediseñada para funcionar como el **archivo sonoro y discográfico de Sophie Thatcher**, manteniendo coherencia con el Design System de SoapyFans Hub sin convertirse en una tienda digital ni en una copia de la Filmography.

La arquitectura de la página se divide en 5 bloques continuos y jerarquizados:

```text
┌────────────────────────────────────────────────────────┐
│  01 — Music Page Header                                │
│       PageHeader con metadata de archivo discográfico   │
├────────────────────────────────────────────────────────┤
│  02 — Featured Release (Primary Archival Work)         │
│       Dossier editorial 2 columnas (EP "Pivot & Scrape")│
│       Artwork 1:1, Facts, Streaming, Tracks, Reviews   │
├────────────────────────────────────────────────────────┤
│  03 — Other Releases (Singles & Soundtracks)           │
│       Entradas secundarias estructuradas (Heretic OST) │
│       Tracklist, citas, streaming y fan notes          │
├────────────────────────────────────────────────────────┤
│  04 — Community Reviews (Integradas en cada Release)   │
│       MusicReviewForm estilizado, ratings, empty state │
├────────────────────────────────────────────────────────┤
│  05 — Music Discovery / External Listening             │
│       Píldoras neutrales (Spotify, Bandcamp, Twitter)  │
└────────────────────────────────────────────────────────┘
```

---

## 02 — Header

* **Componente:** [`PageHeader`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/PageHeader.tsx) integrado con [`PageContainer`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/PageContainer.tsx).
* **Contenido editorial:**
  * Eyebrow: `Archive Index · Discography`
  * Título H1: `Music` en `font-display` sobrio.
  * Descripción: `Debut EP, cinematic singles, and soundtrack contributions — Sophie Thatcher's sonic archive sits in the same emotional register as her acting: quiet, textured, and slightly unsettling.`
* **Metadatos secundarios de archivo:**
  * Total de lanzamientos registrados (`02 Releases Recorded`).
  * Formato principal (`Debut EP`).
  * Crédito artístico (`Sophie Thatcher`).
  * Sellos y producción (`Self-released / A24 Music`).
* **Optimización visual:** Se eliminó el hero invasivo de 60vh con múltiples gradientes pesados que ocultaba el catálogo musical.

---

## 03 — Featured Release

Se estableció una jerarquía clara donde la obra musical más representativa (*Pivot & Scrape* Debut EP) recibe tratamiento de **obra principal**:

* **Layout de Dos Columnas (`lg:grid-cols-[340px_1fr]`):**
  * **Columna Izquierda (Artwork & Factsheet):**
    * Portada en proporción 1:1 (`aspect-square`), bordes redondeados `rounded-xl`, aro sutil y sombra natural.
    * Ficha técnica tabular en `font-mono text-xs`: Artista, Fecha de lanzamiento, Conteo de pistas y Estado comunitario.
    * Píldoras de acceso a plataformas externas con diseño sobrio.
  * **Columna Derecha (Cuerpo Documental):**
    * Título H2 en `font-display text-3xl sm:text-4xl`.
    * Descripción curatorial sobre el sonido y atmósfera del EP.
    * Cita editorial de Sophie Thatcher sobre la génesis del álbum (*"The imagery and lyrics were inspired by dreams I kept having..."*).
    * Tracklist interactivo con duraciones y reproductores de video.
    * Sección comunitaria de reseñas con formulario para usuarios autenticados.

---

## 04 — Release System

Las demás producciones (singles independientes, bandas sonoras cinematográficas como *Knockin' on Heaven's Door* para la película *Heretic* de A24):
* Se presentan bajo la sección `Other Releases` con [`SectionHeader`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/SectionHeader.tsx).
* Utilizan un contenedor [`Surface`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Surface.tsx) con `rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60`.
* Identificación con [`Badge variant="music"`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Badge.tsx) (`Single`, `Soundtrack`).
* Cita contextual específica cuando existe testimonio de Sophie Thatcher.
* Módulo de reseñas integrado directamente en la ficha del lanzamiento.

---

## 05 — Tracklists

Refactorización completa de [`components/media/TrackList.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/TrackList.tsx):

* **Jerarquía tipográfica:**
  1. **Número de pista:** Discreto, tabular y monospaciado (`font-mono text-xs text-[var(--text-muted)]`). Se eliminaron los antiguos números gigantes `2xl bold` que desequilibraban la lectura.
  2. **Título de la pista:** Protagonista en `font-display text-base font-medium text-[var(--text-primary)]`.
  3. **Acción opcional de video:** Botón secundario compacto estilo píldora (`▶ Video`) que abre el modal oficial.
  4. **Duración:** Alineada a la derecha en formato monospaciado tabular (`font-mono text-xs text-[var(--text-muted)]`).
* **Interacción:** Filas con microinteracción de hover sutil (`hover:bg-[var(--bg-elevated)]/50`).

---

## 06 — External Platforms

Se aplicó la regla estricta de neutralidad cromática:
> *"El branding de la plataforma debe ser reconocible, pero no debe dominar visualmente la página."*

* **Implementación:**
  * Fondo: `bg-[var(--bg-surface)]` con borde `border-[var(--border-default)]` y hover `hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]`.
  * Spotify: Indicador de punto verde `#1DB954` discreto con texto monocromático en tokens del sistema.
  * Bandcamp: Indicador de punto cian `#1DA0C3` discreto.
  * Twitter / X: Enlace neutral con `@sophiebthatcher`.
  * Se eliminaron los botones fluorescentes de gran tamaño que distraían la atención.

---

## 07 — Reviews

* **Formulario ([`components/forms/MusicReviewForm.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/forms/MusicReviewForm.tsx)):**
  * Selector de 1 a 5 estrellas accesible mediante teclado y focus-ring.
  * Textarea integrado con fondo `bg-[var(--bg-base)]/70` y borde dinámico.
  * Botón de envío mediante el primitivo [`Button`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Button.tsx) con estado deshabilitado defensivo si `rating === 0`.
* **Lista de notas comunitarias:**
  * Tarjetas de autor con avatar inicial, nombre, indicador `(You)` para la propia reseña, estrellas doradas en `Geist Mono`, fecha formateada y texto de reseña.
  * Estado vacío sobrio con [`EmptyState`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/EmptyState.tsx) ("No fan notes yet").

---

## 08 — Motion & Modal Experience

* **Modal de YouTube ([`components/media/YoutubeModal.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/YoutubeModal.tsx)):**
  * Manejador de teclado para cerrar mediante tecla **Escape (`Escape`)**.
  * Bloqueo de scroll en el `body` mientras el modal está abierto.
  * Botón de cierre accesible y contenedor con aspecto 16:9 optimizado.
* **Transiciones:** Microtransiciones CSS basadas en `var(--transition-fast)` y `ease-out`, respetando `prefers-reduced-motion`.

---

## 09 — Accessibility (a11y)

1. **Semántica HTML:** Uso de `<main>`, `<section>`, `<article>`, `<header>`, `<ol>`, `<li>`, `<blockquote>` y `<cite>`.
2. **Modal WAI-ARIA:** Atributos `role="dialog"`, `aria-modal="true"`, `aria-labelledby="youtube-modal-title"` y focus-ring en todos los controles interactivos.
3. **Calificación en estrellas:** Labels descriptivas `aria-label="Rate X out of 5 stars"` y accesibilidad total por teclado.
4. **Contraste:** Todos los textos cumplen y superan los ratios WCAG AA (4.5:1 para texto regular, 3:1 para display y componentes de UI).

---

## 10 — Performance & Bundle Size

* **First Load JS de `/music`:** Reducido significativamente de **159 kB** a **114 kB** (reducción de ~45 kB en el bundle de la ruta al remover hooks redundantes y optimizar la carga estática).
* **Imágenes:** Servidas mediante `next/image` con tamaños y resoluciones adaptativas.
* **Revalidación Incremental (ISR):** `revalidate = 3600` para entrega estática ultrarrápida desde Edge con datos actualizados de Supabase.

---

## 11 — Verification

* **Typecheck (`npm run typecheck`):** 0 errores de TypeScript.
* **Unit Tests (`npm test`):** 56/56 tests pasando en 15 suites (seguridad OAuth, magic-bytes de imágenes, sanitización CSS, structured data y utilidades TMDB).
* **Build de Producción (`npm run build`):** 18/18 rutas estáticas y dinámicas compiladas exitosamente.

---

## 12 — Remaining Issues & Próximos Pasos

* **Fase 4 completada.**
* **Próxima Fase (Fase 5):** Rediseño editorial de la página **About / Manifiesto de la Comunidad** (`/about`).
* **Siguiente Fase (Fase 6):** Rediseño del flujo de **Autenticación y Perfiles de Usuario** (`/login`, `/register`, `/profile/[username]`, `/profile/edit`).
