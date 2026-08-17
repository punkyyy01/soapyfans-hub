# SoapyFans Hub — Fase 5: Rediseño Editorial de About Desktop

> **Documento maestro de entrega para la Fase 5 del rediseño visual de SoapyFans Hub.**  
> Rutas intervenidas: `/about`.  
> Componentes actualizados: `app/(main)/about/page.tsx`, `components/media/PhotoGallery.tsx`.

---

## 01 — Editorial Structure

La página [`/about`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/about/page.tsx) ha sido rediseñada para cumplir su propósito fundamental: **la pieza editorial/biográfica del archivo**.

```
┌────────────────────────────────────────────────────────┐
│                   SOAPYFANS HUB                         │
│  Home        → Editorial Discovery                      │
│  Filmography → Archive Navigation & Catalog             │
│  Music       → Sonic Archive & Discography              │
│  About       → Biographical & Editorial Understanding   │
└────────────────────────────────────────────────────────┘
```

La arquitectura general se compone de 6 secciones continuas:

```text
01 — Editorial Masthead Header (Nombre completo, contextualización, metadata y retrato)
02 — Portrait Gallery (Colección fotográfica archival curada en proporción 3:4)
03 — Biography: Beyond the Screen (Crónica de orígenes en Chicago, familia de artistas y trayectoria)
04 — Career Timeline (Cronología formativa y saltos cualitativos desde 2011 al presente)
05 — Recognition (Lista documental de galardones y menciones de prensa selecta)
06 — Explore the Archive (Cierre sobrio con enlaces de retorno al catálogo cinematográfico y musical)
```

---

## 02 — Header

* **Estructura en dos columnas:**
  * **Columna izquierda:** Eyebrow `Biographical Profile · The Archive`, Título H1 `Sophie Bathsheba Thatcher` en `font-display`, y glosa descriptiva de alto calibre.
  * **Metadatos documentales:** Fecha de nacimiento (`18 October 2000`), Lugar de origen (`Chicago, Illinois`) y Edad actual calculada dinámicamente (`{age} years`).
  * **Enlaces oficiales:** Enlaces estilo píldora a Instagram (`@soapy.t`) y YouTube (`@SophieThatcher`).
  * **Columna derecha:** Retrato fotográfico principal (`aspect-[3/4]`, `rounded-2xl`, borde `border-[var(--border-subtle)]` y sombra suave) integrado con color y contraste natural, eliminando los antiguos filtros destructivos de colores artificiales.

---

## 03 — Gallery

