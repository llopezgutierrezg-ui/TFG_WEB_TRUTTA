# TRUTTA · Visual Storytelling

SPA interactiva (TFG) sobre los **ríos de la España Vaciada**. Estética brutalista-editorial
en blanco y negro, con un sistema de animación cuidado: fondo de agua interactivo, recorrido
cinemático por máquina de estados, *scroll-telling* y un efecto de "flotación" de los objetos
sobre la superficie del río.

---

## ✨ Características

- **Fondo de agua interactivo** (WebGL · PixiJS): displacement sutil que reacciona al ratón.
- **Flotación por proximidad**: los objetos cercanos al cursor se mecen en X/Y con inercia
  (sin estorbar los clics) + **botón de pánico** "Desactivar animaciones" (accesibilidad,
  respeta `prefers-reduced-motion`).
- **Landing (Desktop 17)**: hero con *mouse-trail* de imágenes y line-art, intro, y dos
  expositores de río (Lozoya / Alberche) maquetados a las coordenadas exactas de Figma.
- **Recorrido cinemático** (máquina de estados): vídeo → rótulo del río → manifiesto → 4
  apartados (`EL ORIGEN / EL UMBRAL / EL CAUCE / DESENLACE`) con caos→ordenación de fotos y
  línea-guía SVG dibujándose con el scroll.
- **Bitácoras**: carrusel con *grid* dinámico que muta según el número de imágenes (3–6).
- **Formulario "Comparte tu experiencia"**: subida de 3–6 imágenes (ObjectURLs) que se inyectan
  en directo en el carrusel de bitácoras.
- **Detalle de foto** disponible desde cualquier imagen del sitio.
- **i18n ES/EN** y navegación funcional.

## 🛠️ Stack

- **Vite** (build/dev) · **Vanilla JS** (módulos ES, sin framework)
- **GSAP** + **ScrollTrigger** (timelines, scrubbing, ticker compartido)
- **PixiJS v8** (`DisplacementFilter` para el ripple)
- **Metropolis** auto-hospedada (SIL OFL) como tipografía secundaria

## 🚀 Puesta en marcha

Requiere **Node.js 18+**.

```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo → http://localhost:5173
npm run build    # build de producción en /dist
npm run preview  # sirve la build de /dist
```

## 📜 Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite + HMR). |
| `npm run build` | Compila a `/dist`. |
| `npm run preview` | Sirve la build ya compilada. |
| `npm run optimize:img` | Reoptimiza las fotos a WebP (resize + thumb) y regenera `public/img/manifest.json`. |

## 📁 Estructura

```
.
├── index.html              # header persistente + montaje de la SPA
├── src/
│   ├── main.js             # arranque
│   ├── core/               # App, máquina de estados, i18n, FloatField, Assets
│   ├── background/         # RippleBackground (PixiJS)
│   ├── sections/           # Landing, ArchivosVivos (recorrido), Bitacoras, Form, FotoDetalle
│   ├── styles/             # tokens, base, sections
│   └── fonts/              # Metropolis (.otf) — empaquetadas por Vite
├── public/
│   ├── img/                # fotos optimizadas (WebP) + manifest.json
│   ├── svg/                # logo, fecha, ramas, pez, línea-guía
│   └── video/              # vídeo placeholder del recorrido
├── scripts/optimize-images.mjs
└── .github/workflows/      # deploy.yml (GitHub Pages)
```

## 🌐 Despliegue (GitHub Pages)

El repo incluye un workflow de **GitHub Actions** (`.github/workflows/deploy.yml`) que compila
con Vite y publica en GitHub Pages en cada `push` a `main`. El `base` se ajusta solo al nombre
del repositorio (se sirve en `https://<usuario>.github.io/<repo>/`).

Para activarlo: en GitHub → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## 🖼️ Nota sobre los assets

Las fotografías y el vídeo incluidos son **provisionales (placeholder)** para que el proyecto
funcione al clonarlo. Las imágenes pesadas originales se mantienen fuera del repositorio
(`/_raw_assets`, ignorado por git). La tipografía manuscrita del logo se usa como SVG; los
títulos manuscritos (`01`, nombres de río, ARCHIVOS VIVOS…) usan una fuente *fallback* hasta
integrar la definitiva.

---

TFG · Diseño y desarrollo de una experiencia web interactiva.
