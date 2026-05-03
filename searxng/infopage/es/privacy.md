# Política de privacidad

LOOGI es un metabuscador. No registramos consultas, direcciones IP ni
clics en los resultados.

## Operador

Esta instancia es operada como proyecto personal por Umut Erdem (Suiza).
Contacto: <umut.erdem@protonmail.com>

## Lo que no hacemos

- Sin registro de consultas de búsqueda
- Sin registro de direcciones IP con fines analíticos
- Sin cookies, salvo las preferencias que tú mismo configures (idioma
  de la interfaz, tema, motores de búsqueda, ...)
- Sin rastreadores de terceros, sin analítica, sin publicidad
- Sin perfilado, sin huella digital del navegador

## Lo que hacemos

- **Reenviar tu consulta** a motores de búsqueda externos (Google,
  Brave, DuckDuckGo, Wikipedia, arXiv, ...). Cada motor tiene su propia
  política de privacidad y puede registrar la consulta. Eliminamos las
  cabeceras identificadoras antes del reenvío.
- Ejecutar un **limitador de velocidad en memoria** (Valkey) que
  almacena brevemente hashes de IPs de cliente para bloquear tráfico
  automatizado. Las entradas caducan automáticamente tras un breve
  intervalo.
- Servir **recursos estáticos** (CSS, JavaScript, iconos) que tu
  navegador almacena en caché mediante cabeceras HTTP estándar.

## Fuentes web

LOOGI carga "Inter Tight" y "JetBrains Mono" desde
[fonts.bunny.net](https://fonts.bunny.net/about), un proveedor de
fuentes respetuoso con la privacidad que no registra peticiones ni
establece cookies.

## Registros del servidor

El servidor web mantiene registros de diagnóstico de corta duración
(códigos HTTP, tiempos de respuesta, errores) sin almacenar
direcciones IP ni el contenido de las consultas. Los registros se
rotan automáticamente.

## Tus derechos

LOOGI no recopila datos personales, por lo que no hay perfil que
consultar, corregir o eliminar. Para cualquier duda, escribe al
operador.

## Cambios

Esta política puede actualizarse. La versión vigente está siempre
disponible en `/info/<tu-idioma>/privacy`.

Última actualización: 2026-05-03
