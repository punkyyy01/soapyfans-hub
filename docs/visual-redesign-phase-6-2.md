# SoapyFans Hub — Fase 6.2: Consolidación Visual y Corrección del Archivo Desktop

**Documento de Entrega y Consolidación de Diseño**  
**Fecha:** 18 de agosto de 2026  
**Estado:** Completado y Verificado (73/73 tests pasando, 0 errores de TypeScript, build de producción exitoso)

---

## 1. Resumen de la Pasada de Consolidación

La Fase 6.2 es una pasada de consolidación y refinamiento sobre la experiencia Desktop de SoapyFans Hub. Su principio rector es:

> **«Menos artificio, más identidad. Archivo primero, decoración después.»**

Esta fase no introdujo nuevas funcionalidades ni alteró la arquitectura de la aplicación; corrigió patrones visuales repetitivos que restaban sobriedad y coherencia a la plataforma, logrando que el producto se perciba como un **archivo cinematográfico y musical riguroso y contemporáneo**, en lugar de una colección de templates estilizados.

---

## 2. Problemas Detectados Antes del Cambio

1. **Headings con palabras arbitrariamente coloreadas y cursivas artificiales:**  
   Varios títulos principales (H1, H2, aside headers) recurrían a la fórmula `normal word + <span className="italic text-[var(--accent-gold)]">word</span>` (ej. `The Sophie Thatcher <span text-amber>Archive</span>`, `Edit <span text-gold>Profile</span>`, `reads it <span text-gold>back</span>`), desdibujando la jerarquía tipográfica del archivo.
2. **Navbar genérica con falta de estado activo:**  
   La barra de navegación carecía de indicadores de ruta activa (`aria-current="page"`), presentaba botones con resplandor excesivo y la integración de autenticación competía visualmente con los enlaces principales.
3. **Featured Works desproporcionadamente alto y con espacio muerto:**  
   En Home y Filmography, la obra destacada utilizaba un contenedor vertical muy alto (`aspect-16/10` verticalizado) que, al alternar filtros (particularmente TV), dejaba grandes columnas vacías y saltos bruscos de altura.
4. **Artwork de *Pivot & Scrape* no visible en `/music`:**  
   La carátula del EP mostraba el fallback de *"Artwork not available"* debido a que los dominios de distribución musical (`*.scdn.co`, `*.spotifycdn.com`, `*.bcbits.com`, `*.mzstatic.com`) no estaban autorizados en `next.config.ts` (`images.remotePatterns`) ni en la política de seguridad CSP (`img-src`).
5. **Página About como pila de tarjetas cerradas (*Stacked Cards*):**  
   La biografía, la cronología y el reconocimiento se encontraban encapsulados en cajas individuales `[card][card][card]`, transmitiendo una sensación de dashboard genérico en lugar de una monografía editorial continua.

---

## 3. Reglas Definitivas para Headings y Jerarquía Tipográfica

* **Títulos Principales (H1, H2, Hero Titles):**  
  Se renderizan uniformemente en `var(--text-primary)`. Queda prohibido colorear palabras aleatorias dentro de un heading para fines decorativos.
* **Uso Estricto de `--accent-amber` (`#e8890c`):**  
  Reservado exclusivamente para eyebrows/kickers (`text-eyebrow`), metadata activa, indicadores de foco, enlaces de acción y estado seleccionado.
* **Uso Estricto de `--accent-gold` (`#ffb700`):**  
  Reservado exclusivamente para puntuaciones/estrellas de calificación (`★ 4.5`), sellos de premios y galardones.
* **Énfasis Tipográfico:**  
  La diferenciación se logra mediante peso tipográfico (`font-medium`), contraste de tamaño (`clamp`) y tracking refinado, no mediante saturación cromática arbitraria.

---

## 4. Rediseño de la Navbar (Inspirado en la Filosofía de Purgito)

Se rediseñó el componente global de navegación (`components/ui/Navbar.tsx`) con un subcomponente cliente accesible (`components/ui/NavbarLinks.tsx`):

