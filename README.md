# Idoneidad CNV

App de estudio para el Examen de Idoneidad en el Mercado de Capitales (CNV Argentina).
Banco de **323 preguntas** de opción múltiple, práctica por módulo, tres simulacros
cronometrados de 60 preguntas y seguimiento de un plan de 4 semanas.

Es **un solo HTML estático**: sin build en producción, sin dependencias, sin backend.
Se abre con doble clic o se sirve desde cualquier hosting de archivos estáticos.

## Qué hace

| Modo | Qué es |
|---|---|
| Práctica por módulo | 10 preguntas al azar del módulo elegido, con corrección y explicación en el momento |
| Simulacro 1, 2 y 3 | 60 preguntas (10 por módulo), 45:00 de cronómetro, sin corrección hasta entregar |
| Lista de errores | Cada pregunta fallada entra sola; sale cuando se responde bien en el repaso |

Los tres simulacros no comparten ninguna pregunta entre sí. Las opciones se barajan en
cada intento, así que la posición de la respuesta correcta nunca se repite.

El panel incluye los 28 días del plan con sus bloques, casillas de día cumplido, la tabla
de puntajes por módulo y las metas por módulo (M1 8, M2 9, M3 9, M4 6, M5 8, M6 9 · se
aprueba con 42/60).

## Estructura

```
index.html          generado por build.py — no editar a mano
build.py            arma index.html: src/tpl.html + src/banco/m1..m6.js
src/tpl.html        app (HTML + CSS + JS), con la marca /*__BANCO__*/
src/banco/mN.js     banco de preguntas del módulo N
test/test.js        test funcional sobre un DOM simulado (Node, sin dependencias)
```

Para modificar preguntas se edita `src/banco/mN.js` y se corre `python build.py`.
Formato de cada pregunta:

```js
{id:"M1-01", m:1, q:"enunciado", o:["opción A","B","C","D"], a:1,
 e:"por qué la correcta es la correcta", r:"M1 · P1"}
```

`a` es el índice (0-3) de la opción correcta en `o`. `r` es la referencia al número de
pregunta en la Guía de Estudio de la CNV, para poder ir al PDF original.

## Desarrollo

```bash
python build.py      # regenera index.html
node test/test.js    # 40 chequeos: navegación, puntajes, persistencia, barajado
```

El test no necesita npm install ni navegador: simula el DOM en Node.

## Integración con otra app

Datos que hacen falta para embeberlo o conectarlo:

- **Es estático puro.** Servirlo es copiar `index.html` a la carpeta pública del server.
  En un proyecto Vite, cualquier archivo en `public/` se copia tal cual a `dist/` y queda
  accesible por su nombre, sin pasar por el bundler.
- **No pisa rutas ni estado de la app que lo aloje.** No usa router, no lee la URL, no
  hace requests de red.
- **Persistencia:** `localStorage`, clave `cnv-idoneidad-v1`, con esta forma:

  ```jsonc
  {
    "days":   { "1": 1, "2": 1 },        // días del plan marcados como cumplidos
    "scores": { "1": { "mod": [8,9,9,6,8,9], "total": 49, "secs": 2310, "ts": 1770000000000 } },
    "errors": ["M1-07", "M4-22"],        // ids pendientes de repaso
    "examDate": "2026-09-15"
  }
  ```

  Si otra app corre en el **mismo origen**, puede leer esa clave para mostrar el progreso
  (puntaje del último simulacro, racha de días, errores pendientes) sin tocar esta app.
  Si se embebe por `iframe` desde **otro dominio**, el progreso se guarda por origen y no
  se comparte con la copia de GitHub Pages.
- **Fuentes:** carga Archivo, Source Serif 4 e IBM Plex Mono desde Google Fonts. Con una
  CSP estricta hay que permitir `fonts.googleapis.com` y `fonts.gstatic.com`; si no, cae
  al fallback del sistema y se sigue leyendo bien.
- **Tema:** respeta `prefers-color-scheme` y tiene botón propio de tema. Si la app que lo
  aloja fuerza tema con `data-theme="dark"` o `"light"` en `<html>`, lo respeta también.

## Fuente del contenido

Las preguntas se derivan de la Guía de Estudio publicada por la Comisión Nacional de
Valores, que aclara que las respuestas correctas del examen son únicamente las
desarrolladas en ese material. Las opciones incorrectas y las explicaciones son propias.
Material de estudio, sin relación oficial con la CNV.

Nota conocida: la guía trae un ejercicio (compra de acción a $40 más put a $45 con prima
$4, precio final $38) cuya respuesta oficial dice "$4 de pérdida" cuando la cuenta da +$1.
Esa pregunta quedó fuera del banco a propósito, para no fijar una cuenta contradictoria.
