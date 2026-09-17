# programmer-day

Landing del Día del Programador: el día 256 del año (2^8, un byte completo). El 13 de septiembre —o el 12 en años bisiestos— la web conmuta a un modo de celebración; el resto del año muestra una cuenta atrás en vivo hacia esa fecha.

## Implementación

### Stack

- React 19, TypeScript estricto y Vite 7 como bundler
- Yarn 4 como gestor de dependencias (`nodeLinker: node-modules`)
- GSAP para la animación (ScrollTrigger, timelines, dígitos)
- Three.js con React Three Fiber y Drei para la escena 3D
- Vitest para tests unitarios y ESLint 9 (config flat) para lint
- CI con GitHub Actions: `install -> lint -> test -> build` en cada push y PR

### Lógica del día 256

`src/lib/day256.ts` es un módulo puro sin dependencias del DOM y la única fuente de verdad del estado temporal:

- `isLeapYear` (regla gregoriana completa: 4/100/400), `daysInYear` y `dayOfYear` (cálculo por UTC sobre mediodía local para evitar bordes de horario de verano)
- `isDay256`: true durante toda la ventana del día 256 en hora local
- `nextDay256Start` y `getDayState`: derivan el objetivo de la cuenta atrás y el modo actual
- `readDateOverride`: overrides de desarrollo por query param

El hook `useDayState` recalcula ese estado cada segundo, de modo que el cambio de modo ocurre solo en la medianoche real sin recargar.

### Modo contador (364 días al año)

- Hero Stat-Led: lectura `256 · año N · día/total` y cuenta atrás gigante `días : horas : min : seg` con dígitos que se animan individualmente al cambiar (GSAP, ventana de slot-machine recortada por CSS)
- Parallax de fondo de tres capas (glow, constelación SVG, niebla de código) movidas con ScrollTrigger, solo `transform`/`opacity`
- Sección "por qué 256" con reveals por IntersectionObserver y una tabla de valores reales de un byte
- Byte interactivo: ocho celdas que se encienden al pasar el cursor (o al enfocarlas: son botones reales) y recomponen el valor `0b........ = N` en vivo
- Nav en píldora flotante con etiqueta de estado ("EN VIVO" / "DÍA 256") y toggle de idioma

### Modo celebración (día 256)

- Overlay a pantalla completa con coreografía GSAP: ensamblado de los ocho bits, cruce par/impar, pulso y reveal del titular. Un temporizador de seguridad y una clase CSS (`cele-done`) garantizan el estado final aunque la línea de tiempo se interrumpa
- Byte 2D en DOM (funciona sin WebGL) y escena 3D con Three.js: ocho cubos emisivos en fila, núcleo de glow aditivo, campo de partículas binarias con Drei y parallax de cámara con el puntero. Un `CameraFitter` ajusta la distancia de cámara al aspecto del viewport para que la fila siempre quepa completa, y la fila se coloca sobre el titular
- La escena 3D va en un chunk diferido (`React.lazy`) que solo se descarga el día 256; el render se pausa con la pestaña oculta y si el contexto WebGL se pierde o no existe, la web degrada al byte 2D
- Fanfarria chiptune sintetizada al vuelo con WebAudio (`src/lib/chiptune.ts`, sin ficheros de audio): arpegio de ensamblado, voces cruzadas y fanfarria final en square/triangle, con volumen master contenido y `resume()` protegido contra políticas de autoplay
- Botón de sonido persistente (localStorage con fallback en memoria) y botón para cerrar la celebración y leer la página

### Internacionalización

Toggle ES/EN propio sin dependencias (`src/i18n/`): diccionario tipado (el español es el tipo canónico), contexto React, persistencia en localStorage y atributo `lang` del documento actualizado. Preferencia inicial: query param, luego localStorage, luego idioma del navegador.

### Accesibilidad y movimiento

- `prefers-reduced-motion` respetado en toda la app: la cuenta atrás, los reveals, el parallax, la escena 3D y la fanfarria degradan a versiones estáticas
- Anillo de foco visible en todo elemento enfocable; bits y botones operables por teclado
- `overflow-x: clip` y tipografía con `overflow-wrap` para evitar desbordes en móvil; layouts probados a 320/375/414/768 px

### Overrides de desarrollo

La lógica del día acepta parámetros en la URL, útiles para previsualizar ambos modos:

- `/?day=256`: celebra el día 256 del año en curso
- `/?day=256&year=2024`: día 256 de un año bisiesto (12 de septiembre)
- `/?date=2026-09-13T18:30`: instante concreto
- `/?lang=en`: fuerza el idioma

### Estructura

```
src/
  components/   Nav, Hero, Why256, ByteDemo, Celebration, ByteScene, SoundToggle, Reveal, ParallaxBackground
  hooks/        useDayState (reloj de 1s), usePrefersReducedMotion
  i18n/         translations (diccionario ES/EN tipado), LanguageContext
  lib/          day256 (lógica temporal), chiptune (WebAudio), gsap (registro central)
  styles/       tokens.css (design tokens OKLCH) + una hoja por sección
```

## Scripts

```
yarn install     instalar dependencias
yarn dev         servidor de desarrollo
yarn build       type-check + build de producción
yarn test        tests unitarios
yarn lint        eslint
yarn preview     servir el build de producción
```

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
