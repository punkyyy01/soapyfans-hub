# SoapyFans Hub — Fundación y Sistema Visual (Fase 0)

> **Documento de Auditoría Técnica, Dirección Visual y Arquitectura del Sistema de Diseño**  
> **Estado:** Fase 0 — Aprobación y Fundamentos (Sin cambios en código de producción)  
> **Proyecto:** SoapyFans Hub (`soapyfans-hub`)  
> **Identidad:** Unofficial Sophie Thatcher Fan Archive & Community

---

## 01 — Current State (Estado Actual)

### 1.1 Naturaleza del Producto
SoapyFans Hub es una plataforma híbrida construida con Next.js 15 (App Router), Tailwind CSS v4, Supabase y la API de TMDB. Combina:
1. **Archivo cultural público:** Filmografía, créditos televisivos, lanzamientos musicales, biografía editorial y galería fotográfica de Sophie Thatcher.
2. **Comunidad interactiva:** Autenticación (Google OAuth, Discord, email/password), calificaciones de 1 a 5 estrellas, reseñas escritas y feed de actividad.
3. **Atelier de perfiles:** Personalización profunda del perfil de usuario mediante avatar, banner panorámico, color de acento, curaduría de títulos favoritos ("Sophie Picks" con drag-and-drop) e inyección de CSS personalizado sanitizado (`profile_css`).

### 1.2 Inventario de Archivos e Interfaces Existentes

```
├── app/
│   ├── globals.css                # Tokens CSS, temas Tailwind v4, SVG noise, animaciones
│   ├── layout.tsx                 # Root layout, Google Fonts (DM Sans, Playfair, Geist Mono), JSON-LD
│   ├── (main)/
│   │   ├── page.tsx               # Home: Hero, Films, Propósito, Quote, TV, About teaser, Music, CTA
│   │   ├── films/page.tsx         # Índice de Filmografía: Cine, TV, Beyond the screen (Wikidata)
│   │   ├── films/[id]/page.tsx    # Detalle de Película: Banner, Aside técnico, Tabs, Reseñas
│   │   ├── tv/[id]/page.tsx       # Detalle de Serie TV: Banner, Aside técnico, Tabs, Estado de reseñas
│   │   ├── music/page.tsx         # Discografía: Header, Releases, TrackList, Spotify/Bandcamp, Reseñas
│   │   ├── about/page.tsx         # Editorial: Masthead, Galería (Lightbox), Biografía, Timeline, Reconocimientos
│   │   ├── profile/[username]/    # Perfil público: Banner, Avatar, Bio, Sophie Picks, Actividad, Canvas CSS
│   │   ├── profile/edit/page.tsx  # Editor de perfil: Formulario modular en 5 secciones + modal de búsqueda TMDB
│   │   ├── contact/page.tsx       # Copyright, DMCA y contacto
│   │   ├── privacy/page.tsx       # Política de privacidad
│   │   └── terms/page.tsx         # Términos de servicio
│   └── (auth)/
│       ├── login/page.tsx         # Formulario de inicio de sesión centrado
│       └── register/page.tsx      # Registro split-screen editorial
├── components/
│   ├── ui/
│   │   ├── Navbar.tsx             # Barra fija superior (73px), logo, links, estado auth
│   │   ├── Footer.tsx             # Pie de página con enlaces, copyright, TMDB disclaimer, Ko-fi
│   │   ├── Hero.tsx               # Hero con slider de retratos (3s), parallax GSAP, titulares
│   │   └── Reveal.tsx             # Wrapper cliente de animación con GSAP ScrollTrigger
│   ├── media/
│   │   ├── FilmCard.tsx           # Tarjeta de película/serie (estándar y destacada)
│   │   ├── MediaDetailTabs.tsx    # Pestañas de Cast, Crew, Details, Genres
│   │   ├── PhotoGallery.tsx       # Galería en cuadrícula + Lightbox con navegación por teclado
│   │   ├── TrackList.tsx          # Lista de pistas con duración y botón modal de YouTube
│   │   ├── WhereToWatch.tsx       # Plataformas de streaming/renta/compra vía JustWatch/TMDB
│   │   └── YoutubeModal.tsx       # Reproductor modal embebido nocookie
│   ├── forms/
│   │   ├── ReviewForm.tsx         # Formulario de reseñas de películas (5 estrellas + texto)
│   │   ├── MusicReviewForm.tsx    # Formulario de reseñas de música
│   │   └── MusicSection.tsx       # Bloque de 3 releases para la Home
│   ├── profile/
│   │   ├── ProfileEditForm.tsx    # Atelier completo de edición de perfil (1,130 líneas)
│   │   └── ActivityFeed.tsx       # Feed de reseñas con edición y borrado inline
│   └── auth/
│       └── OAuthButtons.tsx       # Botones de Discord y Google con estado de carga
└── utils/
    ├── sanitize-css.ts            # Filtro regex contra inyección de CSS malicioso
    ├── site.ts                    # Constantes de marca y generadores de URLs
    ├── tmdb.ts                    # Cliente API TMDB con caché ISR (86400s)
    └── schema.ts                  # Generadores de Schema.org JSON-LD
```

### 1.3 Inventario de Recursos Visuales Actuales

