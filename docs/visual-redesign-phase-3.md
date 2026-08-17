# SoapyFans Hub — Fase 3: Rediseño del Archivo Cinematográfico Desktop

> **Documento maestro de entrega para la Fase 3 del rediseño visual de SoapyFans Hub.**  
> Rutas intervenidas: `/films`, `/films/[id]`, `/tv/[id]`.  
> Componentes actualizados/creados: `FilmographySearch`, `FilmCard`, `MediaDetailTabs`, `WhereToWatch`, `ReviewForm`, `PageHeader`, `SectionHeader`.

---

## 1. Resumen de la Fase

La **Fase 3** consolida la transformación visual y arquitectónica del núcleo documental de SoapyFans Hub: el **Archivo Cinematográfico y Televisivo**.

Partiendo de las bases conceptuales (Fase 0), el Design System/Shell (Fase 1) y el rediseño editorial de la Home (Fase 2), esta fase traslada el lenguaje visual a las páginas de índice y fichas de detalle:
1. **`/films` (Archivo general / Filmography Index):** Dejó de comportarse como una pseudo-landing para convertirse en un catálogo de archivo rápido, legible, jerarquizado y con filtrado en tiempo real.
2. **`/films/[id]` (Ficha de archivo cinematográfico):** Estructurada como un dossier documental de dos columnas con hero contenido, protagonismo explícito del crédito de Sophie Thatcher, metadatos ordenados, tabs accesibles de reparto/equipo técnico y zona comunitaria de reseñas con estados de autenticación y lista vacía elegantes.
3. **`/tv/[id]` (Ficha de archivo televisivo):** Arquitectura homóloga con identificación semántica (`Badge variant="tv"` y acentos `--accent-forest`), datos de temporadas/episodios/cadenas y aviso sobrio para futuras reseñas episódicas.

---

## 2. Filosofía aplicada al Archivo

```
┌────────────────────────────────────────────────────────┐
│                   SOAPYFANS HUB                         │
│  Home        → Editorial Discovery                      │
│  Filmography → Archive Navigation & Catalog             │
│  Detail Page → Documentary Dossier                      │
│  Community   → Fan Notes & Reviews                      │
└────────────────────────────────────────────────────────┘
```

* **Archivo primero. Decoración después:** Se eliminaron resplandores exagerados, glows fluorescentes y bloques gigantes de citas que empujaban el catálogo fuera del viewport inicial.
* **Jerarquía obvia e inmediata:**
  1. *Identidad de la obra:* Título principal, tipo de medio, año, duración/temporadas y estado.
  2. *Conexión con Sophie Thatcher:* Identificación documental inmediata del personaje interpretado (`Sophie Thatcher as [Character]`).
  3. *Media primario:* Póster en proporción cinematográfica clásica 2:3 con borde sutil y sombras naturales.
  4. *Información técnica TMDB:* Ficha técnica sobria (estudios, países, directores, idiomas, títulos alternativos).
  5. *Voz comunitaria:* Espacio para valoraciones en estrellas y notas de fans.

---

## 3. Estructura visual de `/films`

### 3.1. Page Header y Metadatos Documentales
* **Header:** Implementado con [`PageHeader`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/PageHeader.tsx) con eyebrow `Archive Index · Screen Credits`, título `Filmography` en `font-display` y descripción concisa de archivo.
* **Metadatos secundarios:** Fila horizontal limpia que presenta el conteo exacto de largometrajes, series de TV, lapso temporal (`Timeline 2018 — Present`) y criterio cronológico (`Most recent first`).
* **Navegación por anclas:** Accesos directos sobrios estilo píldora (`Films ↓`, `Television ↓`, `Beyond ↓`) con estados de foco visibles (`focus-ring`).

### 3.2. Búsqueda y Filtrado en Tiempo Real ([`FilmographySearch`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/FilmographySearch.tsx))
* Componente interactivo client-side integrado en la parte superior del catálogo.
* Permite filtrar simultáneamente por título de obra, nombre del personaje o año de estreno.
* **Estado de resultados:** Presenta el conteo de coincidencias y una cuadrícula responsiva limpia.
* **Estado vacío:** Usa [`EmptyState`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/EmptyState.tsx) con botón para reiniciar el filtro si no hay resultados.

