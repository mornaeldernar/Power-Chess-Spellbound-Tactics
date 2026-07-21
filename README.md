# ♟️ Power Chess: Spellbound Tactics

![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?style=for-the-badge&logo=github)
![JavaScript](https://img.shields.io/badge/Code-JavaScript_ES6+-yellow?style=for-the-badge&logo=javascript)
![HTML5 Canvas](https://img.shields.io/badge/Render-HTML5_Canvas-orange?style=for-the-badge&logo=html5)

> **Proyecto desarrollado para el Hackathon Kiro / Código Facilito.**

## 🎮 Demo en Vivo
👉 [¡Jugar a Power Chess aquí!](https://mornaeldernar.github.io/Power-Chess-Spellbound-Tactics/)

---

## 📌 Descripción del Proyecto
**Power Chess** combina las reglas tácticas del ajedrez clásico con habilidades especiales y magias estilo RPG. En cada turno, no solo mueves tus piezas, sino que puedes gastar **Maná** para activar poderes devastadores. Incluye reglas completas de jaque y jaque mate, coronación de peones con selección de pieza, y una IA que se vuelve más inteligente con cada nivel.

---

## ⚔️ Sistema de Poderes

Cada pieza tiene un hechizo único que se desbloquea al seleccionarla (si tienes maná suficiente):

| Pieza | Poder | Coste | Efecto |
|-------|-------|-------|--------|
| 🐴 Caballo | **Salto Sombra** | 2 Maná | Se teletransporta a cualquier casilla vacía del tablero |
| 🏰 Torre | **Golpe de Trueno** | 3 Maná | Destruye una pieza enemiga adyacente sin moverse |
| 👑 Rey | **Escudo Sagrado** | 3 Maná | Se vuelve inmune a capturas durante 1 turno enemigo |
| � Rey | **Grito de Defensa** | 4 Maná | Aplica escudo a todos los peones aliados durante 1 turno |
| 👸 Reina | **Bola de Fuego** | 4 Maná | Destruye todo en 3 casillas en línea recta (arriba/abajo/izquierda/derecha) |
| 🔮 Alfil | **Paso Espectral** | 2 Maná | Se teletransporta a cualquier diagonal vacía (ignora bloqueos) |

---

## 🧠 IA Progresiva

La dificultad de la IA escala con cada nivel completado:

- **Nivel 1:** Juego básico con alta aleatoriedad.
- **Nivel 2:** Evaluación de seguridad — evita casillas atacadas, protege sus piezas.
- **Nivel 3:** Busca dar jaque activamente al jugador.
- **Nivel 4:** Lookahead — analiza si el jugador puede responder capturando.
- **Nivel 5:** Caza al Rey — prioriza acercarse al rey del jugador.
- **Nivel 6+:** Coordinación — protege piezas aliadas entre sí, aleatoriedad mínima.

---

## 🏆 Mecánicas de Juego

- **Maná:** +1 por turno. Se acumula entre niveles.
- **Jaque/Jaque Mate:** Implementado con reglas reales — no puedes hacer movimientos que dejen tu rey en jaque.
- **Coronación de Peones:** Al llegar al final del tablero, el jugador elige entre Reina, Torre, Alfil o Caballo.
- **Niveles progresivos:** Captura al Rey enemigo o hazle Jaque Mate para avanzar de nivel.
- **Game Over:** Si tu Rey es capturado o recibes Jaque Mate.
- **High Score:** Persistido en LocalStorage entre sesiones.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend / Renderizado:** HTML5 Canvas API (nativo, sin dependencias).
- **Estilos e Interfaz:** CSS3 con tema oscuro/mágico y diseño responsive.
- **Audio:** Web Audio API (efectos sintetizados para mover, capturar, lanzar poder, game over y level up).
- **Persistencia:** LocalStorage para High Score.
- **Despliegue:** GitHub Pages (sitio estático, sin build step).

---

## � Estructura del Proyecto

```
├── index.html    # Estructura HTML con canvas y panel UI
├── style.css     # Estilos dark/sci-fi responsive
├── game.js       # Lógica completa del juego (~1000 líneas)
└── README.md     # Este archivo
```

---

## �🚀 Ejecución Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/mornaeldernar/Power-Chess-Spellbound-Tactics.git
   cd Power-Chess-Spellbound-Tactics
   ```

2. Abrir `index.html` en cualquier navegador moderno. No requiere servidor, npm, ni compilación.

---

## 🎨 Controles

1. **Click en pieza blanca** → la selecciona y muestra movimientos legales.
2. **Click en casilla válida** → mueve la pieza.
3. **Botones del panel lateral** → activan poderes (si la pieza seleccionada tiene uno disponible y hay maná suficiente).
4. **Click fuera de movimientos válidos** → deselecciona / cancela poder.

---

## 📜 Licencia

Proyecto de código abierto creado para fines educativos y de demostración.
