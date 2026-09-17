# programmer-day 🖥️

Web del **Día del Programador** — el día **256** del año (2⁸ = un byte).

- Los **364 días restantes** muestra una **cuenta atrás en vivo** hacia el próximo día 256, con parallax de fondo, reveals por scroll y un byte interactivo.
- **El día 256** (13 de septiembre, o 12 en años bisiestos) la página estalla: un **byte 3D gigante** con partículas binarias, coreografía de animación con **GSAP** y confeti de dígitos.

## Stack

- **React 19 + Vite 7 + TypeScript** (gestor: **yarn 4**)
- **GSAP** (ScrollTrigger, timelines, dígitos animados) y **Three.js** vía `@react-three/fiber` (escena 3D, carga diferida solo el día 256)
- **i18n ES/EN** propio (sin librerías), persistido en `localStorage`
- Tests con **Vitest** · CI con **GitHub Actions**

## Scripts

```bash
yarn install     # instalar dependencias
yarn dev         # servidor de desarrollo
yarn build       # type-check + build de producción
yarn test        # tests unitarios (lógica del día 256)
yarn lint        # eslint
yarn preview     # servir el build de producción
```

## Previsualizar la celebración (día 256)

La lógica del día acepta overrides por query param, pensados para desarrollo y demos:

| URL | Estado |
| --- | --- |
| `/` | estado real de hoy (contador o celebración) |
| `/?day=256` | celebra el día 256 del año en curso |
| `/?day=256&year=2024` | día 256 de un bisiesto (12 de septiembre) |
| `/?date=2026-09-13T18:30` | instante concreto |
| `/?lang=en` | fuerza el idioma inglés |

## Licencia

MIT — consulta [LICENSE](LICENSE).
