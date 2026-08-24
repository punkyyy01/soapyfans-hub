# Changelog

Todos los cambios notables de este proyecto se documentan acá.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

## [Unreleased]

### Added
- Feed de noticias en `/news`: ingesta automática de RSS de medios de entretenimiento, filtrada por keyword y clasificada por relevancia con un LLM (Groq) antes de publicarse — título, mini descripción, imagen y link directo a la fuente
- Watchlist ("quiero ver") en perfiles y en las páginas de película/serie
- Cooldown de 14 días entre cambios de username, enforced tanto en la app (chequeo rápido) como en un trigger de BD (`profiles_username_change_cooldown`), que es la garantía real.
- 9 migraciones recuperadas que documentan el esquema base (`profiles`, `films`, `reviews`, tablas de música, `banned_users`, `profile_favorites`), aplicadas en producción pero ausentes del historial de migraciones del repo hasta ahora.
- 5 fuentes de noticias nuevas en `/news`: Collider, /Film, TheWrap, Vogue y W Magazine.

### Fixed
- `saveProfile` ahora distingue el error de unicidad de username (`23505`) y el de cooldown en la respuesta del `UPDATE`, en vez de devolver siempre el mensaje genérico de fallo cuando la validación previa (no atómica) pierde una carrera.
- El ingest de `/news` ya no publica la misma noticia varias veces cuando el feed de búsqueda de Google News la reporta con links distintos por outlet: dedup por similitud de título (además del dedup existente por `source_url`), corrido antes de clasificar con Groq para no gastar presupuesto de rate-limit en duplicados.

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