Refactorización de [`components/media/PhotoGallery.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/PhotoGallery.tsx):

* **Cuadrícula fotográfica:** Grid responsivo de 2 a 4 columnas con proporciones uniformes 3:4, bordes `rounded-xl` y microinteracción de zoom sutil (`scale-[1.03]`).
* **Lightbox Accesible:**
  * Cierre instantáneo mediante tecla **Escape (`Escape`)**.
  * Navegación secuencial mediante flechas de teclado (`ArrowLeft` / `ArrowRight`) y botones táctiles.
  * Contador numérico discreto en formato monospaciado (`01 / 12`).
  * Bloqueo del scroll en `body` mientras el visor permanece activo.
  * Semántica WAI-ARIA `role="dialog"` y `aria-modal="true"`.

---

## 04 — Biography: Beyond the Screen

* **Lectura confortable:** Columna de lectura centrada (`max-w-3xl`) con interlineado holgado (`leading-[1.85]`), respetando las normas editoriales clásicas.
* **Eliminación del wallpaper saturado:** Se retiró la fotografía de fondo que dificultaba la lectura del texto biográfico, reemplazándola por una superficie neutra [`Surface`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Surface.tsx) con `border-[var(--border-subtle)]` y fondo translúcido.
* **Contenido factual preservado:**
  * Orígenes en Chicago y crecimiento en Evanston, Illinois.
  * Entorno familiar creativo (madre pianista, hermana cineasta Emma Thatcher que dirigió *Provo*, hermano escritor Alexander, gemela idéntica artista visual Ellie).
  * Salida del entorno mormón en la adolescencia y su influencia en la interpretación de Sister Barnes en *Heretic* (2024).
  * Vida contemporánea en Los Ángeles compaginando cine, música y artes visuales.

---

## 05 — Timeline: Chronology of Work

* **Enfoque editorial en lista:**
  * Encabezado con [`SectionHeader`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/SectionHeader.tsx) (`Career Milestones · Chronology of Work`).
  * Estructura por filas en dos columnas (`sm:grid-cols-[140px_1fr]`):
    * Columna izquierda: Año en `font-mono text-sm text-[var(--accent-amber)]` y categoría.
    * Columna derecha: Título de la obra en `font-display text-xl`, badge semántico para hitos (`Badge variant="tv"` para *Yellowjackets* Breakthrough) y descripción contextual.
  * Separadores sutiles `border-[var(--border-subtle)]`.

---

## 06 — Recognition & Select Press

* **Lista documental de archivo:**
  * Presenta reconocimientos como registros históricos sin convertirlos en tarjetas promocionales individuales.
  * Inclusiones destacadas:
    * `2025` · *Critics' Choice Super Award* (Companion)
    * `2025` · *Dazed* (Cover Story & Interview)
    * `2025` · *Harper's Bazaar* (The Possibility Issue)
    * `2024` · *Vanity Fair* ("All the Rage")
    * `2022` · *Vogue* (September Profile)

---

## 07 — Archive Navigation (Closure)

* **Cierre sereno:** Bloque de navegación que conecta la biografía con el trabajo activo:
  * Botón primario: [`Browse Filmography →`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/films/page.tsx)
  * Botón secundario: [`Explore Music Archive →`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/music/page.tsx)
* **Diferenciación con Home:** No intenta vender ni forzar suscripciones; actúa como una pasarela natural hacia los catálogos.

---

## 08 — Motion & Microinteractions

* **Transiciones CSS sobrias:** Efectos de entrada suaves con aceleración por GPU, respetando la directiva de accesibilidad `prefers-reduced-motion`.
* **Lightbox:** Apertura y cierre fluidos sin sacudidas de layout ni saltos de scroll.

---

## 09 — Accessibility (a11y)

1. **Jerarquía semántica:** Estructuración de H1 a H3 en estricto orden jerárquico.
2. **Navegación por teclado:** Enlaces de redes, botones de galería y controles de modal operables mediante `Tab`, `Enter`, `Space` y `Escape`.
3. **Alt Text:** Descripciones precisas en todas las imágenes renderizadas vía `next/image`.
4. **Contraste de Color:** Ratios superiores a 7:1 en títulos y 4.5:1 en cuerpo de texto según pautas WCAG 2.1 AA.

---

## 10 — Performance

* **First Load JS:** Reducido de **158 kB a 113 kB** en la ruta `/about`.
* **Carga de imágenes:** Optimización automática de imágenes TMDB mediante `next/image` con priorización en el masthead y carga diferida (lazy loading) en la galería.
* **Server Rendering:** La página se renderiza completamente en el servidor con revalidación periódica (`revalidate = 3600`).

---

## 11 — Verification

* **Typecheck (`npm run typecheck`):** **0 errores de TypeScript**.
* **Unit Tests (`npm test`):** **56 tests pasando (0 fallos)** en 15 suites de pruebas.
* **Next.js Production Build (`npm run build`):** **18 rutas generadas y optimizadas exitosamente**.

---

## 12 — Remaining Issues & Próximos Pasos

* **Fase 5 completada.**
* **Próxima Fase (Fase 6):** Rediseño del **Flujo de Autenticación y Perfiles de Usuario** (`/login`, `/register`, `/profile/[username]`, `/profile/edit`).