| Recurso Visual | Dónde se usa | Clasificación | Justificación |
| :--- | :--- | :--- | :--- |
| **Fondo oscuro cálido** (`#080704`, `#111009`, `#16140d`) | `globals.css`, todas las páginas | **Core identity** | Crea una atmósfera cinematográfica íntima y distintiva frente a los modos oscuros fríos y azulados tradicionales. |
| **Acentos ámbar/oro** (`#e8890c`, `#ffb700`) | Botones, títulos, enlaces, tags | **Core identity** | Evoca fuego, celuloide y el tono visual de *Yellowjackets* / *Heretic*. Requiere regulación de intensidad. |
| **Acento bosque** (`#2a5c3f`) | Badges de TV, degradados de fondo | **Useful** | Ofrece contraste orgánico; actualmente está infrautilizado y subexpuesto. |
| **SVG Grain Overlay** | `body::before`, `.grain` | **Core identity** | Aporta textura analógica cinematográfica sutil (0.035 opacidad). |
| **Playfair Display (Serif)** | Titulares, display, citas | **Core identity** | Da carácter de publicación cultural y revista de cine. |
| **DM Sans (Sans)** | UI, body, formularios, metadatos | **Core identity** | Legible, neutra y sólida para interfaces interactivas. |
| **Geist Mono (Mono)** | Años, duraciones, códigos, tabs | **Useful** | Da precisión de índice documental a datos cuantitativos. |
| **GSAP + ScrollTrigger** | `Hero.tsx`, `Reveal.tsx` | **Useful** | Entrada suave de contenidos; requiere límites estrictos para evitar fatiga. |
| **Text-shadow Glow** (`text-shadow: 0 0 18px...`) | `FilmCard.tsx` | **Noise** | Sensación de plantilla generada por IA; ensucia la legibilidad sobre fondos oscuros. |
| **Hover Box-Shadows gigantes** (`0 22px 60px -16px...`) | `FilmCard.tsx`, `PhotoGallery.tsx` | **Noise** | Efecto exagerado de neón que compite con el póster cinematográfico. |
| **Shine line inferior animado** | `FilmCard.tsx`, `FeaturedFilmCard`, `PhotoGallery.tsx` | **Noise** | Recurso decorativo repetido en 4 archivos sin función informativa. |
| **Palabras individuales en cursiva dorada** | En prácticamente todos los `<h2>` del sitio | **Noise** | Patrón repetitivo y formulaico que genera fatiga visual inmediata. |
| **Tracking extremo** (`tracking-[0.55em]`) en fuentes diminutas | Eyebrows y metadatos (`text-[0.62rem]`) | **Noise / Accesibilidad** | Dificulta la lectura de datos clave y compromete la accesibilidad. |
| **Comillas gigantes decorativas** (`text-[14rem]`) | Home (sección 4) | **Noise** | Ocupa espacio vertical masivo repitiendo un eslogan innecesario. |
| **Botones de marcas externas en colores vivos** (Spotify verde, Bandcamp cian) | `music/page.tsx` | **Optional / Desintegrado** | Rompe la cohesión cromática del archivo con verdes y azules saturados. |

---

## 02 — Problems (Problemas Visuales por Severidad)

### Severidad Crítica (Rompe la experiencia o la identidad)

1. **Sobrecarga estructural y redundancia en la Home (`/`)**:
   - La Home contiene **8 bloques masivos** que intentan comunicar todo a la vez: Hero con slider y parallax, Filmografía reciente con card 2x2, Explicación del propósito del sitio (con emojis y tarjetas de SaaS), Cita gigante de 14rem, TV Work con idéntica estructura a Films, Teaser biográfico de Sophie con foto, Music Section con 3 tarjetas, y Banner final de registro a la comunidad.
   - El bloque "About SoapyFans Hub / Application Purpose" parece una tarjeta de presentación para revisores de API o una landing de SaaS, rompiendo la inmersión de un archivo cultural.

2. **Indefinición del límite entre el "Shell de SoapyFans" y el "Canvas del Usuario" en Perfiles**:
   - `profile/[username]/page.tsx` inyecta `.profile-canvas { ${sanitizedCss} }` cubriendo casi todo el contenedor de la página bajo el Navbar. Si un usuario aplica estilos disruptivos (`background`, `color`, `font-family`), estos afectan elementos estructurales de metadatos del sitio sin un marco contenedor ("frame") que delimite claramente el documento de SoapyFans del lienzo personal.

### Severidad Alta (Degrada la calidad visual y la percepción de marca)

3. **Síndrome de "Plantilla de IA" por combinación formulaica de recursos**:
   - La combinación repetida en todas las páginas de:
     * Eyebrow en `text-[0.68rem] uppercase tracking-[0.55em] text-[var(--accent-amber)]`
     * Título `font-display` con la última palabra en `<span className="italic text-[var(--accent-gold)]">...</span>`
     * Tarjeta con fondo translúcido y borde `border-[var(--border-subtle)]`
     * Glows y sombras anaranjadas en hover
     * Pills redondeados `rounded-full`
   - Esta fórmula idéntica en Home, Films, TV, Music, About y Profile Editor elimina la individualidad de cada contexto y crea una sensación de interfaz genérica generada por prompt.

4. **Monocromatismo ámbar saturado y falta de jerarquía cromática**:
   - `--accent-amber` (`#e8890c`) y `--accent-gold` (`#ffb700`) se utilizan indistintamente para títulos, enlaces, bordes, estados activos, ratings, botones primarios, fondos de hover y sombras. No hay distinción clara entre lo que es un *estado interactivo*, un *acento de marca*, una *calificación* o un *metadato*.

5. **Problemas de contraste y legibilidad en metadatos**:
   - `--text-muted` (`#7a715f`) sobre el fondo base (`#080704`) produce un ratio de contraste de **~3.6:1**, por debajo del mínimo de **4.5:1** exigido por WCAG 2.1 AA para texto pequeño.
   - Al combinarse con tamaños como `text-[0.62rem]` (9.9px) y tracking extremo (`0.55em`), fechas, categorías y conteos resultan difíciles de leer.

### Severidad Media (Inconsistencias de composición y layout)

6. **Repetición compositiva entre Cine y Televisión**:
   - En la Home, la sección de Películas y la de Series utilizan exactamente la misma rejilla (1 tarjeta destacada 2x2 + 3 tarjetas secundarias), generando monotonía vertical.
7. **Desintegración visual de la sección de Música (`/music`)**:
   - La página de música introduce botones con colores de marca ajenos (verde Spotify `#1DB954`, cian Bandcamp `#1DA0C3`) en cajas rectangulares que chocan con la paleta cálida y oscura del sitio.
   - Los números de pista en `TrackList` (`text-2xl font-bold`) tienen un peso visual desproporcionado que compite con el título de la canción.
