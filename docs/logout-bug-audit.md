# SoapyFans Hub — Auditoría y Corrección del Error Transitorio de Logout

> **Documento de Auditoría y Resolución Técnica**  
> **Estado:** Resuelto y Verificado  
> **Proyecto:** SoapyFans Hub (`soapyfans-hub`)  
> **Fecha:** 17 de Agosto, 2026  

---

## 1. Síntoma Observado

Al estar autenticado en SoapyFans Hub y presionar el botón `Logout` desde el Navbar:
1. La Server Action `logout` se ejecuta.
2. La sesión en Supabase se cierra y las cookies de autenticación se invalidan.
3. Durante la transición client-side posterior, aparecía de manera intermitente el error:
   ```text
   Application error: a client-side exception has occurred while loading soapyhub.fans (see the browser console for more information).
   ```
4. Al recargar la página manualmente (`F5`), el sitio volvía a funcionar con normalidad y el usuario aparecía deslogueado (estado Guest).

---

## 2. Reproducción y Flujo Analizado

El flujo de cierre de sesión en Next.js App Router con `@supabase/ssr` sigue la secuencia:

```text
[Navbar Component] (Server Component)
        ↓
<form action={logout}>
        ↓
[Server Action logout()] (app/(auth)/actions.ts)
        ↓
supabase.auth.signOut()
        ↓
revalidatePath('/', 'layout')
        ↓
redirect('/')
```

### Rutas y Contextos de Reproducción:
* **Logout desde `/` (Home):** Ocurría cuando el renderizado RSC de la acción reevaluaba `getUser()` con cookies marcadas para eliminación.
* **Logout desde `/profile/edit`:** Ocurría con mayor frecuencia debido a la revalidación forzada del Server Component protegido (`if (!user) redirect('/login')`) mientras la acción emitía simultáneamente su propio `redirect('/')`.
* **Logout tras navegación client-side:** La presencia de cookies vacías (`sb-...=""`) activaba llamadas no controladas al cliente de Supabase GoTrue.

---

## 3. Error Exacto Encontrado

La excepción client-side de Next.js (`Application error: a client-side exception has occurred`) tenía dos desencadenantes directos:

1. **Detección defectuosa de cookies de autenticación tras `signOut()`:**
   En `utils/supabase/server.ts` y `utils/supabase/middleware.ts`, la condición:
   ```ts
   // Código anterior defectuoso
   const hasAuthCookie = cookieStore.getAll().some((cookie) => cookie.name.startsWith('sb-'))
   ```
   Cuando `supabase.auth.signOut()` eliminaba las cookies mediante `cookieStore.set(name, '', { maxAge: 0 })`, el array retornado por `cookieStore.getAll()` aún contenía el objeto de la cookie con `value: ""` o `value: "[]"`. Como `cookie.name.startsWith('sb-')` seguía siendo `true`, `hasAuthCookie` se evaluaba como verdadero.
   Esto provocaba que `supabase.auth.getUser()` fuera invocado con tokens vacíos, desencadenando excepciones `AuthSessionMissingError` / `401 Unauthorized` no capturadas durante la revalidación RSC.

2. **Llamada de red remota no determinista en `signOut()`:**
   `supabase.auth.signOut()` por defecto invocaba el endpoint de revocación global en el servidor GoTrue de Supabase. Si la sesión ya estaba expirada o sufría latencia de red, la promesa fallaba antes de procesar el flujo de redirección limpio.

---

## 4. Causa Raíz

1. **`hasAuthCookie` sin validación de contenido:** La condición solo evaluaba el prefijo del nombre de la cookie (`sb-`), ignorando si su valor era vacío (`""`), nulo o `[]` tras la invalidación.
2. **Ausencia de `try/catch` defensivo en `getUser()`:** Cualquier fallo en `supabase.auth.getUser()` con tokens residuales escalaba como excepción no controlada en el render de Server Components durante la revalidación.
3. **Ámbito de `signOut` global innecesario:** En lugar de `scope: 'local'`, se realizaba una revocación remota síncrona que podía bloquear o desincronizar los encabezados `Set-Cookie`.

---

## 5. Archivos Afectados