### 3.3. Bloque de Largometrajes (`#films`)
* **Obra destacada (`FilmCard featured={true}`):** Banner cinematográfico 16:9 para el largometraje más reciente con tipografía legible, badge de medio, año, rating de estrellas y link directo.
* **Cuadrícula de películas:** Grid de 2 a 5 columnas (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`) con posters 2:3, tipografía en escala semántica y badges ámbar.

### 3.4. Transición Editorial: *Yellowjackets*
* Sustitución del antiguo bloque desmedido por un contenedor [`Surface`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Surface.tsx) contenido y elegante:
  * Badge: `Yellowjackets · 2021–Present` con token `--accent-forest`.
  * Titular: `29 episodes as Natalie Scatorccio.`
  * Breve glosa documental contextual.

### 3.5. Bloque de Televisión (`#television`)
* [`SectionHeader`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/SectionHeader.tsx) con kicker `Television Series` y título `On the Small Screen`.
* Cuadrícula con badges de televisión en tono bosque (`--accent-forest`).

### 3.6. Más allá de la Pantalla (`#beyond`)
* Sección alimentada por Wikidata con créditos complementarios (teatro, apariciones especiales, producciones musicales) organizados en tarjetas de superficie `Surface variant="card"`.

---

## 4. Estructura visual de `/films/[id]` y `/tv/[id]`

Ambas rutas de detalle adoptaron una arquitectura simétrica adaptada al medio:

### 4.1. Hero Backdrop Contenido
* Altura optimizada (`h-48 sm:h-64`) con opacidad controlada (40%) y fundido suave en degradado hacia `--bg-base`.
* La información documental clave ya no queda oculta bajo el scroll de primer impacto.
* Enlace de retorno directo: `← Back to filmography` o `← Back to television index`.

### 4.2. Bloque de Identidad (Header)
* Badge semántico: `Badge variant="film"` ("Feature Film") o `Badge variant="tv"` ("Television Series").
* Metadatos técnicos rápidos: Año de lanzamiento / Lapso al aire, duración en minutos / temporadas y episodios, estado de producción.
* Título H1 de alto impacto en `font-display` y tagline en cursiva editorial.

### 4.3. Dossier Layout de Dos Columnas (`lg:grid-cols-[280px_1fr]`)

#### Columna Izquierda (Sidebar de Archivo):
1. **Póster principal:** Formato 2:3 nítido, borde `border-[var(--border-subtle)]`, esquina redondeada `rounded-xl`, sombra suave. Fallback a placeholder limpio si no está disponible.
2. **Tarjeta de Sujeto de Archivo (Sophie Connection):**
   ```text
   Archive Subject
   Sophie Thatcher
   as [Character Name]
   ```
3. **Factsheet Técnico:**
   * Rating TMDB en estrellas ámbar.
   * Fechas de estreno / Primera y última emisión.
   * Duración promedio / Temporadas y episodios.
   * Géneros cinematográficos / Creadores / Cadenas.
4. **Where to Watch ([`WhereToWatch`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/WhereToWatch.tsx)):**
   * Integrado visualmente con el diseño general (logotipos de proveedores con borde sutil, atribución limpia a JustWatch y enlace de opciones completas).

#### Columna Derecha (Cuerpo del Documento):
1. **Sinopsis / Overview:** Lectura confortable (`font-display text-xl sm:text-2xl text-[var(--text-primary)]`).
2. **Tabs de Reparto y Producción ([`MediaDetailTabs`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/MediaDetailTabs.tsx)):**
   * Pestañas accesibles (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`):
     * *Cast:* Reparto principal con nombre y personaje.
     * *Crew:* Equipo técnico agrupado por relevancia (Director, Screenplay, Cinematography, Music, etc.).
     * *Details:* Estudios de producción, países, idiomas y títulos alternativos.
     * *Genres:* Lista de géneros asociados.
     * Enlace saliente a la ficha TMDB completa.
3. **Sección de Reseñas / Fan Notes:**
   * En `/films/[id]`:
     * Formulario interactivo ([`ReviewForm`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/forms/ReviewForm.tsx)) para usuarios registrados con selector de 1 a 5 estrellas y área de texto estilizada.
     * Si no está autenticado: Banner sobrio que invita a iniciar sesión sin romper el diseño.
     * Listado de reseñas existentes con iniciales de avatar, estrellas doradas, fecha y texto.
     * Estado vacío elegante ([`EmptyState`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/EmptyState.tsx)) si aún no hay notas comunitarias.
   * En `/tv/[id]`:
     * Banner informativo con botón para explorar largometrajes con reseñas abiertas.

---

## 5. Inventario de Componentes y Primitivas Utilizadas

| Componente | Ubicación | Rol en Fase 3 |
|---|---|---|
| [`PageContainer`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/PageContainer.tsx) | `components/ui/PageContainer.tsx` | Contenedor responsivo centralizado (`default` = 1280px). |
| [`PageHeader`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/PageHeader.tsx) | `components/ui/PageHeader.tsx` | Encabezado principal de archivo en `/films`. |
| [`SectionHeader`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/SectionHeader.tsx) | `components/ui/SectionHeader.tsx` | Separadores temáticos para Films, TV, Beyond y Reviews. |
| [`Badge`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Badge.tsx) | `components/ui/Badge.tsx` | Diferenciación semántica entre películas (`film`) y series (`tv`). |
| [`Button`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/Button.tsx) | `components/ui/Button.tsx` | Acciones de autenticación, envío de reseñas y navegación. |
| [`EmptyState`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/ui/EmptyState.tsx) | `components/ui/EmptyState.tsx` | Fallback para búsquedas sin resultados y fichas sin reseñas. |
| [`FilmCard`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/FilmCard.tsx) | `components/media/FilmCard.tsx` | Tarjeta de catálogo con proporciones 2:3 y 16:9 destacada. |
| [`FilmographySearch`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/FilmographySearch.tsx) | `components/media/FilmographySearch.tsx` | Buscador y filtrador client-side en tiempo real para el archivo. |
| [`MediaDetailTabs`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/MediaDetailTabs.tsx) | `components/media/MediaDetailTabs.tsx` | Pestañas accesibles WAI-ARIA de ficha técnica y reparto. |
| [`WhereToWatch`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/media/WhereToWatch.tsx) | `components/media/WhereToWatch.tsx` | Sección de disponibilidad en streaming JustWatch. |
| [`ReviewForm`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/forms/ReviewForm.tsx) | `components/forms/ReviewForm.tsx` | Formulario de calificación y reseñas comunitarias. |

---

## 6. Accesibilidad, SEO y Performance

1. **Accesibilidad (a11y):**
   * Pestañas de detalle (`MediaDetailTabs`) con atributos `role="tablist"`, `role="tab"`, `aria-selected` y `aria-controls`.
   * Calificación en estrellas en `ReviewForm` con labels explicativas (`Rate X out of 5 stars`) y control completo por teclado.
   * `FilmographySearch` con label accesible para lectores de pantalla y botón de borrado explícito.
   * Enlaces con anillos de enfoque (`focus-ring`) para navegación por tabulación.
2. **SEO y Datos Estructurados:**
   * `/films`: `CollectionPageSchema` con descripción y canonicals.
   * `/films/[id]`: `MovieSchema` con actores, género, fecha de estreno y ficha técnica.
   * `/tv/[id]`: `TvSeriesSchema` con temporadas, episodios y fecha de emisión.
   * OpenGraph y Twitter Cards optimizadas con imágenes TMDB de alta resolución.
3. **Rendimiento:**
   * Imágenes servidas mediante `next/image` con `sizes` optimizados y cargas prioritarias (`priority`) en el primer viewport.
   * Revalidación incremental (ISR: `revalidate = 3600`) para garantizar velocidad estática y datos frescos de TMDB y Supabase.

---

## 7. Decisiones de Diseño Clave y Justificación

| Decisión de Diseño | Razón Técnica / Editorial |
|---|---|
| **Hero de detalle compacto (h-48/h-64)** | Evita que el usuario tenga que hacer scroll para ver la información básica y la sinopsis de la obra. |
| **Tarjeta "Archive Subject" destacada** | SoapyFans Hub es un archivo sobre Sophie Thatcher; su papel y crédito en la obra deben ser inmediatamente visibles. |
| **Buscador interactivo en `/films`** | Permite a los fans encontrar rápidamente cualquier título, personaje o año sin recargar la página. |
| **WhereToWatch integrado cromáticamente** | Mantiene la identidad de marca de los servicios de streaming sin romper la paleta oscura cinematográfica. |
| **Pestañas WAI-ARIA en lugar de acordeones gigantes** | Reduce la longitud vertical de la página de detalle y agrupa la información técnica de forma navegable. |

---

## 8. Verificación y Pruebas Realizadas

* **TypeScript Compilation:** `npm run typecheck` completado con **0 errores**.
* **Suite de Pruebas Unitarias:** `npm test` ejecutó **56 tests pasando (0 fallos)** en 15 suites (seguridad OAuth, sanitización CSS, Magic-Bytes, Schema.org y utilidades TMDB).
* **Compilación de Producción:** `npm run build` compiló exitosamente las **18 rutas** de la aplicación Next.js 15.

---

## 9. Próximos Pasos (Fase 4)

Con el archivo cinematográfico y la Home consolidados bajo el nuevo sistema visual, los siguientes pasos abarcan:
* **Fase 4:** Rediseño del **Archivo Musical y Discografía** (`/music`).
* **Fase 5:** Rediseño de la página **About / Manifiesto de la Comunidad** (`/about`).
* **Fase 6:** Rediseño del flujo de **Autenticación y Perfiles de Usuario** (`/login`, `/register`, `/profile/[username]`, `/profile/edit`).