8. **Sobreabundancia de elementos decorativos en la página About (`/about`)**:
   - La imagen del masthead utiliza una superposición de color agresiva (`mix-blend-color` con gradientes ámbar y verde), seguida de una galería, una sección biográfica full-bleed oscura, un timeline y una tabla de reconocimientos. El ritmo parece una suma de plantillas en vez de un artículo editorial continuo.
9. **Navbar con microelementos y divisores redundantes**:
   - Los enlaces de navegación utilizan divisores verticales (`h-3 w-px`) que fragmentan la barra, y los estados de hover aplican líneas y sombras animadas innecesarias.
10. **Footer sobrecargado con peso visual homogéneo**:
    - El copyright, los avisos de TMDB, el botón de Ko-fi, la descripción y los enlaces legales compiten con la misma fuerza tipográfica en mayúsculas pequeñas.

---

## 03 — Root Causes (Causas Raíz)

1. **Diseño por adición sin poda jerárquica**: Cada nueva necesidad de información (explicar la app, justificar el uso de TMDB, avisar de OAuth, promocionar Ko-fi, enlazar a redes) se resolvió creando un nuevo bloque decorado con el mismo nivel de protagonismo, en lugar de integrarse orgánicamente en la arquitectura de la página.
2. **Uso de estilos como "efectos especiales" en lugar de "lenguaje de diseño"**: Los gradientes, glows, líneas de brillo en hover y cursivas doradas se aplicaron como adornos aislados para hacer que los elementos "se vean modernos", generando ruido visual acumulativo.
3. **Ausencia de un sistema de espaciado y tipografía estandarizado**: El código actual utiliza valores arbitrarios en cada componente (`tracking-[0.55em]`, `tracking-[0.45em]`, `tracking-[0.34em]`, `tracking-[0.28em]`, `text-[0.68rem]`, `text-[0.62rem]`, `text-[0.72rem]`), lo que impide una coherencia estructural.
4. **Falta de definición conceptual entre "Documento" y "Canvas"**: En los perfiles, se interpretó la personalización como un override global de CSS sobre el contenedor padre, en lugar de construir un "marco institucional" que proteja la navegación y contenga de forma elegante el lienzo creativo del usuario.

---

## 04 — Design Principles (Principios de Diseño)

Estos 12 principios gobernarán todas las decisiones del futuro rediseño:

1. **Carácter de Archivo Editorial sobre Plantilla SaaS**: SoapyFans Hub debe sentirse como una publicación cultural física llevada a la web contemporánea —un cruce entre un monográfico de cine prestigioso (*Criterion / Sight & Sound*) y un cuaderno de notas de autor.
2. **Jerarquía Visual Estricta de 4 Niveles**:
   - **Nivel 1 (¿Qué es esto?):** Título principal o entidad (Playfair Display, peso mediano a semibold, tracking natural).
   - **Nivel 2 (¿Qué debo mirar?):** Encabezados de sección y tarjetas de contenido principal.
   - **Nivel 3 (¿Qué puedo hacer?):** Acciones interactivas, pestañas, botones, enlaces y campos de formulario.
   - **Nivel 4 (¿Qué información complementaria existe?):** Metadatos, años, roles, duraciones, notas al pie y avisos legales.
3. **Restricción y Propósito en el Uso del Color**:
   - **Ámbar cálido (`#e8890c`):** Exclusivo para foco interactivo, enlaces primarios y botones de acción principal.
   - **Oro suave (`#ffb700`):** Exclusivo para calificaciones (estrellas) y reconocimientos/galardones.
   - **Verde bosque (`#2a5c3f`):** Acento secundario para elementos de televisión, metadatos seriales y estados de confirmación.
   - **Neutros cálidos:** Textos primarios en marfil (`#f5f0e8`), secundarios en taupe (`#b8ad9b`) y fondos en ébano cálido (`#080704`).
4. **Contraste Accesible sin Excepciones**: Todo texto legible debe superar el ratio 4.5:1 contra su fondo. Los metadatos secundarios deben ser nítidos y legibles sin forzar la vista.
5. **Fin de las Cursivas y Glows Formulaicos**: Se prohíbe el uso automático de la última palabra en cursiva dorada en cada encabezado. El énfasis tipográfico se reservará para citas textuales reales o nombres de obras. Se eliminan los text-shadows y box-shadows de neón.
6. **Card Design Basado en Superficies, no en Resplandores**: La elevación se logra mediante diferencias sutiles de color de fondo (`--bg-card`), bordes de un pixel nítidos (`--border-subtle`) y espaciado interior generoso.
7. **La Fotografía es el Protagonista Visual**: Las imágenes de Sophie Thatcher y los fotogramas de películas/series deben presentarse con alta fidelidad, sin filtros de tinte destructivos ni máscaras de gradientes excesivas.
8. **Movimiento Silencioso y Respetuoso**: Las animaciones GSAP no deben superar los 350ms, no deben provocar layout shifts ni retrasar la lectura del usuario, y deben desactivarse limpiamente con `prefers-reduced-motion`.
9. **Separación Inviolable entre Shell y Canvas de Usuario**:
   - **SoapyFans Shell:** Navbar, marco de la página, navegación global, acciones de seguridad y footer son inmutables y controlados por el sistema.
   - **User Canvas:** El banner, avatar, colores personales, selecciones favoritas y CSS personalizado viven dentro de un contenedor claramente delimitado ("Dossier"), permitiendo máxima libertad sin romper la usabilidad del sitio.
10. **Tratamiento Homogéneo de Plataformas Externas**: Enlaces a Spotify, Bandcamp, YouTube o TMDB adoptan el lenguaje visual sobrio del archivo, evitando logotipos chillones o fondos estridentes que rompan la atmósfera.
11. **Vocabulario Unificado de Formularios**: Inputs, textareas, botones y selectores de estrellas comparten un mismo radio de curvatura (`rounded-lg`), bordes uniformes y estados de foco idénticos en Auth, Reseñas y Atelier de Perfil.
12. **Cultura Comunitaria Integrada**: La personalización de perfiles no es solo una página de ajustes, sino un espacio cultural donde los usuarios pueden curar sus selecciones, compartir estéticas y explorar perfiles de otros fans.

