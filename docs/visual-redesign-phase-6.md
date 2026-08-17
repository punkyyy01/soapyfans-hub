# SoapyFans Hub — Fase 6: Rediseño del Profile System y Profile Editor Desktop

> **Documento maestro de entrega para la Fase 6 del rediseño visual de SoapyFans Hub.**  
> Rutas intervenidas: `/profile/[username]`, `/profile/edit`.  
> Componentes actualizados: `app/(main)/profile/[username]/page.tsx`, `app/(main)/profile/edit/page.tsx`, `components/profile/ProfileEditForm.tsx`, `components/profile/ActivityFeed.tsx`.

---

## 01 — Public Profile

El perfil público ([`/profile/[username]`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/profile/[username]/page.tsx)) ha sido rediseñado como un **espacio personal dentro del archivo**.

Permite que cada usuario refleje su identidad estética (minimalista, elegante, retro, maximalista o experimental) manteniendo siempre la estabilidad del sistema global.

```
┌────────────────────────────────────────────────────────┐
│                   GLOBAL SOAPYFANS SHELL               │
│  Navbar · Rutas globales · Seguridad · Autenticación   │
├────────────────────────────────────────────────────────┤
│                   USER PROFILE CANVAS                  │
│  [Banner & Degradado]                                  │
│  [Avatar 4 capas con Accent Ring]                      │
│  [Nombre, Pronombres, Bio, Metadatos]                  │
│  [Sophie Picks — Top 6 Favoritos]                      │
│  [Archive Activity — Reseñas y Notas]                  │
│  [Minimal Profile Closure — Retorno al Archivo]        │
└────────────────────────────────────────────────────────┘
```

---

## 02 — Profile Canvas

El canvas (`#profile-canvas`) funciona como el contenedor acotado y seguro donde se despliegan los estilos del usuario:

1. **Banner & Fondo:** Altura proporcional (`h-[180px] sm:h-[240px]`) con fundido sutil hacia el fondo del canvas. Si el usuario no sube un banner, se genera automáticamente un degradado ambiental a partir de su `accent_color`.
2. **Avatar en 4 Capas Aisladas:**
   - *Capa 1:* Anillo de color de acento (`background: accentColor`, `boxShadow: 0 0 0 4px var(--bg-surface)`).
   - *Capa 2:* Contenedor circular con fondo base (`bg-[var(--bg-base)]`).
   - *Capa 3:* Imagen de retrato en alta definición o inicial estilizada con gradiente.
   - *Capa 4:* Botón de acceso al atelier si el usuario es dueño del perfil.
3. **Sophie Picks (Favoritos):** Cuadrícula curatorial de hasta 6 títulos destacados de la filmografía de Sophie Thatcher con etiquetas de ranking (`#1`, `#2`, ...), microinteracción de escala y overlay con título.
4. **Minimal Profile Closure:** En lugar de replicar el footer editorial gigante de la Home, el perfil concluye con una barra ligera de retorno al archivo.

---

## 03 — Shell / Canvas Isolation

Se mantiene un aislamiento técnico estricto:

* **Inyección CSS Acotada:** El CSS personalizado del usuario se inyecta mediante:
  ```html
  <style>#profile-canvas { ${sanitizedCss} }</style>
  ```
* **Imposibilidad de escape:**
  - El selector `#profile-canvas` restringe el ámbito de aplicación exclusivamente al contenedor del perfil.
  - El Navbar global, Footer global, controles de sesión y otras páginas nunca se ven afectados por las reglas de estilo de un usuario.

---

## 04 — Profile Editor (Atelier UX)

El editor ([`/profile/edit`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(main)/profile/edit/page.tsx) y [`components/profile/ProfileEditForm.tsx`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/components/profile/ProfileEditForm.tsx)) fue transformado en un **atelier de curación**:

* **Navegación por Anclas:** Píldoras de salto rápido (`01 · Identity`, `02 · Appearance`, `03 · Sophie Picks`, `04 · Visibility`, `05 · Custom CSS`).
* **Secciones Estructuradas:**
  1. *01 · Identity:* Nombre público, handle (@username), pronombres, ubicación, biografía con contador (máx. 300 caracteres) y enlace web verificado.
  2. *02 · Appearance:* Selector y subida de Avatar, Banner y Selector de color de acento con previsualización en vivo y botón de reinicio.
  3. *03 · Sophie Picks:* Búsqueda en vivo de títulos de TMDB, drag-and-drop para reordenar, eliminación instantánea y ranuras libres.
  4. *04 · Visibility:* Interruptor accesible para mostrar u ocultar la actividad de reseñas en el perfil público.
  5. *05 · Custom CSS:* Editor con tipografía monospaciada, contador de caracteres (máx. 2,000) y modal de previsualización en vivo.

