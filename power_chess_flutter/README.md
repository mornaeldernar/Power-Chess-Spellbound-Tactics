# Power Chess: Spellbound Tactics - Flutter

App nativa para iOS y Android del juego Power Chess.

## Requisitos

- Flutter SDK 3.2+
- Dart SDK 3.2+
- Android Studio / Xcode para compilar

## Instalación

```bash
cd power_chess_flutter
flutter pub get
```

## Ejecutar

```bash
# Android
flutter run -d android

# iOS
flutter run -d ios

# Debug en cualquier dispositivo conectado
flutter run
```

## Compilar APK / IPA

```bash
# Android APK
flutter build apk --release

# Android App Bundle (para Play Store)
flutter build appbundle --release

# iOS (requiere Mac con Xcode)
flutter build ios --release
```

## Estructura

```
lib/
├── main.dart                 # Entry point + MaterialApp
├── models/
│   ├── enums.dart           # PieceType, PieceColor, PowerType, GamePhase
│   ├── piece.dart           # Piece model
│   ├── move.dart            # ChessMove with flags
│   ├── shield.dart          # Shield model
│   └── game_state.dart      # GameState with board init
├── logic/
│   ├── move_generator.dart  # Movement, check, checkmate, draw detection
│   ├── ai_system.dart       # AI evaluation + power usage
│   └── game_controller.dart # Game loop, turns, powers, ChangeNotifier
├── widgets/
│   └── board_painter.dart   # CustomPainter for the chess board
└── screens/
    └── game_screen.dart     # Main game UI
```

## Características

- Tablero renderizado con CustomPainter (nativo, no WebView)
- 7 poderes mágicos con sistema de maná
- IA progresiva que escala con cada nivel
- Jaque, jaque mate, enroque, en passant, coronación
- Detección de empate (triple repetición, material insuficiente)
- High Score persistido con SharedPreferences
- UI responsive para móvil
