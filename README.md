# ♟️ Power Chess: Spellbound Tactics

![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?style=for-the-badge&logo=github)
![JavaScript](https://img.shields.io/badge/Code-JavaScript_ES6+-yellow?style=for-the-badge&logo=javascript)
![HTML5 Canvas](https://img.shields.io/badge/Render-HTML5_Canvas-orange?style=for-the-badge&logo=html5)

> **Proyecto desarrollado para el Hackathon Kiro / Código Facilito.**

## 🎮 Demo en Vivo
👉 [¡Jugar a Power Chess aquí!](https://mornaeldernar.github.io/Power-Chess-Spellbound-Tactics/)

---

## 📌 Descripción del Proyecto

**Power Chess: Spellbound Tactics** combina las reglas tácticas del ajedrez clásico con habilidades especiales y magias estilo RPG. En cada turno, no solo mueves tus piezas, sino que puedes gastar **Maná** (o puntos) para activar poderes devastadores. Incluye reglas completas de jaque/jaque mate, enroque, captura al paso (en passant), coronación de peones con selección interactiva, y una IA que se vuelve progresivamente más inteligente con cada nivel.

---

## ⚔️ Sistema de Poderes

Cada pieza tiene un hechizo único que se desbloquea al seleccionarla:

| Pieza | Poder | Coste | Efecto |
|-------|-------|-------|--------|
| 🐴 Caballo | **Salto Sombra** | 2 Maná | Se teletransporta a cualquier casilla vacía del tablero |
| 🏰 Torre | **Golpe de Trueno** | 3 Maná | Destruye una pieza enemiga adyacente sin moverse |
| 👑 Rey | **Escudo Sagrado** | 3 Maná | Se vuelve inmune a capturas durante 1 turno enemigo |
| 👑 Rey | **Grito de Defensa** | 4 Maná | Aplica escudo a todos los peones aliados durante 1 turno |
| 👸 Reina | **Bola de Fuego** | 4 Maná | Destruye todo en 3 casillas en línea recta (arriba/abajo/izquierda/derecha) |
| 🔮 Alfil | **Paso Espectral** | 2 Maná | Se teletransporta a cualquier diagonal vacía (ignora bloqueos) |
| 🌀 Cualquiera | **Caos Dimensional** | 1000 Maná | Randomiza el tablero en posiciones válidas. Pierdes un turno. |

---

## 🧠 IA Progresiva

La dificultad de la IA escala con cada nivel completado:

| Nivel | Comportamiento |
|-------|---------------|
| 1 | Juego básico con alta aleatoriedad |
| 2 | Evaluación de seguridad — evita casillas atacadas, protege sus piezas |
| 3 | Busca dar jaque activamente al jugador |
| 4 | Lookahead — analiza si el jugador puede responder capturando |
| 5 | Caza al Rey — prioriza acercarse al rey del jugador |
| 6+ | Coordinación entre piezas, aleatoriedad mínima |

---

## 🏆 Mecánicas de Juego

- **Maná:** +1 por turno. Se acumula entre niveles.
- **Jaque / Jaque Mate:** Implementado con reglas reales — no puedes hacer movimientos que dejen tu rey en jaque. Si es jaque mate, ganas o pierdes.
- **Enroque:** Corto y largo, con validación completa (rey/torre no movidos, casillas intermedias libres y no atacadas).
- **Captura al Paso (En Passant):** Cuando un peón avanza 2 casillas, el peón enemigo adyacente puede capturarlo al paso el turno siguiente.
- **Coronación de Peones:** Al llegar al final del tablero, el jugador elige entre Reina, Torre, Alfil o Caballo mediante un modal interactivo. La IA siempre promociona a Reina.
- **Caos Dimensional:** Por 1000 puntos, randomiza todo el tablero. El jugador pierde un turno como penalización.
- **Niveles progresivos:** Haz Jaque Mate o captura al Rey enemigo para avanzar de nivel.
- **Game Over:** Si tu Rey es capturado o recibes Jaque Mate.
- **High Score:** Persistido en LocalStorage entre sesiones.

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso |
|-----------|-----|
| HTML5 Canvas | Renderizado del tablero y piezas |
| CSS3 | Tema oscuro/mágico responsive |
| JavaScript ES6+ | Lógica completa del juego (~1400 líneas) |
| Web Audio API | Efectos sonoros sintetizados |
| LocalStorage | Persistencia de High Score |
| GitHub Pages | Despliegue estático (sin build step) |

---

## 📁 Estructura del Proyecto

```
├── index.html    # Estructura HTML con canvas y panel UI
├── style.css     # Estilos dark/sci-fi responsive
├── game.js       # Lógica completa del juego
└── README.md     # Documentación
```

**Sin dependencias externas.** No requiere npm, webpack, ni compilación.

---

## 🚀 Ejecución Local

```bash
git clone https://github.com/mornaeldernar/Power-Chess-Spellbound-Tactics.git
cd Power-Chess-Spellbound-Tactics
```

Abrir `index.html` en cualquier navegador moderno. Listo.

---

## 🎨 Controles

1. **Click en pieza blanca** → la selecciona y muestra movimientos legales.
2. **Click en casilla válida** → mueve la pieza.
3. **Botones del panel lateral** → activan poderes (si la pieza tiene uno disponible y hay maná/puntos suficientes).
4. **Click fuera de movimientos** → deselecciona / cancela poder.

### Indicadores Visuales

| Color | Significado |
|-------|------------|
| Púrpura (punto) | Movimiento normal disponible |
| Rojo (casilla) | Captura disponible |
| Azul-cian (casilla) | Enroque disponible |
| Naranja (casilla) | Captura al paso disponible |
| Dorado (círculo) | Pieza con escudo activo |
| Rojo (borde) | Rey en jaque |

---

## 📜 Licencia

Proyecto de código abierto creado para fines educativos y de demostración.