---

## 05 — Visual Direction (Dirección Visual Específica)

### La Atmósfera "SoapyFans"
SoapyFans Hub no es ni un dashboard corporativo frío ni una wiki desordenada. Se define visualmente como:

> **"Un archivo cinematográfico nocturno, cálido y analógico, con tipografía editorial deliberada, fotografía en alta definición tratada con respeto y una capa comunitaria que celebra el fan-art y la personalización sin perder el rigor documental."**

### Atributos Visuales Clave:
- **Tonalidad:** Nocturna, cálida, con matices de madera oscura, papel envejecido de alta calidad, celuloide y luz de ámbar.
- **Textura:** Grano analógico microscópico subyacente (0.035 opacidad) que elimina la frialdad del renderizado digital plano.
- **Tipografía:** Fusión de un serif editorial clásico de alto contraste (*Playfair Display*) para titulares y nombres propios, con una sans geométrica moderna y limpia (*DM Sans*) para UI y lectura continua, apoyada en *Geist Mono* para códigos y cronologías.
- **Bordes y Superficies:** Líneas finas de 1px semitransparentes que recuerdan a las guías de maquetación editorial.

---

## 06 — Color System (Sistema de Color y Tokens)

### 6.1 Paleta Base y Semántica

```
┌────────────────────────────────────────────────────────────────────────┐
│ SUPERFICIES & FONDOS                                                  │
│ --bg-base:        #080704  (Fondo base / Ébano cálido profundo)        │
│ --bg-elevated:    #12100a  (Superficie nivel 1 / Bloques secundarios)  │
│ --bg-card:        #18150e  (Superficie nivel 2 / Tarjetas interactivas)│
│ --bg-overlay:     rgba(8, 7, 4, 0.85) (Fondos modales / Backdrops)     │
├────────────────────────────────────────────────────────────────────────┤
│ TEXTOS & CONTRASTE (Conformes a WCAG AA 4.5:1+)                        │
│ --text-primary:   #f5f0e8  (Titulares, cuerpo principal / Marfil claro)│
│ --text-secondary: #c4b9a7  (Descripciones, subtítulos / Taupe claro)   │
│ --text-muted:     #8f8472  (Metadatos, etiquetas / Ocre grisáceo)      │
├────────────────────────────────────────────────────────────────────────┤
│ ACENTOS & ESTADOS                                                      │
│ --accent-amber:       #e8890c  (Acción primaria, foco interactivo)     │
│ --accent-amber-hover: #ff9b20  (Hover de acción primaria)              │
│ --accent-amber-dim:   rgba(232, 137, 12, 0.12) (Superficie activa)     │
│ --accent-gold:        #ffb700  (Estrellas de rating, galardones)       │
│ --accent-forest:      #2e6646  (Series TV, estados de éxito)           │
│ --accent-forest-dim:  rgba(46, 102, 70, 0.20)  (Pills de TV)           │
├────────────────────────────────────────────────────────────────────────┤
│ BORDES & DELIMITADORES                                                 │
│ --border-subtle:  rgba(245, 240, 232, 0.08) (Separadores y tarjetas) │
│ --border-strong:  rgba(245, 240, 232, 0.16) (Bordes de inputs y foco) │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Reglas de Uso del Color
1. **Regla del 70 / 20 / 10:**
   - 70% Superficies oscuras neutras (`--bg-base`, `--bg-elevated`, `--bg-card`).
   - 20% Textos neutros legibles (`--text-primary`, `--text-secondary`, `--text-muted`).
   - 10% Acentos cromáticos (`--accent-amber`, `--accent-gold`, `--accent-forest`).
2. **Desacoplamiento de Ámbar y Oro:**
   - El **Ámbar** se reserva para la interacción (botones primarios, enlaces activos, bordes en foco).
   - El **Oro** se reserva para el valor cualitativo (estrellas de reseña, sellos de premios). Nunca se usa oro para fondos de botón completos.
3. **Eliminación de Resplandores:** Se eliminan los `box-shadow` de color anaranjado de gran radio en favor de sombras neutras profundas `shadow-2xl` (`rgba(0,0,0,0.6)`).

---

## 07 — Typography System (Sistema Tipográfico)

### 7.1 Familias Tipográficas y Roles
- **Display / Titulares:** `Playfair Display` (Serif). Uso: Título de página, título de película/serie/disco, citas textuales y nombres propios.
- **Interfaz y Lectura:** `DM Sans` (Sans). Uso: Navegación, cuerpo de texto, descripciones, formularios, botones, metadatos estándar.
- **Datos Cuantitativos:** `Geist Mono` (Mono). Uso: Años, duraciones (min/seg), conteos de créditos, números de pista, código CSS.

### 7.2 Escala Tipográfica Estandarizada (Desktop)

| Rol Tipográfico | Fuente | Tamaño | Peso | Line Height | Letter Spacing | Caso de Uso |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display XL** | Playfair | `3.5rem – 4.5rem` (56–72px) | Medium (500) | `0.95` | `-0.02em` | Hero principal, Nombre en About |
| **Display L** | Playfair | `2.5rem – 3.0rem` (40–48px) | Medium (500) | `1.05` | `-0.015em` | Títulos de página (Filmography, Music) |
| **Heading M** | Playfair | `1.75rem – 2.0rem` (28–32px) | Semibold (600) | `1.15` | `-0.01em` | Títulos de sección, Nombre de release |
| **Heading S** | Playfair | `1.25rem – 1.35rem` (20–22px) | Medium (500) | `1.25` | `0` | Título de tarjetas medianas, items de lista |
| **Eyebrow / Kicker** | DM Sans | `0.75rem` (12px) | Medium (500) | `1.0` | `+0.20em` | Categorías superiores (MAYÚSCULAS) |
| **Body Large** | DM Sans | `1.125rem` (18px) | Regular (400) | `1.7` | `0` | Sinopsis destacadas, textos editoriales |
| **Body Standard** | DM Sans | `0.9375rem` (15px) | Regular (400) | `1.65` | `0` | Descripciones, reseñas, contenido de lectura |
| **UI Standard** | DM Sans | `0.875rem` (14px) | Medium (500) | `1.4` | `+0.05em` | Botones, inputs, tabs de navegación |
| **Metadata / Micro** | Geist Mono | `0.75rem` (12px) | Regular (400) | `1.2` | `+0.08em` | Años, duraciones, conteos, timestamps |

### 7.3 Reglas Tipográficas Anti-Plantilla
1. **Límite de Mayúsculas con Tracking:** Las mayúsculas con espaciado no deben superar `tracking-[0.20em]`. Se prohíben valores de `0.45em` a `0.55em`.
2. **Tamaño Mínimo Absoluto:** Ningún texto informativo en la interfaz debe ser menor a `12px` (`0.75rem`).
3. **Prohibición de Cursiva Artificial:** No aplicar `italic` de forma automática a palabras clave en titulares. La cursiva se usa exclusivamente para citas textuales reales o el nombre de una obra (*Yellowjackets*, *Heretic*).

---

## 08 — Spacing & Layout (Espaciado y Layout)

### 8.1 Contenedores y Anchos Máximos
- **Container Principal:** `max-w-7xl` (1280px) con padding horizontal `px-6 sm:px-10`.
- **Container de Lectura Editorial (About, Sinopsis, Contacto):** `max-w-[720px]` (centrado).
- **Container de Detalle (Films/TV Detail):** `max-w-6xl` (1152px) en rejilla asimétrica `[280px_1fr]`.
- **Container de Formularios Auth:** `max-w-[420px]` (centrado).
- **Container de Perfil / Dossier:** `max-w-4xl` (896px).

### 8.2 Ritmo Vertical
- **Separación entre Secciones Mayores:** `py-20` (80px) a `py-24` (96px). Se eliminan espacios exagerados de 140px+.
- **Separación entre Encabezado de Sección y Rejilla:** `mb-10` (40px).
- **Espaciado en Rejillas de Tarjetas:** `gap-6` (24px) en desktop; `gap-4` (16px) en rejillas densas de metadatos.

### 8.3 Radios de Curvatura (Border Radius)
Para evitar la inconsistencia actual entre elementos `rounded-3xl`, `rounded-md` y `rounded-full`:
- **Tarjetas y Contenedores:** `rounded-xl` (12px).
- **Pósters y Medios:** `rounded-lg` (8px).
- **Botones y Badges/Pills:** `rounded-full` (píldora) para acciones, `rounded-md` (6px) para etiquetas técnicas.
- **Inputs y Textareas:** `rounded-lg` (8px).

---

## 09 — Component System (Sistema de Componentes Compartidos)

Definición conceptual de los 17 componentes base del sistema:

1. **`Navbar`**:
   - *Responsabilidad:* Shell global superior fijo (64px). Logo sobrio a la izquierda; enlaces principales al centro (Filmography, Music, About) con estado activo indicado por línea inferior sutil; avatar de usuario, acceso a perfil y botón de login/logout a la derecha. Sin divisores verticales innecesarios.
2. **`Footer`**:
   - *Responsabilidad:* Cierre institucional del archivo. Columna izquierda con síntesis del proyecto y disclaimer; columna derecha con navegación secundaria y botón sobrio de Ko-fi; franja inferior con copyright, TMDB attribution y enlaces a políticas. Tipografía legible sin estridencias.
3. **`PageHeader`**:
   - *Responsabilidad:* Encabezado estándar para páginas públicas (Filmography, Music, About, etc.). Compuesto por Eyebrow de contexto, Título H1 en Playfair Display, descripción breve de hasta 2 líneas y métricas/filtros rápidos en Geist Mono.
4. **`SectionHeader`**:
   - *Responsabilidad:* Encabezado unificado de secciones internas. Incluye título H2, indicador contextual opcional y enlace de acción ("Ver todas →").
5. **`Button`**:
   - *Responsabilidad:* Acciones táctiles con 3 variantes:
     - *Primary:* Fondo ámbar (`--accent-amber`), texto oscuro (`--bg-base`), hover dorado con elevación suave.
     - *Secondary:* Borde sutil (`--border-strong`), texto marfil, hover con borde ámbar.
     - *Ghost:* Sin borde, texto secundario, hover marfil con fondo sutil.
6. **`MediaCard` (Evolución de FilmCard)**:
   - *Responsabilidad:* Tarjeta de película o serie de televisión. Ratio 2:3. Presenta póster en alta resolución, badge de medio (Film / TV), año de lanzamiento, calificación en estrellas (si existe) y título en tipografía clara debajo de la imagen. En hover, suave zoom óptico (scale 1.03) y borde iluminado sutil sin sombras de neón.
7. **`FeaturedMediaCard`**:
   - *Responsabilidad:* Tarjeta apaisada panorámica (ratio 16:9 o banner 50vh) para destacar el título más reciente o relevante en cabeceras de sección.
8. **`TrackList`**:
   - *Responsabilidad:* Lista de pistas musicales de un lanzamiento. Número de pista en Geist Mono, título de canción en DM Sans, botón sobrio "Play/Watch" y duración.
9. **`PhotoGallery` + `Lightbox`**:
   - *Responsabilidad:* Cuadrícula fotográfica de retratos editoriales con zoom óptico y visor modal accesible mediante teclado (flechas y Escape).
10. **`MediaDetailTabs`**:
    - *Responsabilidad:* Sistema de pestañas (Cast, Crew, Details, Genres) en páginas de detalle con tipografía limpia y presentación estructurada de roles.
11. **`WhereToWatch`**:
    - *Responsabilidad:* Módulo lateral de plataformas de streaming, renta y compra con logotipos oficiales y atribución a JustWatch.
12. **`ReviewForm` / `MusicReviewForm`**:
    - *Responsabilidad:* Formulario interactivo unificado para calificar (1 a 5 estrellas) y redactar notas de fan para películas y discos.
13. **`ReviewCard`**:
    - *Responsabilidad:* Tarjeta de reseña publicada por un usuario con avatar inicial, nombre de usuario, calificación en estrellas doradas, fecha formateada y contenido de texto.
14. **`Badge`**:
    - *Responsabilidad:* Píldoras de estado y clasificación: Film (ámbar dim), TV (forest dim), Release type (EP, Single), Award (gold dim).
15. **`Input` / `Textarea`**:
    - *Responsabilidad:* Elementos de formulario con fondo oscuro mate, borde de 1px, tipografía nítida y foco con halo ámbar sutil.
16. **`EmptyState`**:
    - *Responsabilidad:* Bloque informativo para estados vacíos ("Sin reseñas aún", "Sin favoritos guardados") con mensaje claro y llamada a la acción.
17. **`ProfileShell` (Dossier Frame)**:
    - *Responsabilidad:* Marco contenedor que envuelve los perfiles de usuario, garantizando la persistencia del shell de SoapyFans y delimitando el canvas creativo.

---

## 10 — Public Archive (Dirección por Página Pública)

### A. Home (`/`)
- **Objetivo:** Recibir al visitante con un impacto visual cinematográfico inmediato, presentar las obras clave de Sophie Thatcher y ofrecer caminos claros de navegación.
- **Reestructuración:**
  1. **Hero Refinado:** Reducir la sobrecarga tipográfica. Título principal enfocado ("The Sophie Thatcher Archive"), retrato de alta calidad con transición elegante, sin ticker sobrecargado.
  2. **Sección Principal de Obras (Cine y TV integrados):** En lugar de duplicar la misma cuadrícula para Cine y TV por separado, presentar una selección curada de 6 a 8 títulos representativos con pestañas de filtro rápido (All / Films / Television).
  3. **Editorial Highlight ("Beyond the Screen"):** Bloque editorial limpio que conecta con su biografía y música.
  4. **The Music Corner:** Tarjetas elegantes de lanzamientos musicales con enlaces de escucha.
  5. **Llamada a la Comunidad:** Franja sobria invitando a registrarse para escribir reseñas y crear un perfil.
  - *Se eliminan:* La tarjeta gigante de explicación estilo SaaS con emojis y el bloque de comillas gigantes de 14rem.

### B. Filmography (`/films`)
- **Objetivo:** Mantener su condición como la página más sólida del archivo, optimizando tipografía y espaciado.
- **Acciones:**
  - Conservar la estructura por secciones (Films, Television, Beyond the Screen).
  - Sustituir la tarjeta de película destacada sobredimensionada por un `FeaturedMediaCard` mejor proporcionado.
  - Estandarizar la rejilla de tarjetas en 4–5 columnas desktop con `MediaCard`.
  - Integrar el callout de *Yellowjackets* de forma más armónica como hito de carrera.

### C. Film & TV Detail (`/films/[id]`, `/tv/[id]`)
- **Objetivo:** Proporcionar una ficha técnica y cultural inmersiva de cada película o serie.
- **Acciones:**
  - Mantener la composición de 2 columnas (`[280px_1fr]`).
  - Pulir la tipografía de la sinopsis y los metadatos.
  - Estandarizar las pestañas de cast y crew para que se lean como créditos cinematográficos y no como nubes de tags.
  - Mantener `WhereToWatch` y el módulo de reseñas de fans en la columna principal.

### D. Music (`/music`)
- **Objetivo:** Presentar la faceta musical de Sophie con elegancia de libreto discográfico.
- **Acciones:**
  - Reemplazar los botones multicolores de Spotify y Bandcamp por un panel de reproducción y enlaces streaming unificados bajo la paleta del archivo.
  - Reducir el tamaño de los números de pista en `TrackList` para que acompañen y no dominen el título.
  - Estructurar las reseñas de música en un acordeón o sección colapsable proporcionada a la relevancia de cada single o EP.

### E. About (`/about`)
- **Objetivo:** Ofrecer una experiencia de lectura editorial sobre la trayectoria y vida de Sophie Thatcher.
- **Acciones:**
  - Eliminar el filtro de color agresivo sobre el retrato del masthead; presentar la fotografía limpia con fundido sutil.
  - Mantener la galería fotográfica con lightbox.
  - Transformar el timeline de carrera y la tabla de reconocimientos en un flujo biográfico continuo con maquetación de revista cultural.

---

## 11 — Auth System (Relación Visual de Autenticación)

- **Login (`/login`):** Mantener su enfoque minimalista y centrado. Utilizar el nuevo sistema de botones, inputs y tipografía para que se sienta parte natural del archivo sin añadir adornos innecesarios.
- **Register (`/register`):** Conservar la composición split-screen en desktop (lado izquierdo con cita editorial e imagen ambiental; lado derecho con formulario limpio y opciones OAuth de Discord y Google).
- **Consistencia:** Todos los estados de error, advertencia de ban y mensajes flash adoptan el mismo contenedor de alerta con borde de color semántico y fondo mate (`bg-red-950/30`, `border-red-800/40`).

---

## 12 — Profile System (Arquitectura Shell vs. Canvas)

### 12.1 El Principio Rector
> **"SoapyFans controla el Shell. El usuario controla el Canvas."**

```
┌────────────────────────────────────────────────────────────────────────┐
│ SOAPYFANS SHELL (Inmutable - Controlado por el Sistema)                │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Navbar institucional (Logo, Navegación global, Menú de usuario)    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ USER CANVAS CONTAINER ("El Dossier")                           │   │
│   │ ┌────────────────────────────────────────────────────────────┐ │   │
│   │ │ 1. Banner panorámico (Personalizable por usuario)          │ │   │
│   │ ├────────────────────────────────────────────────────────────┤ │   │
│   │ │ 2. Avatar con anillo de acento aislado (No rompible)       │ │   │
│   │ │ 3. Identidad: Display Name, @handle, Pronombres, Bio, Web  │ │   │
│   │ ├────────────────────────────────────────────────────────────┤ │   │
│   │ │ 4. Sophie Picks (Top 6 favoritos con pósters interactivos) │ │   │
│   │ ├────────────────────────────────────────────────────────────┤ │   │
│   │ │ 5. Feed de Actividad (Reseñas públicas del usuario)        │ │   │
│   │ │                                                            │ │   │
│   │ │ [Estilos personalizados vía profile_css aplicados aquí]    │ │   │
│   │ └────────────────────────────────────────────────────────────┘ │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Footer institucional (Copyright, Políticas, TMDB attribution)      │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Aislamiento Técnico de Capas
1. **Capa 0 (Shell):** Navbar, fondo global del viewport y footer quedan fuera del selector `#profile-canvas`. Ninguna regla de `profile_css` puede modificar la posición, visibilidad o color del Navbar ni del Footer.
2. **Capa 1 (Dossier Container):** Un contenedor delimitado (`#profile-canvas.profile-canvas`) que encapsula todas las variables personalizables.
3. **Capa 2 (Avatar y Metadatos Clave):** El avatar cuenta con aislamiento explícito (`isolate`, `box-shadow` neutro) para que nunca quede oculto ni roto por transformaciones de fondo.
4. **Sanitización de CSS (`sanitize-css.ts`):** Mantiene el bloqueo estricto de:
   - `@import`, `@font-face`
   - `position: fixed`, `position: sticky`, `position: absolute` fuera de contexto
   - `z-index` abusivo
   - `javascript:`, `expression()`, `url()` externas
   - Inyección de etiquetas HTML `<` o `>`

