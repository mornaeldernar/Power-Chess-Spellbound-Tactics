import '../models/enums.dart';
import '../models/piece.dart';
import '../models/move.dart';
import '../models/game_state.dart';

class MoveGenerator {
  static bool _inBounds(int r, int c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  /// Public accessor for bounds check
  static bool inBounds(int r, int c) => _inBounds(r, c);

  /// Get raw valid moves for a piece (no check filtering, includes castling)
  static List<ChessMove> getValidMoves(Piece piece, List<List<Piece?>> board, GameState state) {
    final moves = <ChessMove>[];
    final color = piece.color;
    final enemy = color == PieceColor.white ? PieceColor.black : PieceColor.white;
    final row = piece.row;
    final col = piece.col;

    void addMove(int r, int c) {
      if (!_inBounds(r, c)) return;
      final target = board[r][c];
      if (target == null) {
        moves.add(ChessMove(row: r, col: c));
      } else if (target.color == enemy) {
        moves.add(ChessMove(row: r, col: c));
      }
    }

    void addSlide(int dr, int dc) {
      for (int i = 1; i < 8; i++) {
        final r = row + dr * i, c = col + dc * i;
        if (!_inBounds(r, c)) break;
        final target = board[r][c];
        if (target == null) {
          moves.add(ChessMove(row: r, col: c));
        } else {
          if (target.color == enemy) moves.add(ChessMove(row: r, col: c));
          break;
        }
      }
    }

    switch (piece.type) {
      case PieceType.pawn:
        final dir = color == PieceColor.white ? -1 : 1;
        final startRow = color == PieceColor.white ? 6 : 1;
        // Forward
        if (_inBounds(row + dir, col) && board[row + dir][col] == null) {
          moves.add(ChessMove(row: row + dir, col: col));
          if (row == startRow && board[row + 2 * dir][col] == null) {
            moves.add(ChessMove(row: row + 2 * dir, col: col));
          }
        }
        // Captures
        for (final dc in [-1, 1]) {
          final r = row + dir, c = col + dc;
          if (_inBounds(r, c) && board[r][c] != null && board[r][c]!.color == enemy) {
            moves.add(ChessMove(row: r, col: c));
          }
        }
        // En passant
        if (state.enPassantTarget != null) {
          final ep = state.enPassantTarget!;
          for (final dc in [-1, 1]) {
            final r = row + dir, c = col + dc;
            if (r == ep.row && c == ep.col) {
              moves.add(ChessMove(row: r, col: c, enPassant: true));
            }
          }
        }
        break;

      case PieceType.knight:
        for (final d in [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
          addMove(row + d[0], col + d[1]);
        }
        break;

      case PieceType.bishop:
        addSlide(-1, -1); addSlide(-1, 1); addSlide(1, -1); addSlide(1, 1);
        break;

      case PieceType.rook:
        addSlide(-1, 0); addSlide(1, 0); addSlide(0, -1); addSlide(0, 1);
        break;

      case PieceType.queen:
        addSlide(-1, -1); addSlide(-1, 1); addSlide(1, -1); addSlide(1, 1);
        addSlide(-1, 0); addSlide(1, 0); addSlide(0, -1); addSlide(0, 1);
        break;

      case PieceType.king:
        for (int dr = -1; dr <= 1; dr++) {
          for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) continue;
            addMove(row + dr, col + dc);
          }
        }
        // Castling
        if (!piece.hasMoved && !isSquareAttacked(row, col, enemy, board)) {
          // King-side
          final rookKS = board[row][7];
          if (rookKS != null && rookKS.type == PieceType.rook && rookKS.color == color && !rookKS.hasMoved) {
            if (board[row][5] == null && board[row][6] == null) {
              if (!isSquareAttacked(row, 5, enemy, board) && !isSquareAttacked(row, 6, enemy, board)) {
                moves.add(ChessMove(row: row, col: 6, castling: 'kingside'));
              }
            }
          }
          // Queen-side
          final rookQS = board[row][0];
          if (rookQS != null && rookQS.type == PieceType.rook && rookQS.color == color && !rookQS.hasMoved) {
            if (board[row][1] == null && board[row][2] == null && board[row][3] == null) {
              if (!isSquareAttacked(row, 2, enemy, board) && !isSquareAttacked(row, 3, enemy, board)) {
                moves.add(ChessMove(row: row, col: 2, castling: 'queenside'));
              }
            }
          }
        }
        break;
    }

    return moves;
  }

