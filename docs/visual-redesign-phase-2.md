# SoapyFans Hub — Rediseño Completo de la Home Desktop (Fase 2)

> **Documento de Registro Técnico y Arquitectura de la Fase 2**  
> **Estado:** Fase 2 Completada exitosamente  
> **Proyecto:** SoapyFans Hub (`soapyfans-hub`)  
> **Objetivo:** Rediseño integral de la página principal (`/`), consolidación de la jerarquía editorial cinematográfica y eliminación de patrones de plantilla artificiales.

---

## 01 — Home Structure (Arquitectura Final)

La nueva Home ha sido reducida de 8 bloques dispersos a una secuencia lógica y deliberada de 4 secciones principales (más el Footer del Shell global):

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 01 — HERO                                                              │
│ Título editorial unificado ("The Sophie Thatcher Archive"), fotografía │
│ en alta definición sin máscaras destructivas, 2 CTAs claras y metadata │
│ documental secundaria.                                                 │
├────────────────────────────────────────────────────────────────────────┤
│ 02 — WORKS (Film & Television)                                         │
│ Sección unificada de obras con control segmentado (All / Films / TV), │
│ jerarquía compositiva (1 Obra Destacada panorámica + 5 Obras de apoyo)│
│ y tarjetas limpias libres de resplandores de neón.                     │
├────────────────────────────────────────────────────────────────────────┤
│ 03 — MUSIC CORNER                                                      │
│ Módulo compacto con los lanzamientos discográficos más recientes       │
│ (EPs, singles, bandas sonoras) y enlace directo al archivo musical.    │
├────────────────────────────────────────────────────────────────────────┤
│ 04 — COMMUNITY INVITATION                                              │
│ Superficie destacada sobria ("Leave a note worth keeping") con llamada │
│ a calificar, reseñar y personalizar el dossier de perfil.              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 02 — Hero (Cambios y Fundamentación)

* **Supresión del patrón fragmentado:** Se eliminó la estructura tripartita con disparidad de tamaños, tracking excesivo y cursivas doradas forzadas.
* **Nueva jerarquía tipográfica:**
  - **Kicker / Contexto:** `SoapyFans Hub · Sophie Thatcher Fan Archive & Community` (DM Sans, tracking moderado `0.16em`).
  - **Título H1:** `The Sophie Thatcher Archive` en *Playfair Display* con la palabra `Archive` en ámbar cálido.
  - **Descripción:** Texto continuo en *DM Sans* explicando la naturaleza del archivo cultural sin jerga corporativa.
* **Acciones gobernadas (Máximo 2 CTAs):**
  - Botón primario: *Browse filmography* (`/films`) con variante `primary`.
  - Botón secundario: *Sign in / Create profile* (`/login`) con variante `secondary`.
* **Tratamiento fotográfico:** Retrato de TMDB presentado con nitidez, sin filtros `mix-blend-color` agresivos, con un degradado inferior suave hacia el fondo base.

---

## 03 — Works (Funcionamiento del Selector Unificado)

* **Componente interactivo [`WorksSection.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/WorksSection.tsx):**
  - **Filtro `All`:** Muestra la obra más reciente o relevante como tarjeta destacada (`featured`), acompañada de una selección equilibrada de 5 títulos de cine y series.
  - **Filtro `Films`:** Filtra en tiempo real exclusivamente películas.
  - **Filtro `TV`:** Filtra en tiempo real exclusivamente créditos televisivos (destacando el badge con el token semántico `--accent-forest`).
* **Jerarquía visual:**
  - **Obra destacada (Featured):** Tarjeta con proporción 16:9, póster/backdrop en alta resolución, año, calificación en estrellas, rol del personaje y enlace directo.
  - **Obras de soporte (Supporting Grid):** Cuadrícula responsiva de tarjetas con proporción 2:3, tipografía legible y micro-badges de tipo de medio.
* **Refactor de [`FilmCard.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/FilmCard.tsx):**
  - Eliminados los `text-shadow: 0 0 18px...` y sombras de neón `shadow-[0_22px_60px_-16px...]`.
  - Eliminadas las líneas de brillo animadas inferiores.
  - Elevación sutil basada en borde (`--border-subtle` → `--border-strong`) y escala óptica controlada (`1.03`).

---

## 04 — Music Corner