### 12.3 Potencial Comunitario del Atelier
La arquitectura permitirá a futuro (en fases posteriores):
- Compartir temas y paletas CSS entre usuarios.
- Presets estéticos inspirados en películas de Sophie (ej. "Theme Yellowjackets / Wilderness", "Theme Heretic / Candlelight", "Theme Companion / Android").
- Opción de "Inspeccionar CSS" o "Clonar estilo" en perfiles públicos con consentimiento del autor.

---

## 13 — Motion & Animation System

### 13.1 Reglas de Animación con GSAP
1. **Duración Máxima:** Las transiciones de entrada no deben superar los `350ms` (0.35s), frente a los 700–900ms actuales que ralentizan la percepción de carga.
2. **Easing Natural:** Uso de curvas suaves `power2.out` o `power3.out`.
3. **Stagger Breve:** Entre tarjetas o elementos secuenciales, el stagger debe ser de máximo `0.04s` (40ms).
4. **Desplazamiento Vertical (`y`):** Movimiento máximo de `16px` a `24px` (evitando saltos de 48px que provocan desalineación visual durante el scroll).

### 13.2 ScrollTrigger y Rendimiento
- Desactivar ScrollTriggers complejos en dispositivos móviles o en pantallas de bajo rendimiento.
- El efecto Parallax debe reservarse únicamente para fondos fotográficos de cabecera con aceleración por GPU (`will-change: transform`, `transform: translateZ(0)`).