  /// Get attack squares for a piece (for check detection - no castling, pawns attack diagonally always)
  static List<ChessMove> getAttackMoves(Piece piece, List<List<Piece?>> board) {
    final moves = <ChessMove>[];
    final color = piece.color;
    final enemy = color == PieceColor.white ? PieceColor.black : PieceColor.white;
    final row = piece.row;
    final col = piece.col;

    if (piece.type == PieceType.pawn) {
      final dir = color == PieceColor.white ? -1 : 1;
      for (final dc in [-1, 1]) {
        final r = row + dir, c = col + dc;
        if (_inBounds(r, c)) moves.add(ChessMove(row: r, col: c));
      }
      return moves;
    }

    void addMove(int r, int c) {
      if (!_inBounds(r, c)) return;
      final target = board[r][c];
      if (target == null || target.color == enemy) {
        moves.add(ChessMove(row: r, col: c));
      }
    }

    void addSlide(int dr, int dc) {
      for (int i = 1; i < 8; i++) {
        final r = row + dr * i, c = col + dc * i;
        if (!_inBounds(r, c)) break;
        final target = board[r][c];
        if (target == null) {
          moves.add(ChessMove(row: r, col: c));
        } else {
          if (target.color == enemy) moves.add(ChessMove(row: r, col: c));
          break;
        }
      }
    }

    switch (piece.type) {
      case PieceType.knight:
        for (final d in [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
          addMove(row + d[0], col + d[1]);
        }
        break;
      case PieceType.bishop:
        addSlide(-1, -1); addSlide(-1, 1); addSlide(1, -1); addSlide(1, 1);
        break;
      case PieceType.rook:
        addSlide(-1, 0); addSlide(1, 0); addSlide(0, -1); addSlide(0, 1);
        break;
      case PieceType.queen:
        addSlide(-1, -1); addSlide(-1, 1); addSlide(1, -1); addSlide(1, 1);
        addSlide(-1, 0); addSlide(1, 0); addSlide(0, -1); addSlide(0, 1);
        break;
      case PieceType.king:
        for (int dr = -1; dr <= 1; dr++) {
          for (int dc = -1; dc <= 1; dc++) {
            if (dr == 0 && dc == 0) continue;
            addMove(row + dr, col + dc);
          }
        }
        break;
      default:
        break;
    }

    return moves;
  }

  /// Check if a square is attacked by a given color
  static bool isSquareAttacked(int row, int col, PieceColor byColor, List<List<Piece?>> board) {
    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final p = board[r][c];
        if (p == null || p.color != byColor) continue;
        final attacks = getAttackMoves(p, board);
        if (attacks.any((m) => m.row == row && m.col == col)) return true;
      }
    }
    return false;
  }

  /// Check if a color's king is in check
  static bool isInCheck(PieceColor color, List<List<Piece?>> board) {
    Piece? king;
    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final p = board[r][c];
        if (p != null && p.type == PieceType.king && p.color == color) {
          king = p;
          break;
        }
      }
      if (king != null) break;
    }
    if (king == null) return false;
    final enemy = color == PieceColor.white ? PieceColor.black : PieceColor.white;
    return isSquareAttacked(king.row, king.col, enemy, board);
  }

  /// Simulate a move on a board copy
  static List<List<Piece?>> simulateMove(Piece piece, int toRow, int toCol, List<List<Piece?>> board, {ChessMove? move}) {
    final newBoard = List.generate(8, (r) => List<Piece?>.generate(8, (c) => board[r][c]));
    newBoard[piece.row][piece.col] = null;
    final movedPiece = piece.copy()..row = toRow..col = toCol;
    newBoard[toRow][toCol] = movedPiece;

    // En passant
    if (move != null && move.enPassant && piece.type == PieceType.pawn) {
      final capturedRow = piece.color == PieceColor.white ? toRow + 1 : toRow - 1;
      newBoard[capturedRow][toCol] = null;
    }

    // Castling
    if (move != null && move.castling != null && piece.type == PieceType.king) {
      if (move.castling == 'kingside') {
        final rook = newBoard[piece.row][7];
        newBoard[piece.row][7] = null;
        if (rook != null) {
          newBoard[piece.row][5] = rook.copy()..col = 5;
        }
      } else if (move.castling == 'queenside') {
        final rook = newBoard[piece.row][0];
        newBoard[piece.row][0] = null;
        if (rook != null) {
          newBoard[piece.row][3] = rook.copy()..col = 3;
        }
      }
    }

    return newBoard;
  }

  /// Get legal moves (filtered by check)
  static List<ChessMove> getLegalMoves(Piece piece, List<List<Piece?>> board, GameState state) {
    final raw = getValidMoves(piece, board, state);
    return raw.where((move) {
      final simBoard = simulateMove(piece, move.row, move.col, board, move: move);
      return !isInCheck(piece.color, simBoard);
    }).toList();
  }

  /// Check if a color is in checkmate
  static bool isCheckmate(PieceColor color, List<List<Piece?>> board, GameState state) {
    if (!isInCheck(color, board)) return false;
    return hasNoLegalMoves(color, board, state);
  }

  /// Check if a color is in stalemate
  static bool isStalemate(PieceColor color, List<List<Piece?>> board, GameState state) {
    if (isInCheck(color, board)) return false;
    return hasNoLegalMoves(color, board, state);
  }

  /// Check if a color has no legal moves
  static bool hasNoLegalMoves(PieceColor color, List<List<Piece?>> board, GameState state) {
    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final p = board[r][c];
        if (p != null && p.color == color) {
          final legal = getLegalMoves(p, board, state);
          if (legal.isNotEmpty) return false;
        }
      }
    }
    return true;
  }

  /// Check for insufficient material
  static bool isInsufficientMaterial(List<List<Piece?>> board) {
    final white = <PieceType>[];
    final black = <PieceType>[];

    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final p = board[r][c];
        if (p == null) continue;
        if (p.type != PieceType.king) {
          if (p.color == PieceColor.white) white.add(p.type);
          else black.add(p.type);
        }
      }
    }

    // King vs King
    if (white.isEmpty && black.isEmpty) return true;
    // King + Bishop vs King
    if (white.length == 1 && white[0] == PieceType.bishop && black.isEmpty) return true;
    if (black.length == 1 && black[0] == PieceType.bishop && white.isEmpty) return true;
    // King + Knight vs King
    if (white.length == 1 && white[0] == PieceType.knight && black.isEmpty) return true;
    if (black.length == 1 && black[0] == PieceType.knight && white.isEmpty) return true;

    return false;
  }

  /// Check for threefold repetition
  static bool isThreefoldRepetition(GameState state) {
    final current = state.getBoardHash();
    int count = 0;
    for (final pos in state.positionHistory) {
      if (pos == current) count++;
      if (count >= 3) return true;
    }
    return false;
  }
}