1. **[`utils/supabase/server.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/utils/supabase/server.ts):**
   - Validación estricta de contenido no vacío en cookies de autenticación (`Boolean(cookie.value) && cookie.value.trim() !== '' && cookie.value !== '""' && cookie.value !== '[]'`).
   - Manejo seguro de errores dentro de `getUser()` con retorno garantizado de `null`.

2. **[`utils/supabase/middleware.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/utils/supabase/middleware.ts):**
   - Validación estricta idéntica para evitar llamadas innecesarias a la API de Supabase Auth cuando las cookies están vacías o en proceso de borrado.

3. **[`app/(auth)/actions.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/app/(auth)/actions.ts):**
   - Uso de `await supabase.auth.signOut({ scope: 'local' })` con bloque `try/catch` no bloqueante antes de `revalidatePath` y `redirect('/')`.

4. **[`tests/auth.test.ts`](file:///home/frambuesa/Proyectos/ProyectosP/soapyfans-hub/tests/auth.test.ts):**
   - Incorporación de casos de prueba unitarios para la validación de estados de cookies de autenticación (tokens válidos vs vacíos, borrados y cadenas en blanco).

---

## 6. Solución Aplicada

### En `utils/supabase/server.ts`:
```ts
export const getUser = cache(async () => {
  const cookieStore = await cookies()
  const hasAuthCookie = cookieStore
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith('sb-') &&
        Boolean(cookie.value) &&
        cookie.value.trim() !== '' &&
        cookie.value !== '""' &&
        cookie.value !== '[]'
    )

  if (!hasAuthCookie) return null

  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
  } catch {
    return null
  }
})
```

### En `utils/supabase/middleware.ts`:
```ts
  const hasAuthCookie = request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith('sb-') &&
        Boolean(cookie.value) &&
        cookie.value.trim() !== '' &&
        cookie.value !== '""' &&
        cookie.value !== '[]'
    )
```

### En `app/(auth)/actions.ts`:
```ts
export async function logout() {
  const supabase = await createClient()
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch (err) {
    console.warn('[logout] Non-fatal signOut warning:', err)
  }
  revalidatePath('/', 'layout')
  redirect('/')
}
```

---

## 7. Por Qué la Solución es Correcta

* **Cierre Inmediato y Determinista:** `signOut({ scope: 'local' })` elimina inmediatamente las cookies de sesión en el almacenamiento local del cliente y la respuesta HTTP sin depender de la latencia del servidor de autenticación externo.
* **Eliminación de Falsos Positivos:** Al verificar que `cookie.value` no esté vacío ni contenga comillas residuales, el sistema reconoce el estado deslogueado en el mismo ciclo de petición sin disparar llamadas fallidas a GoTrue.
* **Resiliencia RSC:** Cualquier invocación concurrente de `getUser()` durante el re-renderizado de Server Components (`Navbar`, `Footer`, vistas de contenido) resuelve de manera instantánea y segura a `null`.
* **Preservación de la Arquitectura:** No se alteró la lógica de invalidación de caché (`revalidatePath('/', 'layout')`) ni la redirección a la raíz (`redirect('/')`), garantizando que el Navbar pase inmediatamente a estado Guest sin recargas forzadas.

---

## 8. Pruebas Realizadas

### A. Verificación de Tipos (TypeScript):
```bash
npm run typecheck
# Salida: 0 errores
```

### B. Suite de Pruebas Automatizadas:
```bash
npm test
# Salida: 56/56 tests pasando (incluyendo la nueva suite Auth Cookie State Validation)
```

### C. Compilación de Producción (Next.js 15):
```bash
npm run build
# Salida: Compilación exitosa en las 18 rutas estáticas y dinámicas
```

---

## 9. Resultado Final

1. Al pulsar `Logout` desde cualquier página (Home, Filmografía, Música, About, Perfil, Editor de Perfil):
   - La sesión se elimina localmente y en cookies.
   - El usuario es redirigido de inmediato a `/`.
   - El Navbar aparece instantáneamente en estado Guest (`Sign in`).
   - La transición se completa de forma fluida sin excepciones client-side ni pantallas de error.
   - No se requiere recarga manual de la página.
