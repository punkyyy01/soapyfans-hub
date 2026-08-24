# Changelog

Todos los cambios notables de este proyecto se documentan acá.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

## [Unreleased]

### Added
- Feed de noticias en `/news`: ingesta automática de RSS de medios de entretenimiento, filtrada por keyword y clasificada por relevancia con un LLM (Groq) antes de publicarse — título, mini descripción, imagen y link directo a la fuente
- 28 fuentes directas de noticias verificadas en vivo (Variety, THR, Deadline, IndieWire, Collider, /Film, TheWrap, ScreenRant, The Playlist, MovieWeb, ComingSoon, TVLine, TV Insider, Billboard, NME, Rolling Stone, Consequence, Stereogum, Vogue, W Magazine, Harper's Bazaar, i-D, Esquire, GQ, Elle, Cosmopolitan, ET, Us Weekly) con Google News como fallback.
- Paginación incremental en `/news`: 12 noticias iniciales con botón `Load more`, carga en lotes desde Supabase y feedback de "No more stories".
- Barra de búsqueda en `/news`: búsqueda en servidor por título, descripción y medio (`/news?q=...`), combinada dinámicamente con los filtros de etiquetas.
- Extracción de imágenes multicapa con soporte para Media RSS, OpenGraph, Twitter Cards, JSON-LD (`schema.org/NewsArticle`), figuras HTML y decodificación de entidades HTML.
- Watchlist ("quiero ver") en perfiles y en las páginas de película/serie
- Cooldown de 14 días entre cambios de username, enforced tanto en la app (chequeo rápido) como en un trigger de BD (`profiles_username_change_cooldown`), que es la garantía real.
- 9 migraciones recuperadas que documentan el esquema base (`profiles`, `films`, `reviews`, tablas de música, `banned_users`, `profile_favorites`), aplicadas en producción pero ausentes del historial de migraciones del repo hasta ahora.

### Fixed
- `saveProfile` ahora distingue el error de unicidad de username (`23505`) y el de cooldown en la respuesta del `UPDATE`, en vez de devolver siempre el mensaje genérico de fallo cuando la validación previa (no atómica) pierde una carrera.
- Deduplicación integral en `/news`: resolución de URLs canónicas de Google News, normalización completa de títulos, comparación de similitud sin límite de 30 días (`normalized_title`, `canonical_url`), unicidad en base de datos y defensa en profundidad en la visualización.
- Extracción y visualización de imágenes en `/news`: decodificación de URLs de redirección de Google News al artículo real, scraping robusto de `og:image`/`twitter:image`/JSON-LD, decodificación de entidades HTML en URLs, proxy seguro con headers contra hotlink protection y backfill progresivo por lotes.
- Control de concurrencia en el cron de GitHub Actions (`news-ingest-cron.yml`).

## [0.1.0] — 2026

### Added
- Filmografía con páginas de detalle para películas y series (datos vía TMDB)
- Sistema de reseñas de usuarios por entrada
- Perfiles de usuario con avatar, bio e historial de actividad
- Sección de música con discografía manual
- Reseñas de música por usuario
- Autenticación con Supabase (registro, login, callback)
- Dashboard de administración con gestión de contenido
- Páginas de términos de uso y privacidad
- Sitemap y robots.txt dinámicos
- Open Graph y meta tags para compartir en redes
- Vercel Analytics
- CSP via middleware + headers de seguridad en next.config.ts
- Diseño responsive con Tailwind 4 y animaciones con GSAP y Anime.js
