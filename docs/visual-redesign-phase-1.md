# SoapyFans Hub — Implementación del Design System y Shell Desktop (Fase 1)

> **Documento de Registro Técnico y Arquitectura de la Fase 1**  
> **Estado:** Fase 1 Completada exitosamente  
> **Proyecto:** SoapyFans Hub (`soapyfans-hub`)  
> **Objetivo:** Infraestructura de Design Tokens, Jerarquía Tipográfica, Superficies, Componentes Compartidos y Shell Global Desktop (Navbar y Footer).

---

## 01 — What Changed (Resumen de Cambios)

Durante la Fase 1, se ha construido la infraestructura visual sobre la que se edificarán las posteriores fases de rediseño sin alterar la lógica de negocio ni romper ninguna de las 18 rutas existentes:

1. **Reestructuración de Design Tokens (`app/globals.css`):**
   - Sistema de variables semánticas agrupadas por responsabilidad (*Background & Surfaces*, *Text & Contrast*, *Brand & Interaction Accents*, *Semantic Accents*, *Borders & Dividers*, *Focus & Elevation*).
   - Corrección integral de contraste para textos secundarios y metadatos (`--text-muted: #968b77`), superando el umbral de **4.5:1** (WCAG AA) sobre fondos oscuros.
   - Sincronización en línea con el motor Tailwind CSS v4 mediante `@theme inline`.
2. **Sistema de Superficies y Contenedores:**
   - Creación de clases de superficie (`.surface-flat`, `.surface-base`, `.surface-elevated`, `.surface-card`, `.surface-feature`) para sustituir el uso repetitivo de tarjetas idénticas.
