import 'dart:math';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/enums.dart';
import '../models/piece.dart';
import '../models/move.dart';
import '../models/shield.dart';
import '../models/game_state.dart';
import 'move_generator.dart';
import 'ai_system.dart';

class GameController extends ChangeNotifier {
  GameState state = GameState();
  final Random _random = Random();

  GameController() {
    _loadHighScore();
  }

  Future<void> _loadHighScore() async {
    final prefs = await SharedPreferences.getInstance();
    state.highScore = prefs.getInt('powerChessHighScore') ?? 0;
    notifyListeners();
  }

  Future<void> _saveHighScore() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('powerChessHighScore', state.highScore);
  }

  void onTileTap(int row, int col) {
    if (state.phase != GamePhase.playing || state.aiThinking) return;
    if (state.currentTurn != PieceColor.white) return;

    // Active power target selection
    if (state.activePower != null) {
      final isValid = state.powerTargets.any((t) => t.row == row && t.col == col);
      if (isValid) {
        _executePower(row, col);
      } else {
        _cancelPower();
      }
      notifyListeners();
      return;
    }

    final clickedPiece = state.board[row][col];

    // Move selected piece
    if (state.selectedPiece != null) {
      final move = state.validMoves.cast<ChessMove?>().firstWhere(
        (m) => m!.row == row && m.col == col,
        orElse: () => null,
      );
      if (move != null) {
        _movePiece(state.selectedPiece!, row, col, move);
        if (state.phase == GamePhase.playing) _endTurn();
        notifyListeners();
        return;
      }
    }

    // Select a piece
    if (clickedPiece != null && clickedPiece.color == PieceColor.white) {
      state.selectedPiece = clickedPiece;
      state.validMoves = MoveGenerator.getLegalMoves(clickedPiece, state.board, state);
    } else {
      state.selectedPiece = null;
      state.validMoves = [];
    }
    notifyListeners();
  }

  void _movePiece(Piece piece, int toRow, int toCol, ChessMove move) {
    final board = state.board;
    final captured = board[toRow][toCol];
    final fromRow = piece.row;

    // Shield check
    if (captured != null && state.isShielded(captured)) {
      state.addLog('${captured.symbol} protegido por Escudo!');
      return;
    }

    board[piece.row][piece.col] = null;

    // En passant capture
    if (move.enPassant && piece.type == PieceType.pawn) {
      final capRow = piece.color == PieceColor.white ? toRow + 1 : toRow - 1;
      final capPawn = board[capRow][toCol];
      if (capPawn != null) {
        board[capRow][toCol] = null;
        state.playerCaptured.add(capPawn);
        state.score += capPawn.type.value * 10;
        state.addLog('${piece.symbol} captura al paso');
      }
    } else if (captured != null) {
      if (piece.color == PieceColor.white) {
        state.playerCaptured.add(captured);
        state.score += captured.type.value * 10;
      } else {
        state.aiCaptured.add(captured);
      }
      state.addLog('${piece.symbol} captura ${captured.symbol}');
      if (captured.type == PieceType.king) {
        piece.row = toRow; piece.col = toCol;
        board[toRow][toCol] = piece;
        if (captured.color == PieceColor.white) {
          _triggerGameOver();
        } else {
          _triggerLevelComplete();
        }
        return;
      }
    } else {
      state.addLog('${piece.symbol} mueve a ${String.fromCharCode(97 + toCol)}${8 - toRow}');
    }

    piece.row = toRow; piece.col = toCol;
    piece.hasMoved = true;
    board[toRow][toCol] = piece;

    // Castling
    if (move.castling != null && piece.type == PieceType.king) {
      if (move.castling == 'kingside') {
        final rook = board[fromRow][7];
        if (rook != null) {
          board[fromRow][7] = null;
          rook.row = fromRow; rook.col = 5; rook.hasMoved = true;
          board[fromRow][5] = rook;
        }
        state.addLog('${piece.symbol} enroque corto');
      } else {
        final rook = board[fromRow][0];
        if (rook != null) {
          board[fromRow][0] = null;
          rook.row = fromRow; rook.col = 3; rook.hasMoved = true;
          board[fromRow][3] = rook;
        }
        state.addLog('${piece.symbol} enroque largo');
      }
    }

    // En passant target update
    if (piece.type == PieceType.pawn && (toRow - fromRow).abs() == 2) {
      final epRow = (fromRow + toRow) ~/ 2;
      state.enPassantTarget = EnPassantTarget(row: epRow, col: toCol, color: piece.color);
    } else {
      state.enPassantTarget = null;
    }

    // Pawn promotion
    if (piece.type == PieceType.pawn) {
      if ((piece.color == PieceColor.white && toRow == 0) ||
          (piece.color == PieceColor.black && toRow == 7)) {
        if (piece.color == PieceColor.white) {
          state.promotingPawn = piece;
          state.phase = GamePhase.promoting;
        } else {
          piece.type = PieceType.queen;
          state.addLog('${piece.symbol} promociona a Reina!');
        }
      }
    }
  }

  void promotePawn(PieceType type) {
    final pawn = state.promotingPawn;
    if (pawn == null) return;
    pawn.type = type;
    state.addLog('Peón promociona a ${type.displayName}!');
    state.promotingPawn = null;
    state.phase = GamePhase.playing;
    _endTurn();
    notifyListeners();
  }

  void _endTurn() {
    state.selectedPiece = null;
    state.validMoves = [];
    state.activePower = null;
    state.powerTargets = [];
    if (state.phase != GamePhase.playing) return;

    if (state.currentTurn == PieceColor.white) {
      // Expire white shields
      state.shieldedPieces.removeWhere((s) {
        if (s.color == PieceColor.white) { s.turnsLeft--; return s.turnsLeft < 0; }
        return false;
      });
      state.currentTurn = PieceColor.black;
      state.aiMana += 1;

      // Record position
      state.positionHistory.add(state.getBoardHash());

      // Draw checks
      if (_checkDrawConditions()) return;
      if (MoveGenerator.isCheckmate(PieceColor.black, state.board, state)) {
        state.addLog('¡Jaque Mate! IA derrotada.');
        _triggerLevelComplete(); return;
      }
      if (MoveGenerator.isStalemate(PieceColor.black, state.board, state)) {
        state.addLog('Ahogado - IA sin movimientos.');
        _triggerLevelComplete(); return;
      }

      notifyListeners();
      // AI turn with delay
      state.aiThinking = true;
      Future.delayed(Duration(milliseconds: 500 + _random.nextInt(300)), () {
        _aiTurn();
        state.aiThinking = false;
        notifyListeners();
      });
    } else {
      // Expire black shields
      state.shieldedPieces.removeWhere((s) {
        if (s.color == PieceColor.black) { s.turnsLeft--; return s.turnsLeft < 0; }
        return false;
      });
      state.currentTurn = PieceColor.white;
      state.mana += 1;

      state.positionHistory.add(state.getBoardHash());
      if (_checkDrawConditions()) return;
      if (MoveGenerator.isCheckmate(PieceColor.white, state.board, state)) {
        state.addLog('¡Jaque Mate! Tu Rey ha caído.');
        _triggerGameOver(); return;
      }
      if (MoveGenerator.isStalemate(PieceColor.white, state.board, state)) {
        state.addLog('Ahogado.');
        _triggerGameOver(); return;
      }
      state.inCheck = MoveGenerator.isInCheck(PieceColor.white, state.board);
      if (state.inCheck) state.addLog('¡Tu Rey está en Jaque!');

      // Skip turn from chaos
      if (state.skipNextTurn) {
        state.skipNextTurn = false;
        state.addLog('Turno perdido por Caos Dimensional.');
        state.currentTurn = PieceColor.black;
        state.aiMana += 1;
        notifyListeners();
        state.aiThinking = true;
        Future.delayed(Duration(milliseconds: 500), () {
          _aiTurn();
          state.aiThinking = false;
          notifyListeners();
        });
      }
    }
  }

  void _aiTurn() {
    if (state.phase != GamePhase.playing) return;
    final result = AiSystem.getBestAction(state);

    if (result.usePower && result.power != null) {
      _executeAiPower(result.power!);
    } else if (result.piece != null && result.move != null) {
      _movePiece(result.piece!, result.move!.row, result.move!.col, result.move!);
    } else {
      state.addLog('IA sin movimientos.');
      _triggerLevelComplete();
      return;
    }

    if (state.phase == GamePhase.playing) _endTurn();
  }

  void _executeAiPower(AiPowerAction action) {
    final board = state.board;
    switch (action.type) {
      case PowerType.shadowJump:
        state.aiMana -= 2;
        final p = action.piece;
        board[p.row][p.col] = null;
        p.row = action.target!.row; p.col = action.target!.col;
        board[p.row][p.col] = p;
        state.addLog('IA: ${p.symbol} Salto Sombra');
        break;
      case PowerType.thunderStrike:
        state.aiMana -= 3;
        final t = board[action.target!.row][action.target!.col];
        if (t != null) {
          if (t.type == PieceType.king) {
            board[action.target!.row][action.target!.col] = null;
            state.addLog('IA: Trueno destruye al Rey!');
            _triggerGameOver(); return;
          }
          board[action.target!.row][action.target!.col] = null;
          state.aiCaptured.add(t);
          state.addLog('IA: Trueno destruye ${t.symbol}');
        }
        break;
      case PowerType.sacredShield:
        state.aiMana -= 3;
        final king = action.piece;
        state.shieldedPieces.add(Shield(row: king.row, col: king.col, color: PieceColor.black));
        state.addLog('IA: Escudo Sagrado en Rey');
        break;
      case PowerType.defenseShout:
        state.aiMana -= 4;
        int count = 0;
        for (int r = 0; r < 8; r++) {
          for (int c = 0; c < 8; c++) {
            final p = board[r][c];
            if (p != null && p.color == PieceColor.black && p.type == PieceType.pawn && !state.isShielded(p)) {
              state.shieldedPieces.add(Shield(row: p.row, col: p.col, color: p.color));
              count++;
            }
          }
        }
        state.addLog('IA: Grito de Defensa ($count peones)');
        break;
      case PowerType.fireball:
        state.aiMana -= 4;
        final queen = action.piece;
        final dr = action.dir!['dr']!; final dc = action.dir!['dc']!;
        int destroyed = 0;
        for (int i = 1; i <= 3; i++) {
          final r = queen.row + dr * i, c = queen.col + dc * i;
          if (!MoveGenerator.inBounds(r, c)) break;
          final target = board[r][c];
          if (target != null) {
            if (target.color == PieceColor.white && target.type == PieceType.king) {
              board[r][c] = null;
              state.addLog('IA: Bola de Fuego destruye al Rey!');
              _triggerGameOver(); return;
            }
            if (target.color == PieceColor.black && target.type == PieceType.king) {
              board[r][c] = null;
              state.addLog('IA: Bola de Fuego destruye su Rey!');
              _triggerLevelComplete(); return;
            }
            if (target.color == PieceColor.white) state.aiCaptured.add(target);
            board[r][c] = null;
            destroyed++;
          }
        }
        state.addLog('IA: Bola de Fuego ($destroyed destruidas)');
        break;
      case PowerType.spectralDash:
        state.aiMana -= 2;
        final p = action.piece;
        board[p.row][p.col] = null;
        p.row = action.target!.row; p.col = action.target!.col;
        board[p.row][p.col] = p;
        state.addLog('IA: ${p.symbol} Paso Espectral');
        break;
      default: break;
    }
  }

  // ===== PLAYER POWERS =====
  void activatePower(PowerType power) {
    if (state.currentTurn != PieceColor.white || state.phase != GamePhase.playing) return;

    // Toggle off
    if (state.activePower == power) { _cancelPower(); notifyListeners(); return; }

    if (power == PowerType.chaos) {
      if (state.mana < 100) return;
      state.mana -= 100;
      _randomizeBoard();
      state.addLog('¡Caos Dimensional! Pierdes un turno.');
      state.skipNextTurn = true;
      _endTurn();
      notifyListeners();
      return;
    }

    final piece = state.selectedPiece;
    if (piece == null) return;

    switch (power) {
      case PowerType.shadowJump:
        if (piece.type != PieceType.knight || state.mana < 2) return;
        state.activePower = PowerType.shadowJump;
        state.powerTargets = [];
        for (int r = 0; r < 8; r++)
          for (int c = 0; c < 8; c++)
            if (state.board[r][c] == null) state.powerTargets.add(ChessMove(row: r, col: c));
        state.validMoves = state.powerTargets;
        state.addLog('Salto Sombra activado');
        break;
      case PowerType.thunderStrike:
        if (piece.type != PieceType.rook || state.mana < 3) return;
        state.activePower = PowerType.thunderStrike;
        state.powerTargets = [];
        for (int dr = -1; dr <= 1; dr++)
          for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) continue;
            final r = piece.row + dr, c = piece.col + dc;
            if (MoveGenerator.inBounds(r, c) && state.board[r][c] != null && state.board[r][c]!.color == PieceColor.black)
              state.powerTargets.add(ChessMove(row: r, col: c));
          }
        state.validMoves = state.powerTargets;
        state.addLog('Golpe de Trueno activado');
        break;
      case PowerType.sacredShield:
        if (piece.type != PieceType.king || state.mana < 3) return;
        state.mana -= 3;
        state.shieldedPieces.add(Shield(row: piece.row, col: piece.col, color: PieceColor.white));
        state.addLog('Escudo Sagrado aplicado!');
        _endTurn();
        break;
      case PowerType.defenseShout:
        if (piece.type != PieceType.king || state.mana < 4) return;
        state.mana -= 4;
        int count = 0;
        for (int r = 0; r < 8; r++)
          for (int c = 0; c < 8; c++) {
            final p = state.board[r][c];
            if (p != null && p.color == PieceColor.white && p.type == PieceType.pawn && !state.isShielded(p)) {
              state.shieldedPieces.add(Shield(row: p.row, col: p.col, color: p.color));
              count++;
            }
          }
        state.addLog('Grito de Defensa! $count peones.');
        _endTurn();
        break;
      case PowerType.fireball:
        if (piece.type != PieceType.queen || state.mana < 4) return;
        state.activePower = PowerType.fireball;
        state.powerTargets = [];
        for (final dir in [[-1,0],[1,0],[0,-1],[0,1]]) {
          final r = piece.row + dir[0], c = piece.col + dir[1];
          if (MoveGenerator.inBounds(r, c)) state.powerTargets.add(ChessMove(row: r, col: c));
        }
        state.validMoves = state.powerTargets;
        state.addLog('Bola de Fuego activada');
        break;
      case PowerType.spectralDash:
        if (piece.type != PieceType.bishop || state.mana < 2) return;
        state.activePower = PowerType.spectralDash;
        state.powerTargets = [];
        for (final dir in [[-1,-1],[-1,1],[1,-1],[1,1]])
          for (int i = 1; i < 8; i++) {
            final r = piece.row + dir[0] * i, c = piece.col + dir[1] * i;
            if (!MoveGenerator.inBounds(r, c)) break;
            if (state.board[r][c] == null) state.powerTargets.add(ChessMove(row: r, col: c));
          }
        state.validMoves = state.powerTargets;
        state.addLog('Paso Espectral activado');
        break;
      default: break;
    }
    notifyListeners();
  }

  void _executePower(int row, int col) {
    final piece = state.selectedPiece!;
    final board = state.board;

    switch (state.activePower!) {
      case PowerType.shadowJump:
        state.mana -= 2;
        board[piece.row][piece.col] = null;
        piece.row = row; piece.col = col;
        board[row][col] = piece;
        state.addLog('${piece.symbol} Salto Sombra!');
        _endTurn();
        break;
      case PowerType.thunderStrike:
        final target = board[row][col];
        if (target != null) {
          state.mana -= 3;
          if (target.type == PieceType.king) {
            board[row][col] = null;
            state.addLog('Trueno destruye ${target.symbol}!');
            _triggerLevelComplete(); return;
          }
          board[row][col] = null;
          state.playerCaptured.add(target);
          state.score += target.type.value * 10;
          state.addLog('Trueno destruye ${target.symbol}!');
        }
        _endTurn();
        break;
      case PowerType.fireball:
        state.mana -= 4;
        // Find direction from target
        final dr = (row - piece.row).sign;
        final dc = (col - piece.col).sign;
        int destroyed = 0;
        for (int i = 1; i <= 3; i++) {
          final r = piece.row + dr * i, c = piece.col + dc * i;
          if (!MoveGenerator.inBounds(r, c)) break;
          final target = board[r][c];
          if (target != null) {
            if (target.color == PieceColor.black) {
              if (target.type == PieceType.king) {
                board[r][c] = null;
                state.addLog('Bola de Fuego destruye Rey enemigo!');
                _triggerLevelComplete(); return;
              }
              state.playerCaptured.add(target);
              state.score += target.type.value * 10;
            } else {
              if (target.type == PieceType.king) {
                board[r][c] = null;
                state.addLog('Bola de Fuego destruye tu Rey!');
                _triggerGameOver(); return;
              }
            }
            board[r][c] = null;
            destroyed++;
          }
        }
        state.addLog('Bola de Fuego! $destroyed destruidas.');
        _endTurn();
        break;
      case PowerType.spectralDash:
        state.mana -= 2;
        board[piece.row][piece.col] = null;
        piece.row = row; piece.col = col;
        board[row][col] = piece;
        state.addLog('${piece.symbol} Paso Espectral!');
        _endTurn();
        break;
      default: break;
    }
    state.activePower = null;
    state.powerTargets = [];
  }

  void _cancelPower() {
    state.activePower = null;
    state.powerTargets = [];
    state.validMoves = state.selectedPiece != null
        ? MoveGenerator.getLegalMoves(state.selectedPiece!, state.board, state)
        : [];
  }

  // ===== GAME FLOW =====
  bool _checkDrawConditions() {
    if (MoveGenerator.isInsufficientMaterial(state.board)) {
      state.addLog('Empate: material insuficiente.');
      state.phase = GamePhase.draw;
      _updateHighScore();
      notifyListeners();
      return true;
    }
    if (MoveGenerator.isThreefoldRepetition(state)) {
      state.addLog('Empate: triple repetición.');
      state.phase = GamePhase.draw;
      _updateHighScore();
      notifyListeners();
      return true;
    }
    return false;
  }

  void _triggerGameOver() {
    state.phase = GamePhase.gameOver;
    _updateHighScore();
    notifyListeners();
  }

  void _triggerLevelComplete() {
    state.phase = GamePhase.levelUp;
    state.score += state.level * 50;
    _updateHighScore();
    notifyListeners();
  }

  void _updateHighScore() {
    if (state.score > state.highScore) {
      state.highScore = state.score;
      _saveHighScore();
    }
  }

  void nextLevel() {
    state.level++;
    state.phase = GamePhase.playing;
    state.reset(keepScore: true);
    state.addLog('--- Nivel ${state.level} ---');
    notifyListeners();
  }

  void restart() {
    state.reset();
    state.addLog('Nueva partida iniciada.');
    notifyListeners();
  }

  void _randomizeBoard() {
    final board = List.generate(8, (_) => List<Piece?>.filled(8, null));
    final squares = <List<int>>[];
    for (int r = 0; r < 8; r++)
      for (int c = 0; c < 8; c++)
        squares.add([r, c]);
    squares.shuffle(_random);

    int idx = 0;
    final wk = squares[idx++];
    board[wk[0]][wk[1]] = Piece(type: PieceType.king, color: PieceColor.white, row: wk[0], col: wk[1]);

    // Black king at least 2 away
    List<int>? bk;
    for (int i = idx; i < squares.length; i++) {
      final dist = (squares[i][0] - wk[0]).abs() + (squares[i][1] - wk[1]).abs();
      if (dist >= 2) { bk = squares.removeAt(i); break; }
    }
    bk ??= squares[idx++];
    board[bk[0]][bk[1]] = Piece(type: PieceType.king, color: PieceColor.black, row: bk[0], col: bk[1]);

    // Collect non-king pieces
    final whites = <PieceType>[], blacks = <PieceType>[];
    for (int r = 0; r < 8; r++)
      for (int c = 0; c < 8; c++) {
        final p = state.board[r][c];
        if (p != null && p.type != PieceType.king) {
          (p.color == PieceColor.white ? whites : blacks).add(p.type);
        }
      }

    for (final type in whites) {
      if (idx >= squares.length) break;
      var pos = squares[idx++];
      if (type == PieceType.pawn && (pos[0] == 0 || pos[0] == 7)) {
        for (int i = idx; i < squares.length; i++) {
          if (squares[i][0] != 0 && squares[i][0] != 7) { pos = squares[i]; squares[i] = squares[idx - 1]; break; }
        }
      }
      board[pos[0]][pos[1]] = Piece(type: type, color: PieceColor.white, row: pos[0], col: pos[1]);
    }
    for (final type in blacks) {
      if (idx >= squares.length) break;
      var pos = squares[idx++];
      if (type == PieceType.pawn && (pos[0] == 0 || pos[0] == 7)) {
        for (int i = idx; i < squares.length; i++) {
          if (squares[i][0] != 0 && squares[i][0] != 7) { pos = squares[i]; squares[i] = squares[idx - 1]; break; }
        }
      }
      board[pos[0]][pos[1]] = Piece(type: type, color: PieceColor.black, row: pos[0], col: pos[1]);
    }

    state.board = board;
    state.shieldedPieces = [];
    state.enPassantTarget = null;
    state.selectedPiece = null;
    state.validMoves = [];
  }

  // Available powers for selected piece
  List<PowerType> get availablePowers {
    final piece = state.selectedPiece;
    final powers = <PowerType>[];
    if (state.mana >= 100) powers.add(PowerType.chaos);
    if (piece == null || state.currentTurn != PieceColor.white) return powers;

    if (piece.type == PieceType.knight && state.mana >= 2) powers.insert(0, PowerType.shadowJump);
    if (piece.type == PieceType.rook && state.mana >= 3) powers.insert(0, PowerType.thunderStrike);
    if (piece.type == PieceType.king && state.mana >= 3) powers.insert(0, PowerType.sacredShield);
    if (piece.type == PieceType.king && state.mana >= 4) powers.insert(0, PowerType.defenseShout);
    if (piece.type == PieceType.queen && state.mana >= 4) powers.insert(0, PowerType.fireball);
    if (piece.type == PieceType.bishop && state.mana >= 2) powers.insert(0, PowerType.spectralDash);
    return powers;
  }
}