### 13.3 Accesibilidad de Movimiento
- Respeto estricto a `@media (prefers-reduced-motion: reduce)`: Si el usuario tiene la preferencia activada, todas las animaciones se anulan instantáneamente (`duration: 0`, `opacity: 1`, `y: 0`).

---

## 14 — Accessibility & Usability (Accesibilidad y Usabilidad)

1. **Ratios de Contraste:**
   - Todo texto sobre fondo oscuro debe tener un ratio mínimo de **4.5:1** (WCAG AA).
   - Textos destacados y titulares deben superar **7:1** (WCAG AAA).
2. **Estados de Foco Visibles (`:focus-visible`):**
   - Todo elemento interactivo (botones, enlaces, inputs, tarjetas clicables, switches) debe mostrar un anillo de foco visible de 2px en color ámbar (`ring-2 ring-[var(--accent-amber)] ring-offset-2 ring-offset-[var(--bg-base)]`) cuando se navegue mediante teclado.
3. **Áreas de Toque / Clic Mínimas:**
   - Botones y controles deben tener un tamaño de objetivo táctil mínimo de **44 × 44px**.
4. **Navegación por Teclado:**
   - La galería fotográfica debe poder recorrerse completamente con `Tab`, `ArrowLeft`, `ArrowRight` y cerrarse con `Escape`.
   - Los formularios deben permitir envío con `Enter` y tabulación lógica secuencial.
