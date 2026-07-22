import 'package:flutter/material.dart';
import '../models/enums.dart';
import '../models/piece.dart';
import '../models/move.dart';
import '../models/game_state.dart';
import '../logic/move_generator.dart';

class BoardPainter extends CustomPainter {
  final GameState state;
  final double tileSize;

  BoardPainter({required this.state, required this.tileSize});

  @override
  void paint(Canvas canvas, Size size) {
    _drawTiles(canvas);
    _drawSelectedHighlight(canvas);
    _drawValidMoves(canvas);
    _drawCheckIndicator(canvas);
    _drawShields(canvas);
    _drawPieces(canvas);
    _drawCoordinates(canvas, size);
  }

  void _drawTiles(Canvas canvas) {
    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final isLight = (r + c) % 2 == 0;
        final paint = Paint()
          ..color = isLight ? const Color(0xFF2D1B4E) : const Color(0xFF1A0F2E);
        canvas.drawRect(
          Rect.fromLTWH(c * tileSize, r * tileSize, tileSize, tileSize),
          paint,
        );
      }
    }
  }

  void _drawSelectedHighlight(Canvas canvas) {
    final piece = state.selectedPiece;
    if (piece == null) return;
    final paint = Paint()..color = const Color(0xFF7C3AED).withOpacity(0.4);
    canvas.drawRect(
      Rect.fromLTWH(piece.col * tileSize, piece.row * tileSize, tileSize, tileSize),
      paint,
    );
  }

  void _drawValidMoves(Canvas canvas) {
    for (final move in state.validMoves) {
      final target = state.board[move.row][move.col];

      if (state.activePower == PowerType.thunderStrike) {
        final paint = Paint()..color = const Color(0xFFEF4444).withOpacity(0.5);
        canvas.drawRect(
          Rect.fromLTWH(move.col * tileSize, move.row * tileSize, tileSize, tileSize),
          paint,
        );
      } else if (move.castling != null) {
        final paint = Paint()..color = const Color(0xFF22D3EE).withOpacity(0.4);
        canvas.drawRect(
          Rect.fromLTWH(move.col * tileSize, move.row * tileSize, tileSize, tileSize),
          paint,
        );
      } else if (move.enPassant) {
        final paint = Paint()..color = const Color(0xFFFB923C).withOpacity(0.45);
        canvas.drawRect(
          Rect.fromLTWH(move.col * tileSize, move.row * tileSize, tileSize, tileSize),
          paint,
        );
      } else if (target != null) {
        final paint = Paint()..color = const Color(0xFFEF4444).withOpacity(0.35);
        canvas.drawRect(
          Rect.fromLTWH(move.col * tileSize, move.row * tileSize, tileSize, tileSize),
          paint,
        );
      } else {
        final paint = Paint()..color = const Color(0xFFA78BFA).withOpacity(0.5);
        canvas.drawCircle(
          Offset(move.col * tileSize + tileSize / 2, move.row * tileSize + tileSize / 2),
          tileSize * 0.14,
          paint,
        );
      }
    }
  }

  void _drawCheckIndicator(Canvas canvas) {
    // Player king in check
    if (state.inCheck && state.currentTurn == PieceColor.white) {
      final king = state.findKing(PieceColor.white);
      if (king != null) _drawCheckGlow(canvas, king);
    }
    // AI king in check
    if (MoveGenerator.isInCheck(PieceColor.black, state.board) && state.phase == GamePhase.playing) {
      final king = state.findKing(PieceColor.black);
      if (king != null) _drawCheckGlow(canvas, king);
    }
  }

  void _drawCheckGlow(Canvas canvas, Piece king) {
    final rect = Rect.fromLTWH(king.col * tileSize, king.row * tileSize, tileSize, tileSize);
    final fillPaint = Paint()..color = const Color(0xFFEF4444).withOpacity(0.45);
    canvas.drawRect(rect, fillPaint);
    final strokePaint = Paint()
      ..color = const Color(0xFFEF4444)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    canvas.drawRect(rect.deflate(2), strokePaint);
  }

  void _drawShields(Canvas canvas) {
    for (final shield in state.shieldedPieces) {
      final paint = Paint()
        ..color = const Color(0xFFFBBF24)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3;
      canvas.drawCircle(
        Offset(shield.col * tileSize + tileSize / 2, shield.row * tileSize + tileSize / 2),
        tileSize / 2 - 4,
        paint,
      );
    }
  }

  void _drawPieces(Canvas canvas) {
    final textStyle = TextStyle(
      fontSize: tileSize * 0.62,
      fontFamily: 'serif',
    );

    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final piece = state.board[r][c];
        if (piece == null) continue;

        final symbol = piece.symbol;
        final offset = Offset(c * tileSize + tileSize / 2, r * tileSize + tileSize / 2);

        // Shadow
        final shadowPainter = TextPainter(
          text: TextSpan(
            text: symbol,
            style: textStyle.copyWith(color: Colors.black.withOpacity(0.3)),
          ),
          textDirection: TextDirection.ltr,
        )..layout();
        shadowPainter.paint(
          canvas,
          Offset(offset.dx - shadowPainter.width / 2 + 2, offset.dy - shadowPainter.height / 2 + 2),
        );

        // Piece
        final color = piece.color == PieceColor.white
            ? const Color(0xFF93C5FD)
            : const Color(0xFFFCA5A5);
        final piecePainter = TextPainter(
          text: TextSpan(text: symbol, style: textStyle.copyWith(color: color)),
          textDirection: TextDirection.ltr,
        )..layout();
        piecePainter.paint(
          canvas,
          Offset(offset.dx - piecePainter.width / 2, offset.dy - piecePainter.height / 2),
        );
      }
    }
  }

  void _drawCoordinates(Canvas canvas, Size size) {
    final style = TextStyle(fontSize: 10, color: const Color(0xFF6B7280));
    for (int i = 0; i < 8; i++) {
      // File letters (a-h)
      final filePainter = TextPainter(
        text: TextSpan(text: String.fromCharCode(97 + i), style: style),
        textDirection: TextDirection.ltr,
      )..layout();
      filePainter.paint(canvas, Offset(i * tileSize + 4, size.height - 14));

      // Rank numbers (8-1)
      final rankPainter = TextPainter(
        text: TextSpan(text: '${8 - i}', style: style),
        textDirection: TextDirection.ltr,
      )..layout();
      rankPainter.paint(canvas, Offset(size.width - 12, i * tileSize + 4));
    }
  }

  @override
  bool shouldRepaint(covariant BoardPainter oldDelegate) => true;
}
