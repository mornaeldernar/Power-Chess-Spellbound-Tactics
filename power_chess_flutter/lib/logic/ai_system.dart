import 'dart:math';
import '../models/enums.dart';
import '../models/piece.dart';
import '../models/move.dart';
import '../models/game_state.dart';
import 'move_generator.dart';

class AiPowerAction {
  final PowerType type;
  final Piece piece;
  final ChessMove? target;
  final Map<String, int>? dir;
  final double score;

  AiPowerAction({
    required this.type,
    required this.piece,
    this.target,
    this.dir,
    required this.score,
  });
}

class AiMoveResult {
  final Piece? piece;
  final ChessMove? move;
  final AiPowerAction? power;
  final bool usePower;

  AiMoveResult({this.piece, this.move, this.power, this.usePower = false});
}

class AiSystem {
  static final _random = Random();

  static AiMoveResult getBestAction(GameState state) {
    final board = state.board;
    final level = state.level;
    final aiPieces = <Piece>[];

    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final p = board[r][c];
        if (p != null && p.color == PieceColor.black) aiPieces.add(p);
      }
    }

    if (aiPieces.isEmpty) {
      return AiMoveResult();
    }

    final aggressiveness = (level * 0.12 + 0.3).clamp(0.0, 0.95);
    final randomFactor = (60 - level * 8).clamp(5, 60).toDouble();
    final useLookahead = level >= 3;
    final prioritizeKingAttack = level >= 5;

    // Evaluate powers
    final powerAction = _evaluateAiPowers(aiPieces, board, state, level, aggressiveness);

    // Evaluate normal moves
    Piece? bestPiece;
    ChessMove? bestMove;
    double bestScore = double.negativeInfinity;

    for (final piece in aiPieces) {
      final moves = MoveGenerator.getLegalMoves(piece, board, state);
      for (final move in moves) {
        double moveScore = 0;
        final target = board[move.row][move.col];

        // Capture evaluation
        if (target != null) {
          if (state.isShielded(target)) {
            moveScore -= 100;
          } else {
            moveScore += target.type.value * 100 * (1 + aggressiveness);
            if (target.type == PieceType.king) moveScore += 50000;
          }
        }

        // Positional scoring
        final centerDist = (move.row - 3.5).abs() + (move.col - 3.5).abs();
        moveScore += (7 - centerDist) * (2 + level * 0.5);

        // Pawn advancement
        if (piece.type == PieceType.pawn) {
          moveScore += (move.row - piece.row) * (5 + level * 2);
          if (move.row >= 5) moveScore += (move.row - 4) * 15 * aggressiveness;
        }

        // King hunting (level 5+)
        if (prioritizeKingAttack) {
          final playerKing = state.findKing(PieceColor.white);
          if (playerKing != null) {
            final distToKing = (move.row - playerKing.row).abs() + (move.col - playerKing.col).abs();
            moveScore += (14 - distToKing) * (3 + level);
          }
        }

        // Piece development
        if (piece.row == 0 && piece.type != PieceType.pawn) {
          moveScore += 8 * aggressiveness;
        }
        if (piece.type == PieceType.knight || piece.type == PieceType.bishop) {
          moveScore += (7 - centerDist) * (1 + level * 0.3);
        }

        // Safety (level 2+)
        if (level >= 2) {
          if (MoveGenerator.isSquareAttacked(move.row, move.col, PieceColor.white, board)) {
            moveScore -= piece.type.value * 30 * aggressiveness;
          }
          if (MoveGenerator.isSquareAttacked(piece.row, piece.col, PieceColor.white, board)) {
            moveScore += piece.type.value * 20;
          }
        }

        // Check bonus (level 3+)
        if (level >= 3) {
          final simBoard = MoveGenerator.simulateMove(piece, move.row, move.col, board, move: move);
          if (MoveGenerator.isInCheck(PieceColor.white, simBoard)) {
            moveScore += 80 + level * 10;
          }
        }

        // Lookahead (level 4+)
        if (useLookahead && level >= 4) {
          final simBoard = MoveGenerator.simulateMove(piece, move.row, move.col, board, move: move);
          double worstLoss = 0;
          for (int pr = 0; pr < 8; pr++) {
            for (int pc = 0; pc < 8; pc++) {
              final pp = simBoard[pr][pc];
              if (pp != null && pp.color == PieceColor.white) {
                final pMoves = MoveGenerator.getAttackMoves(pp, simBoard);
                for (final pm in pMoves) {
                  if (pm.row == move.row && pm.col == move.col) {
                    worstLoss = max(worstLoss, piece.type.value * 50.0);
                  }
                }
              }
            }
          }
          moveScore -= worstLoss;
        }

        // Coordination (level 6+)
        if (level >= 6) {
          for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
              if (dr == 0 && dc == 0) continue;
              final nr = move.row + dr, nc = move.col + dc;
              if (MoveGenerator.inBounds(nr, nc) && board[nr][nc] != null && board[nr][nc]!.color == PieceColor.black) {
                moveScore += 5;
              }
            }
          }
        }

        // Randomness
        moveScore += _random.nextDouble() * randomFactor;

        if (moveScore > bestScore) {
          bestScore = moveScore;
          bestPiece = piece;
          bestMove = move;
        }
      }
    }

    // Compare power vs normal move
    if (powerAction != null && powerAction.score > bestScore && level >= 2) {
      return AiMoveResult(power: powerAction, usePower: true);
    }

    if (bestPiece != null && bestMove != null) {
      return AiMoveResult(piece: bestPiece, move: bestMove);
    }

    // Fallback to power if no moves
    if (powerAction != null && level >= 2) {
      return AiMoveResult(power: powerAction, usePower: true);
    }

    return AiMoveResult();
  }

  static AiPowerAction? _evaluateAiPowers(
    List<Piece> aiPieces,
    List<List<Piece?>> board,
    GameState state,
    int level,
    double aggressiveness,
  ) {
    final mana = state.aiMana;
    if (mana < 2 || level < 2) return null;

    final powerChance = (0.3 + level * 0.1).clamp(0.0, 0.9);
    if (_random.nextDouble() > powerChance) return null;

    AiPowerAction? best;
    double bestScore = 0;

    // Shadow Jump (Knight, 2 mana)
    if (mana >= 2) {
      final knights = aiPieces.where((p) => p.type == PieceType.knight).toList();
      final playerKing = state.findKing(PieceColor.white);
      if (playerKing != null) {
        for (final knight in knights) {
          for (int dr = -2; dr <= 2; dr++) {
            for (int dc = -2; dc <= 2; dc++) {
              final r = playerKing.row + dr, c = playerKing.col + dc;
              if (!MoveGenerator.inBounds(r, c) || board[r][c] != null) continue;
              double score = 150 * aggressiveness;
              final dist = dr.abs() + dc.abs();
              score += (4 - dist) * 20;
              if (MoveGenerator.isSquareAttacked(r, c, PieceColor.white, board)) {
                score -= 80;
              }
              if (score > bestScore) {
                bestScore = score;
                best = AiPowerAction(type: PowerType.shadowJump, piece: knight, target: ChessMove(row: r, col: c), score: score);
              }
            }
          }
        }
      }
    }

    // Thunder Strike (Rook, 3 mana)
    if (mana >= 3) {
      final rooks = aiPieces.where((p) => p.type == PieceType.rook).toList();
      for (final rook in rooks) {
        for (int dr = -1; dr <= 1; dr++) {
          for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) continue;
            final r = rook.row + dr, c = rook.col + dc;
            if (!MoveGenerator.inBounds(r, c)) continue;
            final target = board[r][c];
            if (target != null && target.color == PieceColor.white && !state.isShielded(target)) {
              double score = target.type.value * 120.0;
              if (target.type == PieceType.king) score += 50000;
              if (target.type == PieceType.queen) score += 200;
              if (score > bestScore) {
                bestScore = score;
                best = AiPowerAction(type: PowerType.thunderStrike, piece: rook, target: ChessMove(row: r, col: c), score: score);
              }
            }
          }
        }
      }
    }

    // Sacred Shield (King, 3 mana)
    if (mana >= 3) {
      final king = state.findKing(PieceColor.black);
      if (king != null && MoveGenerator.isSquareAttacked(king.row, king.col, PieceColor.white, board)) {
        double score = 500 * aggressiveness;
        if (score > bestScore) {
          bestScore = score;
          best = AiPowerAction(type: PowerType.sacredShield, piece: king, score: score);
        }
      }
    }

    // Defense Shout (King, 4 mana)
    if (mana >= 4) {
      final king = state.findKing(PieceColor.black);
      if (king != null) {
        int threatened = 0;
        for (final p in aiPieces) {
          if (p.type == PieceType.pawn && MoveGenerator.isSquareAttacked(p.row, p.col, PieceColor.white, board)) {
            threatened++;
          }
        }
        if (threatened >= 2) {
          double score = threatened * 80 * aggressiveness;
          if (score > bestScore) {
            bestScore = score;
            best = AiPowerAction(type: PowerType.defenseShout, piece: king, score: score);
          }
        }
      }
    }

    // Fireball (Queen, 4 mana)
    if (mana >= 4) {
      final queens = aiPieces.where((p) => p.type == PieceType.queen).toList();
      for (final queen in queens) {
        for (final dir in [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          double lineScore = 0;
          bool hitsKing = false;
          for (int i = 1; i <= 3; i++) {
            final r = queen.row + dir[0] * i, c = queen.col + dir[1] * i;
            if (!MoveGenerator._inBounds(r, c)) break;
            final target = board[r][c];
            if (target != null) {
              if (target.color == PieceColor.white) {
                lineScore += target.type.value * 100;
                if (target.type == PieceType.king) hitsKing = true;
              } else {
                lineScore -= target.type.value * 80;
              }
            }
          }
          if (hitsKing) lineScore += 50000;
          if (lineScore > bestScore) {
            bestScore = lineScore;
            best = AiPowerAction(type: PowerType.fireball, piece: queen, dir: {'dr': dir[0], 'dc': dir[1]}, score: lineScore);
          }
        }
      }
    }

    // Spectral Dash (Bishop, 2 mana)
    if (mana >= 2) {
      final bishops = aiPieces.where((p) => p.type == PieceType.bishop).toList();
      final playerKing = state.findKing(PieceColor.white);
      for (final bishop in bishops) {
        for (final dir in [[-1,-1],[-1,1],[1,-1],[1,1]]) {
          for (int i = 1; i < 8; i++) {
            final r = bishop.row + dir[0] * i, c = bishop.col + dir[1] * i;
            if (!MoveGenerator._inBounds(r, c)) break;
            if (board[r][c] != null) continue;
            double score = 0;
            if (playerKing != null) {
              final dist = (r - playerKing.row).abs() + (c - playerKing.col).abs();
              score = (14 - dist) * 10 * aggressiveness;
            }
            if (!MoveGenerator.isSquareAttacked(r, c, PieceColor.white, board)) {
              score += 30;
            }
            if (score > bestScore) {
              bestScore = score;
              best = AiPowerAction(type: PowerType.spectralDash, piece: bishop, target: ChessMove(row: r, col: c), score: score);
            }
          }
        }
      }
    }

    return best;
  }
}