3. **Paquete de Primitives y Componentes Compartidos (`components/ui/`):**
   - [`Button.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Button.tsx): Botón polimórfico (button / Link) con soporte para variantes (`primary`, `secondary`, `ghost`, `danger`), tamaños (`sm`, `md`, `lg`), estados de carga (`isPending`), accesibilidad de foco y estados deshabilitados.
   - [`Badge.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Badge.tsx): Píldoras semánticas para clasificación (`film`, `tv`, `music`, `award`, `neutral`).
   - [`PageContainer.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/PageContainer.tsx): Contenedores estandarizados (`default` 1280px, `narrow` 1152px, `editorial` 720px, `dossier` 896px, `auth` 420px).
   - [`PageHeader.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/PageHeader.tsx): Cabecera estándar de página con Eyebrow, H1 en *Playfair Display*, descripción, slots para acciones y metadatos en *Geist Mono*.
   - [`SectionHeader.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/SectionHeader.tsx): Encabezado de sección con kicker, H2 y enlace de acción lateral.
   - [`Divider.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Divider.tsx): Separadores sutiles (horizontal, vertical, sección).
   - [`Surface.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Surface.tsx): Componente envolvente para estructurar contenedores y tarjetas.
   - [`EmptyState.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/EmptyState.tsx): Placeholder sobrio para estados vacíos.
   - [`Metadata.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Metadata.tsx): Unidades de metadatos en *Geist Mono* de alto contraste.
4. **Rediseño del Shell Global Desktop:**
   - **Navbar (`components/ui/Navbar.tsx`):** Altura calibrada a 64px (`h-16`), superficie de cristal mate (`--bg-glass`), logotipo sobrio, enlaces de navegación limpios sin separadores artificiales, anillo de foco accesible (`:focus-visible`) y soporte visual unificado tanto para visitantes como para usuarios autenticados.
   - **Footer (`components/ui/Footer.tsx`):** Arquitectura en 4 pilares (*Identity*, *Navigation*, *Community Support*, *Legal & TMDB Attribution*) sin saturación de mayúsculas diminutas.
5. **Normalización de Movimiento y Animación:**
   - `Reveal.tsx` y `Hero.tsx` actualizados con límites de duración de 350ms, desplazamiento vertical suave (16–24px) y anulación instantánea ante `prefers-reduced-motion: reduce`.

---

## 02 — Design Tokens (Tokens Implementados)

```css
:root {
  /* ── Background & Surfaces ────────────────────────────────── */
  --bg-base: #080704;              /* Ébano cálido profundo (Fondo de página) */
  --bg-surface: #0e0d08;           /* Superficie nivel 0 / Contenedor base */
  --bg-elevated: #14120b;          /* Superficie nivel 1 / Menús y tarjetas */
  --bg-card: #18160f;              /* Superficie nivel 2 / Tarjeta interactiva */
  --bg-overlay: rgba(8, 7, 4, 0.85); /* Fondos modales y backdrops */
  --bg-glass: rgba(14, 13, 8, 0.82); /* Fondo del Navbar con backdrop-blur */

  /* ── Text & Contrast (WCAG AA 4.5:1+) ─────────────────────── */
  --text-primary: #f5f0e8;         /* Titulares y cuerpo principal (Marfil) */
  --text-secondary: #c4b9a7;       /* Descripciones y subtítulos (Taupe) */
  --text-muted: #968b77;           /* Metadatos y etiquetas (Contraste corregido) */
  --text-inverse: #080704;         /* Texto oscuro sobre botones ámbar */

  /* ── Brand & Interaction Accents ─────────────────────────── */
  --accent-amber: #e8890c;         /* Acción primaria y foco interactivo */
  --accent-amber-hover: #f5961d;   /* Hover de acción primaria */
  --accent-amber-dim: rgba(232, 137, 12, 0.12); /* Superficie activa */

  /* ── Semantic Accents ─────────────────────────────────────── */
  --accent-gold: #ffb700;          /* Estrellas de rating y galardones */
  --accent-gold-dim: rgba(255, 183, 0, 0.14);
  --accent-forest: #2e6646;        /* Series de televisión y estados de éxito */
  --accent-forest-dim: rgba(46, 102, 70, 0.22);
  --accent-danger: #c53b3b;        /* Estados de error y acciones destructivas */
  --accent-danger-dim: rgba(197, 59, 59, 0.16);

  /* ── Borders & Dividers ───────────────────────────────────── */
  --border-subtle: rgba(245, 240, 232, 0.08);  /* Separadores y tarjetas */
  --border-default: rgba(245, 240, 232, 0.14); /* Inputs y botones secundarios */
  --border-strong: rgba(245, 240, 232, 0.22);  /* Bordes en hover y foco */

  /* ── Focus & Elevation ────────────────────────────────────── */
  --focus-ring: rgba(232, 137, 12, 0.7);
  --shadow-surface: 0 12px 36px -10px rgba(0, 0, 0, 0.7);
}
```

---

## 03 — Typography (Roles Tipográficos)

| Rol Tipográfico | Fuente | Tamaño | Letter Spacing | Utilidad / Clase |
| :--- | :--- | :--- | :--- | :--- |
| **Display XL** | Playfair Display | `2.8rem – 5.6rem` | `tracking-tight` | `.font-display text-[clamp(...)]` |
| **Display L / H1** | Playfair Display | `2.5rem – 4.5rem` | `tracking-tight` | `.font-display text-4xl sm:text-5xl` |
| **Heading M / H2** | Playfair Display | `1.75rem – 2.0rem` | `tracking-tight` | `.font-display text-2xl sm:text-3xl` |
| **Heading S / H3** | Playfair Display | `1.25rem – 1.35rem` | Normal | `.font-display text-lg sm:text-xl` |
| **Eyebrow** | DM Sans | `0.75rem` (12px) | `tracking-[0.16em]` | `.text-eyebrow` |
| **Kicker** | DM Sans | `0.75rem` (12px) | `tracking-[0.14em]` | `.text-kicker` |
| **Metadata / Micro** | Geist Mono | `0.75rem` (12px) | `tracking-[0.04em]` | `.text-metadata` |
| **Body Large** | DM Sans | `1.125rem` (18px) | Normal | `text-base sm:text-lg leading-relaxed` |
| **Body Standard** | DM Sans | `0.9375rem` (15px) | Normal | `text-sm sm:text-base leading-relaxed` |
| **UI Standard** | DM Sans | `0.875rem` (14px) | `tracking-[0.14em]` | `text-xs uppercase font-medium` |

---

## 04 — Components (Primitives Creados)

1. **[`Button.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Button.tsx):**
   - Variantes: `primary`, `secondary`, `ghost`, `danger`.
   - Soporte para enlaces internos (`next/link`) o externos con `target="_blank"`.
   - Estado de carga integrado (`isPending` con spinner accesible).
2. **[`Badge.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Badge.tsx):**
   - Variantes: `film`, `tv`, `music`, `award`, `neutral`.
3. **[`PageContainer.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/PageContainer.tsx):**
   - Contenedor responsive con anchos máximos semánticos (`default`, `narrow`, `dossier`, `editorial`, `auth`).
4. **[`PageHeader.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/PageHeader.tsx):**
   - Cabecera editorial con slots para Eyebrow, H1, Descripción, Acciones y Metadatos.
5. **[`SectionHeader.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/SectionHeader.tsx):**
   - Encabezado unificado de secciones internas con enlace lateral de acción.
6. **[`Divider.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Divider.tsx):**
   - Líneas de corte con variantes horizontal, vertical y de sección.
7. **[`Surface.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Surface.tsx):**
   - Superficies estructuradas (`flat`, `base`, `elevated`, `card`, `feature`).
8. **[`EmptyState.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/EmptyState.tsx):**
   - Manejador accesible para estados sin datos.
9. **[`Metadata.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Metadata.tsx):**
   - Fichas de metadatos en modo inline, fila o apilado.

---

## 05 — Navbar (Shell Superior)

