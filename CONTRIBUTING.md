# Contribuir a soapyfans-hub

Gracias por el interés. Este es un proyecto personal activo — las contribuciones son bienvenidas pero el scope lo define la mantenedora. Antes de empezar algo grande, abrí un issue para coordinarlo.

## Requisitos

- Node.js 20+
- Una cuenta de [Supabase](https://supabase.com) (plan gratuito)
- Una API key de [TMDB](https://www.themoviedb.org/settings/api) (plan gratuito)

## Setup local

### 1. Fork y clonar

```bash
git clone https://github.com/<tu-usuario>/soapyfans-hub.git
cd soapyfans-hub
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Completá `.env.local` con tus valores (ver comentarios en el archivo).

### 3. Base de datos

Creá un proyecto nuevo en Supabase y configurá el esquema. El esquema completo está gestionado desde el dashboard de Supabase del proyecto original — para desarrollo podés pedirle a la mantenedora un dump del esquema abriendo un issue.

### 4. Correr en desarrollo

```bash
npm run dev
```

El sitio estará disponible en `http://localhost:3000`.

## Convenciones

- **Ramas:** `feat/nombre`, `fix/descripcion`, `chore/tarea`, `docs/descripcion`
- **Commits:** conventional commits en minúsculas — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- **TypeScript:** el CI corre `tsc --noEmit`. Tu PR no puede mergear si hay errores de tipos
- **Estilo:** seguí el estilo visual y de código existente. No cambies tokens de Tailwind ni la paleta de colores sin coordinarlo antes

## Proceso de PR

1. Creá una rama desde `main`
2. Un PR por feature o fix
3. El CI (type check) debe pasar
4. Completá el template del PR
5. Asigná a `@punkyyy01` como reviewer

## Scope

Este es un fan site para Sophie Thatcher. Los PRs que cambian la temática, el sujeto del sitio, o agregan funcionalidades no relacionadas serán cerrados.