5. **Lectores de Pantalla y ARIA:**
   - Las calificaciones con estrellas deben incluir `aria-label="Calificación: X de 5 estrellas"`.
   - Los diálogos modales (YouTube, Lightbox, Selector de Favoritos) deben implementar `role="dialog"`, `aria-modal="true"` y atrapar el foco.

---

## 15 — Page-by-Page Direction (Dirección Página por Página)

| Página | Conservar | Modificar | Eliminar | Introducir | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Home (`/`)** | Tono cinematográfico, carga dinámica de créditos TMDB | Simplificar el Hero; unificar Cine y TV en una sección con filtros | Bloque SaaS de "Application Purpose"; Cita gigante de 14rem | Selector de vista Cine/TV; Franja de música más compacta | **P1 (Alta)** |
| **Films (`/films`)** | Categorización (Cine / TV / Beyond), integración con Wikidata | Reemplazar tarjeta destacada gigante por banner equilibrado; unificar rejilla de tarjetas | Líneas de brillo animadas en hover; tracking excesivo | Filtros por año/género; contador de metadatos más limpio | **P2 (Media)** |
| **Film Detail (`/films/[id]`)** | Layout de 2 columnas, módulo WhereToWatch, sistema de reseñas | Mejorar tipografía de sinopsis; estructurar pestañas de Cast/Crew como créditos formales | Text-shadows en hover; sombras de neón | Badge de estado de producción claro; visualización de reseñas más limpia | **P2 (Media)** |
| **TV Detail (`/tv/[id]`)** | Layout de 2 columnas, datos de temporadas/episodios | Armonizar aviso de "Reseñas de TV próximamente" | Elementos decorativos duplicados | Estructura preparada para habilitar reseñas de TV a futuro | **P3 (Media)** |
| **Music (`/music`)** | Modelo de datos de releases, lista de pistas, modal de YouTube | Unificar botones de streaming en la paleta del sitio; equilibrar números de pista | Botones verdes/azules chillones de Spotify/Bandcamp | Selector visual entre EP, Singles y Soundtracks | **P2 (Media)** |
| **About (`/about`)** | Contenido biográfico, galería con lightbox, timeline de carrera | Maquetar como artículo editorial fluido; limpiar imagen del masthead | Superposiciones de color estridentes sobre fotos | Bloques de lectura de ancho controlado (`max-w-[720px]`) | **P2 (Media)** |
| **Login (`/login`)** | Formulario minimalista, botones OAuth de Discord y Google | Aplicar nuevos tokens de input y botón unificado | Divisores innecesarios | Estados de foco accesibles estandarizados | **P3 (Media)** |
| **Register (`/register`)** | Composición split-screen con cita editorial | Ajustar gradiente del panel izquierdo a los nuevos tokens | Sombras pesadas en botón principal | Validación visual clara de campos | **P3 (Media)** |
| **Profile (`/profile/[u]`)** | Sophie Picks, avatar con anillo de acento, inyección de CSS | Delimitar claramente el Canvas del Shell mediante Dossier Frame | Fugas de estilos hacia la navegación global | Marco estético con selector de perfiles destacados | **P1 (Alta)** |
| **Profile Edit (`/profile/edit`)** | Organización en 5 bloques, drag-and-drop de favoritos, preview CSS | Mejorar espaciado y jerarquía en controles de apariencia | Cajas y bordes redundantes | Presets estéticos sugeridos | **P2 (Media)** |
| **Navbar** | Logo de marca y enlaces principales | Altura más compacta (64px); eliminar divisores verticales | Líneas de hover animadas repetitivas | Indicador de página activa sobrio y elegante | **P1 (Alta)** |
| **Footer** | Disclaimer de TMDB, enlaces legales y soporte Ko-fi | Jerarquizar visualmente los 3 niveles de información | Mayúsculas micro en textos legales | Tipografía de metadatos accesible y legible | **P2 (Media)** |