---

## 05 — Custom CSS

* **Sanitización estricta ([`utils/sanitize-css.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/utils/sanitize-css.ts)):**
  - Bloqueo de `@import`, `@font-face`, `javascript:`, `expression()`, `position: fixed`, `position: sticky`, `position: absolute`, `url()`, `-moz-binding`, `z-index`, y etiquetas HTML `<`/`>`.
  - Eliminación de llaves `{}` para prevenir inyecciones fuera del selector.
  - Límite estricto de 2,000 caracteres.

---

## 06 — Live Preview Modal

* Botón **Preview Canvas ↗** que abre un diálogo modal con backdrop oscuro renderizando exactamente el contenedor `#profile-canvas-preview` con el CSS en tiempo real antes de guardar.
* Notificación visual inmediata si el CSS ingresado contiene reglas no permitidas por el sanitizador.

---

## 07 — Save / Dirty State

* **Barra de acción persistente (Sticky Action Bar):**
  - Indicador de estado modificado: `Unsaved changes in atelier` con pulso ámbar en tiempo real (`useMemo`).
  - Botón de guardado con estado de carga (`Saving Atelier…`), bloqueo defensivo y feedback de toast (`success` / `error`).

---

## 08 — Privacy / Activity

* Cuando `show_activity === false`, la sección de actividad no se renderiza en el perfil público, garantizando privacidad absoluta sin advertencias extrañas para visitantes.

---

## 09 — Accessibility (a11y)

1. **Controles de formulario:** Inputs y textareas con etiquetas semánticas (`<label htmlFor="...">`), estados `:focus-visible` mediante `focus-ring` y mensajes de ayuda descriptivos.
2. **Selector de estrellas:** Botones de calificación con labels accesibles (`aria-label="Rate X out of 5 stars"`).
3. **Interruptor de visibilidad:** Implementado con `role="switch"` y `aria-checked`.
4. **Modal Dialogs:** Diálogos de búsqueda y previsualización con atributos `role="dialog"` y atajos de cierre.

---

## 10 — Performance & Bundle

* **Server Rendering:** Carga de datos de perfil, favoritos y créditos combinados desde el servidor con fallback en caso de error de red.
* **Imágenes Optimizadas:** Generación de tamaños responsivos y miniaturas (`w342`, `w185`) con `next/image`.
* **First Load JS:** Compilación limpia en 158 kB para perfil público y 164 kB para el editor.

---

## 11 — Stress Test Obligatorio (Prueba de Aislamiento)

Se evaluó la inyección de CSS extremo dentro de `#profile-canvas`:

```css
background: linear-gradient(
  45deg,
  #FF0000,
  #FF7F00,
  #FFFF00,
  #00FF00,
  #0000FF,
  #4B0082,
  #9400D3
);
color: #000000 !important;
border: 15px double #FF00FF !important;
box-shadow: 25px 25px 0px #FFD700 !important;
text-shadow: 3px 3px 0px #00FFFF !important;
transform: rotate(-1deg) scale(0.98);
```

* **Resultado:**
  - El canvas se transforma completamente reflejando el fondo, borde, sombra y rotación deseados.
  - El **Navbar global** permanece intacto, legible e interactivo.
  - Los **menús desplegables y botones de autenticación/logout** no se ven afectados.
  - El diseño exterior conserva la estructura base del Design System.

---

## 12 — Verification

* **Typecheck (`npm run typecheck`):** **0 errores de TypeScript**.
* **Unit Tests (`npm test`):** **56 tests pasando en 15 suites**.
* **Production Build (`npm run build`):** **18 rutas generadas y optimizadas exitosamente**.

---

## 13 — Future Community Opportunities

La arquitectura de Phase 6 prepara el terreno para futuras expansiones comunitarias:
1. **Profile Presets / Themes:** Colección de plantillas predefinidas (*Archive, Wilderness, Noir, Analog, Heretic*) como puntos de partida visuales.
2. **Profile Showcase & Sharing:** Tarjetas sociales para compartir el perfil y el archivo curado de favoritos en plataformas externas.
