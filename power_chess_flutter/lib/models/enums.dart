enum PieceType { king, queen, rook, bishop, knight, pawn }

enum PieceColor { white, black }

enum PowerType {
  shadowJump,    // Knight - 2 mana
  thunderStrike, // Rook - 3 mana
  sacredShield,  // King - 3 mana
  defenseShout,  // King - 4 mana
  fireball,      // Queen - 4 mana
  spectralDash,  // Bishop - 2 mana
  chaos,         // Any - 100 mana
}

enum GamePhase { playing, gameOver, levelUp, draw, promoting }

extension PieceTypeExtension on PieceType {
  int get value {
    switch (this) {
      case PieceType.king: return 1000;
      case PieceType.queen: return 9;
      case PieceType.rook: return 5;
      case PieceType.bishop: return 3;
      case PieceType.knight: return 3;
      case PieceType.pawn: return 1;
    }
  }

  String symbol(PieceColor color) {
    const symbols = {
      PieceColor.white: {
        PieceType.king: '\u2654',
        PieceType.queen: '\u2655',
        PieceType.rook: '\u2656',
        PieceType.bishop: '\u2657',
        PieceType.knight: '\u2658',
        PieceType.pawn: '\u2659',
      },
      PieceColor.black: {
        PieceType.king: '\u265A',
        PieceType.queen: '\u265B',
        PieceType.rook: '\u265C',
        PieceType.bishop: '\u265D',
        PieceType.knight: '\u265E',
        PieceType.pawn: '\u265F',
      },
    };
    return symbols[color]![this]!;
  }

  String get displayName {
    switch (this) {
      case PieceType.king: return 'Rey';
      case PieceType.queen: return 'Reina';
      case PieceType.rook: return 'Torre';
      case PieceType.bishop: return 'Alfil';
      case PieceType.knight: return 'Caballo';
      case PieceType.pawn: return 'Peón';
    }
  }
}

extension PowerTypeExtension on PowerType {
  int get manaCost {
    switch (this) {
      case PowerType.shadowJump: return 2;
      case PowerType.thunderStrike: return 3;
      case PowerType.sacredShield: return 3;
      case PowerType.defenseShout: return 4;
      case PowerType.fireball: return 4;
      case PowerType.spectralDash: return 2;
      case PowerType.chaos: return 100;
    }
  }

  String get displayName {
    switch (this) {
      case PowerType.shadowJump: return 'Salto Sombra';
      case PowerType.thunderStrike: return 'Golpe de Trueno';
      case PowerType.sacredShield: return 'Escudo Sagrado';
      case PowerType.defenseShout: return 'Grito de Defensa';
      case PowerType.fireball: return 'Bola de Fuego';
      case PowerType.spectralDash: return 'Paso Espectral';
      case PowerType.chaos: return 'Caos Dimensional';
    }
  }

  String get description {
    switch (this) {
      case PowerType.shadowJump: return 'Caballo: mueve a cualquier casilla vacía';
      case PowerType.thunderStrike: return 'Torre: destruye enemigo adyacente';
      case PowerType.sacredShield: return 'Rey: inmunidad 1 turno';
      case PowerType.defenseShout: return 'Rey: escuda todos los peones aliados';
      case PowerType.fireball: return 'Reina: destruye 3 casillas en línea recta';
      case PowerType.spectralDash: return 'Alfil: teletransporta a diagonal vacía';
      case PowerType.chaos: return 'Randomiza el tablero. Pierdes un turno.';
    }
  }

  String get icon {
    switch (this) {
      case PowerType.shadowJump: return '👁';
      case PowerType.thunderStrike: return '⚡';
      case PowerType.sacredShield: return '🛡';
      case PowerType.defenseShout: return '📢';
      case PowerType.fireball: return '🔥';
      case PowerType.spectralDash: return '💫';
      case PowerType.chaos: return '🌀';
    }
  }

  PieceType? get requiredPiece {
    switch (this) {
      case PowerType.shadowJump: return PieceType.knight;
      case PowerType.thunderStrike: return PieceType.rook;
      case PowerType.sacredShield: return PieceType.king;
      case PowerType.defenseShout: return PieceType.king;
      case PowerType.fireball: return PieceType.queen;
      case PowerType.spectralDash: return PieceType.bishop;
      case PowerType.chaos: return null; // Any piece or none
    }
  }
}