- **Estructura y Dimensiones:** Altura fija de 64px (`h-16`) con superficie de cristal mate (`bg-[var(--bg-glass)]`) y línea de base nítida (`border-b border-[var(--border-subtle)]`).
- **Logo:** `SoapyFans Hub` con transición suave y sin barras animadas parpadeantes.
- **Navegación:** Enlaces directos a `Filmography`, `Music` y `About` con tipografía limpia en `text-xs uppercase tracking-[0.16em]`.
- **Estado de Usuario:**
  - *Visitante:* Botón "Sign in" en píldora ámbar sobria.
  - *Autenticado:* Avatar con micro-anillo ámbar, handle `@username` y botón de "Logout" en píldora de borde sutil.
- **Accesibilidad:** Anillos de foco `:focus-visible` nativos mediante `.focus-ring` y atributo `aria-label="Main Navigation"`.

---

## 06 — Footer (Shell Inferior)

Organizado en 4 pilares visualmente diferenciados:
1. **Identidad:** Nombre de marca, descripción del propósito del archivo cultural y badge `Fan Archive · Est. 2026`.
2. **Navegación:** Enlaces secundarios (`Home`, `Filmography`, `Music`, `About`, `My Profile / Sign in`).
3. **Soporte Comunitario:** Módulo dedicado con botón Ko-fi accesible (`Support on Ko-fi ↗`).
4. **Atribución y Legal:** Franja inferior con copyright `© 2026 SoapyFans Hub`, disclaimer de TMDB API en alto contraste y enlaces legales (`Privacy`, `Terms`, `Copyright & Contact`).
- **Rendimiento:** Unificación del layout entre `Footer` y `FooterFallback` para garantizar consistencia durante el streaming de Next.js Suspense.

---

## 07 — Motion (Sistema de Movimiento)

- **Duraciones:** Limitadas a un máximo de `0.35s` (350ms).
- **Curvas de Easing:** Curvas naturales `power2.out` en GSAP.
- **Desplazamiento Vertical:** Reducido a `16–24px` para evitar saltos bruscos.
- **Preferencia de Movimiento:** Si el sistema detecta `prefers-reduced-motion: reduce`, las animaciones se ejecutan de forma instantánea sin transiciones ni retrasos.

---

## 08 — Profile Compatibility (Modelo Shell vs. Canvas)

- **Aislamiento Estricto:** La inyección de CSS del perfil sigue encapsulada bajo `.profile-canvas { ${sanitizedCss} }`.
- **Inviolabilidad del Shell:** El `Navbar` y el `Footer` residen en el Root Layout fuera del selector `#profile-canvas`, garantizando que ninguna regla de usuario pueda ocultar o romper la navegación global.
- **Protección del Avatar:** Mantiene aislamiento con `isolate` y sombra base neutra para preservar su legibilidad independientemente del color o fondo elegido.
- **Sanitización Activa:** `sanitize-css.ts` continúa bloqueando `@import`, `url()`, `position: fixed/sticky`, `z-index`, `javascript:` y etiquetas HTML.

---

## 09 — Verification (Resultados de Pruebas y Compilación)

- **TypeScript (`npm run typecheck`):**
  - Pasó exitosamente con **0 errores**.
- **Suite de Pruebas Unitarias (`npm test`):**
  - **53 de 53 tests pasando** (OAuth security, open redirect protection, magic bytes image validation, accent color validation, sanitizeCSS, Schema.org JSON-LD, site utils, TMDB client).
- **Compilación de Producción (`npm run build`):**
  - Compilación exitosa de Next.js 15 App Router en las **18 rutas de la aplicación** (estáticas y dinámicas).

---

## 10 — Remaining Work (Próximas Fases)

Una vez asentada la infraestructura visual en esta Fase 1, el trabajo restante se divide en las fases planificadas:

* **Fase 2 (Vistas de Medios y Editorial):**
  - Refactorizar `MediaCard.tsx` y `PhotoGallery.tsx`.
  - Rediseñar `Filmography (/films)` y páginas de detalle (`/films/[id]`, `/tv/[id]`).
  - Rediseñar `Music (/music)` integrando reproductores y pistas con la nueva paleta.
  - Rediseñar `About (/about)` como artículo editorial fluido.
* **Fase 3 (Home y Auth):**
  - Reconstruir la Home (`/`) aplicando la sección unificada de obras (`All / Films / TV`), eliminando bloques innecesarios.
  - Adaptar `/login` y `/register` al nuevo sistema de inputs y botones.
* **Fase 4 (Atelier de Perfiles):**
  - Implementar el marco "Dossier" en `/profile/[username]`.
  - Refinar el editor `/profile/edit` con presets estéticos sugeridos.
* **Fase 5 (Auditoría Final y Responsive):**
  - Revisión exhaustiva de accesibilidad WCAG AA, navegación móvil y pulido final.