* **Izquierda (Identidad):**  
  Wordmark tipográfico sobrio `SoapyFans Hub` con isotipo de texto equilibrado.
* **Centro (Navegación de Archivo):**  
  Enlaces principales (`Filmography`, `Music`, `About`) con detección dinámica de ruta vía `usePathname()`, asignación de `aria-current="page"` y un sutil indicador inferior en ámbar (`h-[2px] bg-[var(--accent-amber)]`) para la sección activa.
* **Derecha (Auth Integrada y Discreta):**  
  * **Visitante:** Botón *"Sign in"* con borde sutil y fondo de superficie limpio, eliminando sombras brillantes o glows.
  * **Autenticado:** Avatar circular de 28px con borde discreto, handle en monospace (`@username`) y botón *"Logout"* integrado con tipografía monospace compacta.

---

## 5. Nueva Estructura de Featured Works (Home y Filmography)

Se reformuló la variante `featured` de `FilmCard.tsx` y la composición de `WorksSection.tsx`:

* **Composición Horizontal Compacta:**  
  `[ IMAGEN / BACKDROP (40%) ] [ TÍTULO + METADATA + CRÉDITO + CTA (60%) ]`
* **Contenido-Adaptive:**  
  La altura es constante y compacta. En Home (`WorksSection`), la obra destacada se presenta como banner horizontal superior seguido de una cuadrícula fluida de 5 obras de soporte (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`). Funciona de manera idéntica y sin huecos en blanco al alternar entre **All**, **Films** y **TV**.
* **Contraste y Jerarquía:**  
  Año en monospace secundario, calificación de estrellas en `var(--accent-gold)`, badge de tipo de medio con contraste óptimo y enlace de exploración con animación contenida.

---

## 6. Diagnóstico y Solución del Artwork de *Pivot & Scrape*

* **Causa Raíz:**  
  Next.js Image Optimization y la cabecera CSP bloqueaban las URLs remotas de CDNs de audio/música externas (`i.scdn.co`, `*.spotifycdn.com`, `*.bcbits.com`, `*.mzstatic.com`).
* **Configuración de Dominios (`next.config.ts`):**  
  Se añadieron patrones en `images.remotePatterns` para Spotify CDN, Bandcamp CDN y Apple Music CDN.
* **Actualización de Seguridad CSP (`utils/supabase/middleware.ts`):**  
  Se actualizó la directiva `img-src` de Content Security Policy para autorizar `https://*.scdn.co https://*.spotifycdn.com https://*.bcbits.com https://*.mzstatic.com`.
* **Migración de Datos (`supabase/migrations/20260818_update_releases_cover_art.sql`):**  
  Se preparó la migración SQL para garantizar que la tabla `public.releases` contenga las carátulas oficiales en alta resolución.
* **Tests Automatizados:**  
  Se actualizaron los tests en `tests/auth.test.ts` para verificar la inclusión de los CDNs de música en la cabecera CSP.

---

## 7. Nueva Arquitectura Editorial de About (Sin Stacked Cards)

Se transformó `app/(main)/about/page.tsx` en una pieza editorial continua y abierta:

1. **Editorial Masthead:**  
   Encabezado con título `Sophie Bathsheba Thatcher` en tipografía serif, ficha de datos biográficos documentales (Nacimiento, Origen, Edad calculada) y enlaces oficiales verificados junto a un retrato fotográfico de archivo.
2. **Archival Photography (`PhotoGallery`):**  
   Galería de retratos integrada directamente sobre el lienzo, sin bordes de caja envolventes.
3. **Origins & Craft (Biografía Abierta):**  
   Se eliminó el contenedor `rounded-2xl border bg-surface/60`. El texto fluye en una columna editorial (`max-w-3xl`) con interlineado generoso (`leading-[1.85]`), tipografía de apertura destacada, divisores sutiles superior e inferior y una cita textual en bloque destacada con barra ámbar lateral.
4. **Chronology of Work (Timeline Limpia):**  
   Estructurada como un registro cronológico de archivo con divisores horizontales tenues: año y categoría a la izquierda, título, badge y descripción a la derecha.
5. **Recognition (Press & Honors):**  
   Lista de prensa y galardones en formato tabular minimalista con año en monospace y tipografía serif.
6. **Archive Closure:**  
   Cierre sobrio con enlaces de texto hacia Filmography y Music, evitando bloques de marketing desproporcionados.

---

## 8. Lista de Archivos Modificados

| Archivo | Tipo de Cambio | Propósito |
| :--- | :--- | :--- |
| `components/ui/Hero.tsx` | Modificación | Eliminación de palabras coloreadas en el título H1 del Hero. |
| `app/(auth)/register/page.tsx` | Modificación | Eliminación de palabra en color/itálica artificial en el aside del registro. |
| `components/profile/ProfileEditForm.tsx` | Modificación | Limpieza del título H1 (`Edit Profile` en texto plano primario). |
| `components/ui/NavbarLinks.tsx` | Creación | Subcomponente cliente para control de ruta activa con `aria-current="page"`. |
| `components/ui/Navbar.tsx` | Modificación | Rediseño de la Navbar con estilo de archivo sobrio, auth discreto y marca sólida. |
| `components/media/FilmCard.tsx` | Modificación | Refactorización de la variante `featured` a diseño horizontal compacto y adaptable. |
| `components/media/WorksSection.tsx` | Modificación | Composición adaptativa de obras destacadas en Home sin espacio muerto en filtros. |
| `next.config.ts` | Modificación | Registro de CDNs de música (`scdn.co`, `spotifycdn.com`, `bcbits.com`, `mzstatic.com`). |
| `utils/supabase/middleware.ts` | Modificación | Incorporación de CDNs musicales en la directiva `img-src` de CSP. |
| `tests/auth.test.ts` | Modificación | Test unitario para validación de CDNs de música en CSP. |
| `supabase/migrations/20260818_update_releases_cover_art.sql` | Creación | Migración SQL para sincronización de carátulas de lanzamientos musicales. |
| `app/(main)/about/page.tsx` | Modificación | Rediseño editorial abierto de la página biográfica (monografía sin tarjetas encapsuladas). |
| `docs/visual-redesign-phase-6-2.md` | Creación | Documento de entrega y especificación técnica de la Fase 6.2. |

---

## 9. Verificación Técnica y de Calidad

* **TypeScript Typecheck (`npm run typecheck`):**  
  0 errores.
* **Suite de Pruebas Automatizadas (`npm test`):**  
  73/73 tests pasando al 100% en 19 suites de prueba.
* **Next.js Production Build (`npm run build`):**  
  Compilación de producción exitosa en 4.8s. 18 rutas generadas correctamente.

---

## 10. Checklist de Estado Final del Desktop

- [x] **Headings Globales:** Todos los H1/H2 utilizan `var(--text-primary)` sin palabras arbitrariamente coloreadas en amber/gold.
- [x] **Navbar de Archivo:** Marca sobria, enlaces centrales con estado activo visual y de accesibilidad (`aria-current="page"`), bloque de autenticación compacto y discreto.
- [x] **Featured Works:** Compacto, composición horizontal equilibrada, adaptativo a `All`, `Films` y `TV` sin saltos ni espacios muertos.
- [x] **Pivot & Scrape Artwork:** Dominios y CSP configurados para CDNs de Spotify/Bandcamp/Apple Music, con fallback tipográfico elegante en caso de ausencia de imagen.
- [x] **About Monograph:** Estructura editorial abierta, lectura fluida con tipografía y divisores sutiles, timeline de registro documental y reconocimiento sin tarjetas encajonadas.
- [x] **Integridad y Coherencia:** Sin regresiones en perfiles, login, registro, detalle de películas/TV ni catálogo musical.
