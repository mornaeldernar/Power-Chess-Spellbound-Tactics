# Entregable - Hackathon Kiro / Código Facilito

---

## Título

**Power Chess: Spellbound Tactics**

---

## Breve Descripción

Videojuego 2D de ajedrez táctico con poderes mágicos, desarrollado completamente con IA (Kiro). Combina las reglas clásicas del ajedrez con un sistema de maná y hechizos únicos por pieza, una IA que escala en dificultad por niveles, y mecánicas de progresión infinita. Disponible como sitio web estático y como app nativa Flutter para iOS/Android.

---

## Reto que Resuelve

**Videojuegos** — Desarrollo de un videojuego original y jugable de principio a fin, combinando lógica, gráficos y mecánicas divertidas.

---

## Repositorio Público

🔗 **GitHub:** [https://github.com/mornaeldernar/Power-Chess-Spellbound-Tactics](https://github.com/mornaeldernar/Power-Chess-Spellbound-Tactics)

- Código fuente completo (HTML/CSS/JS + Flutter)
- README.md con documentación
- Sin dependencias externas ni build step

---

## Demo en Línea

🎮 **Jugar:** [https://mornaeldernar.github.io/Power-Chess-Spellbound-Tactics/](https://mornaeldernar.github.io/Power-Chess-Spellbound-Tactics/)

---

## Componentes Principales

### 1. Mecánicas de Ajedrez Completas
- Movimiento de las 6 piezas con reglas oficiales
- Jaque y jaque mate (obligatorio resolver el jaque)
- Enroque (corto y largo) con validación completa
- Captura al paso (en passant)
- Coronación de peones con selección interactiva
- Empate por triple repetición y material insuficiente

### 2. Sistema de Poderes y Maná
Cada pieza tiene un hechizo único que gasta maná (+1 por turno):

| Pieza | Poder | Costo | Efecto |
|-------|-------|-------|--------|
| Caballo | Salto Sombra | 2 | Teletransporta a cualquier casilla vacía |
| Torre | Golpe de Trueno | 3 | Destruye enemigo adyacente sin moverse |
| Rey | Escudo Sagrado | 3 | Inmunidad 1 turno |
| Rey | Grito de Defensa | 4 | Escuda todos los peones aliados |
| Reina | Bola de Fuego | 4 | Destruye 3 casillas en línea recta |
| Alfil | Paso Espectral | 2 | Teletransporta a diagonal ignorando bloqueos |
| Cualquiera | Caos Dimensional | 100 | Randomiza el tablero, pierdes un turno |

### 3. IA Progresiva con Poderes
La IA también tiene maná, usa poderes estratégicamente, y escala por nivel:
- Nivel 1: Básica, aleatoria
- Nivel 2: Evalúa seguridad, empieza a usar poderes
- Nivel 3: Busca dar jaque
- Nivel 4: Lookahead (anticipa respuestas)
- Nivel 5: Caza al rey del jugador
- Nivel 6+: Coordinación de piezas, uso táctico de poderes

### 4. Interfaz y UX
- Tablero renderizado con HTML5 Canvas / CustomPainter (Flutter)
- Tema oscuro/mágico con toggle a paleta Código Facilito
- Pantalla de bienvenida animada
- UI responsive (móvil: poderes primero, stats compactos)
- Indicadores visuales: jaque (rojo), enroque (cian), en passant (naranja), escudo (dorado)
- Sonidos sintetizados con Web Audio API

### 5. Progresión
- Niveles infinitos (jaque mate o captura de rey enemigo avanza nivel)
- Puntuación acumulativa
- High Score persistido en LocalStorage / SharedPreferences
- Game Over si tu rey es capturado o recibes jaque mate

---

## Stack Tecnológico

| Plataforma | Tecnología |
|-----------|------------|
| Web | HTML5 Canvas + CSS3 + JavaScript ES6+ (0 dependencias) |
| Audio | Web Audio API (sintetizado) |
| Mobile | Flutter (Dart) con CustomPainter nativo |
| Deploy Web | GitHub Pages (estático) |
| Persistencia | LocalStorage (web) / SharedPreferences (Flutter) |

---

## Estructura del Proyecto

```
/                            # Versión Web
├── index.html               # Estructura + pantalla bienvenida
├── style.css                # Tema con CSS variables
├── game.js                  # Lógica completa (~1950 líneas)
└── README.md

/power_chess_flutter/        # Versión Mobile Nativa
├── pubspec.yaml
├── lib/
│   ├── main.dart
│   ├── models/              # Piece, Move, Shield, GameState, Enums
│   ├── logic/               # MoveGenerator, AI, GameController
│   ├── widgets/             # BoardPainter (CustomPainter)
│   └── screens/             # WelcomeScreen, GameScreen
└── README.md
```

---

## Desarrollo con Kiro

El proyecto fue desarrollado enteramente utilizando **Kiro** como asistente de desarrollo:
- Generación iterativa de código con corrección de bugs en tiempo real
- Implementación progresiva de features (primero ajedrez básico, luego poderes, IA, reglas avanzadas)
- Port completo a Flutter manteniendo la misma arquitectura lógica
- Debug asistido (stack overflow por recursión, detección de jaque en peones, friendly fire)

---

## Video de Presentación

📹 *[Pendiente de grabar - Máximo 5 minutos]*

Contenido del video:
1. Demo jugable mostrando movimientos y poderes
2. IA usando hechizos contra el jugador
3. Jaque mate y progresión de niveles
4. Responsive en móvil
5. Fragmentos de código clave (IA, sistema de poderes)