---

## 16 — Implementation Order (Orden Recomendado de Implementación)

Una vez aprobada esta Fase 0, la ejecución del rediseño para **Desktop** deberá realizarse en el siguiente orden secuencial y controlado:

```
┌────────────────────────────────────────────────────────────────────────┐
│ ETAPA 1 — FUNDACIÓN TÉCNICA Y COMPONENTES ATÓMICOS                    │
│ 1.1 Actualización de variables y tokens en app/globals.css             │
│ 1.2 Creación del paquete de componentes base UI (Button, Badge, Input, │
│     PageHeader, SectionHeader, EmptyState)                             │
│ 1.3 Rediseño del Shell Global: Navbar y Footer                         │
├────────────────────────────────────────────────────────────────────────┤
│ ETAPA 2 — COMPONENTES DE MEDIOS Y VISTAS DE ARCHIVO PRINCIPALES        │
│ 2.1 Refactor de MediaCard y PhotoGallery                               │
│ 2.2 Rediseño de Filmography (/films) y Detail (/films/[id], /tv/[id])  │
│ 2.3 Rediseño de Music (/music) y componentes asociados (TrackList)     │
│ 2.4 Rediseño de About (/about) como artículo editorial fluido          │
├────────────────────────────────────────────────────────────────────────┤
│ ETAPA 3 — REDISEÑO DE LA HOME Y AUTH                                   │
│ 3.1 Reconstrucción de la Home (/) aplicando el nuevo ritmo jerárquico   │
│ 3.2 Ajuste visual de Login y Register (/login, /register)              │
├────────────────────────────────────────────────────────────────────────┤
│ ETAPA 4 — ATELIER DE PERFILES Y CANVAS DEL USUARIO                     │
│ 4.1 Implementación del Dossier Frame (Aislamiento Shell vs. Canvas)    │
│ 4.2 Rediseño del Perfil Público (/profile/[username])                  │
│ 4.3 Refinamiento de la suite de edición (/profile/edit)                │
├────────────────────────────────────────────────────────────────────────┤
│ ETAPA 5 — CONTROL DE CALIDAD, ACCESIBILIDAD Y AUDITORÍA FINAL          │
│ 5.1 Verificación de contraste WCAG AA, focus-visible y navegación      │
│ 5.2 Optimización de rendimiento, bundle size y verificación de tests   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 17 — Open Questions (Preguntas Abiertas para Decisión Humana)

Estas decisiones estratégicas requieren validación del equipo/propietario antes de iniciar la implementación del código:

1. **Estructura de la Home: ¿Filtro unificado o secciones separadas?**
   - *Opción A (Recomendada):* Una única sección principal "Featured Work" con selector de pestañas (All / Films / TV) que reduce drásticamente la altura de la página y evita la duplicación de cuadrículas.
   - *Opción B:* Mantener dos secciones separadas (Films y TV), pero con maquetaciones visuales asimétricas para diferenciarlas.
2. **Reseñas de Televisión:**
   - Actualmente, la base de datos permite reseñas en películas y música, pero las páginas de TV muestran el aviso *"TV reviews are coming soon"*. ¿Deseas mantener este aviso en el rediseño visual o prefieres unificar el backend para habilitar reseñas en series de televisión durante la fase correspondiente?
3. **Manejo de Enlaces Musicales Externos:**
   - *Opción A (Recomendada):* Botones sobrios que adoptan la paleta del archivo con icono sutil de la plataforma (Spotify, Bandcamp, YouTube).
   - *Opción B:* Mantener las identidades de color oficiales de cada plataforma (verde Spotify, azul Bandcamp).
4. **Presets Estéticos en Perfiles:**
   - ¿Te gustaría que el Atelier de Perfil ofrezca a futuro una lista de "Temas predefinidos oficiales" (ej. Wilderness Amber, Candlelight Gold, Noir Archive) para usuarios que no desean escribir CSS manualmente?

---

*Fin del documento de auditoría y fundación visual.*
