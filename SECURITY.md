# Política de seguridad

## Versiones soportadas

Solo la rama `main` recibe parches de seguridad.

## Reportar una vulnerabilidad

**No abras un issue público** si encontraste una vulnerabilidad de seguridad.

Reportala directamente abriendo una [Security Advisory privada](https://github.com/punkyyy01/soapyfans-hub/security/advisories/new) en GitHub, o contactando a [@punkyyy01](https://github.com/punkyyy01).

Incluí en el reporte:

- Descripción del problema
- Pasos para reproducirlo
- Impacto potencial (qué datos o funciones se ven afectados)
- (Opcional) Sugerencia de fix

Tiempo de respuesta esperado: menos de 72 horas. Una vez corregida la vulnerabilidad, se publicará en el CHANGELOG.

---

## Secretos del proyecto

Las siguientes variables de entorno son sensibles. **Nunca las expongas en logs, código del lado cliente, commits ni issues públicos.**

| Variable | Por qué es sensible |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Acceso total a la base de datos sin restricciones de RLS. Con esta key se pueden leer, modificar o eliminar todos los datos de todos los usuarios |
| `TMDB_API_KEY` | Clave de API vinculada a la cuenta de TMDB. El abuso puede resultar en suspensión de la key |

Las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` son **públicas por diseño** — están expuestas al cliente y es seguro que así sea, siempre que las políticas de Row Level Security (RLS) estén correctamente configuradas en Supabase.

---

## Consideraciones específicas de este proyecto

### Autenticación

El sitio usa Supabase Auth para cuentas de usuario. Si encontrás un vector de escalada de privilegios (por ejemplo, acceder al dashboard de administración sin ser admin, o modificar el perfil de otro usuario), es una vulnerabilidad crítica — reportala de inmediato.

### Row Level Security

Toda la base de datos debe tener RLS habilitado. Si encontrás una tabla sin RLS o una política incorrecta que permita acceso no autorizado a datos de usuarios, reportalo como vulnerabilidad.

### Dashboard de administración

El panel de administración está en una ruta oscura. Si encontrás una forma de acceder a él sin autenticación de admin, es una vulnerabilidad crítica.

---

## Datos almacenados

El sitio almacena en Supabase:

- Correo electrónico y nombre de usuario de cuentas registradas
- Reseñas escritas por usuarios y calificaciones
- Preferencias de perfil (avatar, bio)
- Historial de actividad pública

No se almacenan datos bancarios, contraseñas en texto plano (Supabase Auth los hashea), ni información de pago.
