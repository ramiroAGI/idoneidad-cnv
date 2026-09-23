# Idoneidad CNV

App de estudio para el Examen de Idoneidad en el Mercado de Capitales (CNV Argentina).
Banco de **735 preguntas** (una por cada pregunta de la guía oficial) de opción múltiple, práctica por módulo, tres simulacros
cronometrados de 60 preguntas y seguimiento de un plan de 4 semanas.

Es **un solo HTML estático**: sin build en producción, sin dependencias, sin backend.
Se abre con doble clic o se sirve desde cualquier hosting de archivos estáticos.

## Qué hace

| Modo | Qué es |
|---|---|
| Módulo · 10 preguntas | Rotación: siempre prioriza las que todavía no viste, así un módulo de 110 se cubre en 11 rondas sin repetir ninguna. Corrección y explicación en el momento |
| Módulo · completo | El módulo entero de corrido, para los días de "cuestionario completo" del plan |
| Simulacro 1, 2 y 3 | 60 preguntas (10 por módulo, repartidas a lo largo de todo el banco), 45:00 de cronómetro, sin corrección hasta entregar |
| Lista de errores | Cada pregunta fallada entra sola y necesita **dos** aciertos para salir; si se vuelve a fallar, arranca de cero |

Los tres simulacros no comparten ninguna pregunta entre sí. Las opciones se barajan en
cada intento, así que la posición de la respuesta correcta nunca se repite. Cada tarjeta de
módulo muestra cuántas preguntas viste sobre el total.

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
node test/test.js    # 73 chequeos: navegación, puntajes, persistencia, barajado, simulacros
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
    "err":    { "M1-07": 2, "M4-22": 1 },// pendientes: aciertos que faltan para salir (2 o 1)
    "seen":   { "M1-07": 3, "M1-08": 1 },// veces que la app tomó cada pregunta (alimenta la rotación)
    "examDate": "2026-09-15"
  }
  ```

  La app migra sola el formato viejo (`errors` como array de ids) a `err` con contador.

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

### Cobertura de la guía

El banco es **1 a 1 con la Guía de Estudio**: una pregunta por cada número de la guía, 735 en
total (M1 127 · M2 112 · M3 106 · M4 137 · M5 128 · M6 125), en el mismo orden, y cada una
cita en `r` la única pregunta oficial de la que sale (`M5 · P24`). Aunque la guía repita un
tema, cada forma de preguntarlo tiene su pregunta: el examen sale textual de la guía, y
fusionarlas dejaba sin practicar enunciados que pueden tomar.

Las preguntas en las que **la propia guía se contradice** se cargan **cada una con su respuesta
oficial**, porque el examen corrige con la guía enunciado por enunciado. La otra versión no se
usa como distractor, y la explicación avisa del choque con un "Ojo:":

| Guía | Dice | Choca con |
|---|---|---|
| M2 P19 | conservar documentación: 5 años | M2 P60: 10 años |
| M3 P4 y P23 | hecho relevante: 24 horas | M3 P56, P83, P101: inmediatamente |
| M3 P13 y M4 P28 | estados contables: 60 días corridos | M4 P64: 42 días (trimestrales) y 70 días (anuales) |
| M4 P84 | no se aplica una NIIF en forma anticipada | M4 P126: salvo que la norma lo admita expresamente |
| M4 P115 | acción $40 + put $45, prima $4, final $38: "$4 de pérdida" | la cuenta da +$1 |

También hay respuestas oficiales que encajan raro con su enunciado (M2 P48, P49, P71 bis): se
cargan tal cual, con la aclaración en la explicación.

Los simulacros toman sus 10 preguntas por módulo repartidas a lo largo de todo el banco, no
las primeras 10: así una pregunta agregada al final también entra. Si se agregan preguntas,
los simulacros cambian, así que un puntaje de antes deja de ser comparable con uno de después.