* **Componente [`MusicSection.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/forms/MusicSection.tsx):**
  - Reducido a una invitación de descubrimiento musical compacta.
  - Tarjetas de lanzamiento con `Badge` semántico (`EP`, `Single`, `Soundtrack`), año en *Geist Mono*, título de la obra y llamada de escucha directa.
  - Se eliminaron tracklists completos y formularios de reseña del Home para no duplicar la experiencia de `/music`.

---

## 05 — Community Invitation

* **Tratamiento sobrio y contextual:**
  - Envuelto en `PageContainer size="narrow"` y `Surface variant="feature"`.
  - Lema: *"Leave a note worth keeping."*
  - Breve invitación para calificar obras, redactar reseñas y personalizar el dossier de perfil.
  - Botones unificados de acceso a `/login` y `/films`.

---

## 06 — Removed Elements (Elementos Eliminados)

1. **Bloque explicativo estilo SaaS:** Se eliminó la sección *"What is SoapyFans Hub?"* con sus tres tarjetas con emojis (`🎬`, `🎵`, `⭐`), que recordaba a una landing page de producto.
2. **Cita decorativa gigante de 14rem:** Se eliminaron las comillas gigantes `text-[14rem]` y la frase sobredimensionada que interrumpía el ritmo de lectura.
3. **Sección duplicada de Televisión:** Se eliminó el bloque independiente de TV que repetía la cuadrícula de Cine, unificándolo en `WorksSection`.
4. **Teaser biográfico duplicado:** Se retiró el cuadro de About del Home para preservar el impacto editorial de la página dedicada `/about`.
5. **Glows y cursivas formulaicas:** Eliminación total de efectos de neón en tarjetas e interactivos.

---

## 07 — Design System Usage (Primitives Reutilizados de Fase 1)

* [`Button`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Button.tsx): Utilizado en Hero, Works y Community.
* [`Badge`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Badge.tsx): Utilizado en `FilmCard` (`film`, `tv`) y `MusicSection` (`music`).
* [`PageContainer`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/PageContainer.tsx): Utilizado para delimitar el contenedor angosto de la sección comunitaria.
* [`Surface`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Surface.tsx): Utilizado para la tarjeta comunitaria `variant="feature"`.
* Tokens semánticos: `--accent-amber`, `--accent-gold`, `--accent-forest`, `--bg-surface`, `--bg-elevated`, `--text-muted` (4.5:1+ contrast).

---

## 08 — Accessibility (Accesibilidad Verificada)

* **Contraste WCAG AA:** Todos los metadatos secundarios superan 4.5:1 sobre fondo oscuro.
* **Navegación por Teclado:** El selector de obras `All / Films / TV` cuenta con atributos ARIA semánticos (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls="works-panel"`) y anillos de foco visibles `.focus-ring`.
* **Soporte de Movimiento Reducido:** Las transiciones respetan `@media (prefers-reduced-motion: reduce)`.

---

## 09 — Performance (Rendimiento)

* **Next.js Cache & ISR:** La página preserva `export const revalidate = 3600` (revalidación cada hora) y el cliente de TMDB utiliza `unstable_cache` de 24h.
* **Optimización de Imágenes:** Todas las imágenes consumen Next.js `Image` con `sizes` calculados y dimensiones ajustadas.
* **Bundle Size:** El tamaño de First Load JS de la Home se mantiene extremadamente ligero (~204 kB compartidos).

---

## 10 — Verification (Resultados de Pruebas)

* **TypeScript Typecheck (`tsc --noEmit`):**
  - **0 errores de tipos**.
* **Suite de Pruebas (`npm test`):**
  - **53 de 53 tests pasando**.
* **Next.js Production Build (`npm run build`):**
  - Compilación exitosa en las 18 rutas de la app.

---

## 11 — Remaining Issues (Próximos Pasos)

Con la Home completada como referente visual de calidad, las siguientes fases abordarán:
* **Fase 3:** Rediseño de las vistas de archivo público (`/films`, `/films/[id]`, `/tv/[id]`, `/music`, `/about`).
* **Fase 4:** Rediseño del Atelier de Perfiles y Dossier Frame (`/profile/[username]`, `/profile/edit`).
* **Fase 5:** Adaptación y optimización específica para Mobile y validación final de accesibilidad.
