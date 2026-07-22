import 'enums.dart';

class Piece {
  PieceType type;
  final PieceColor color;
  int row;
  int col;
  bool hasMoved;

  Piece({
    required this.type,
    required this.color,
    required this.row,
    required this.col,
    this.hasMoved = false,
  });

  Piece copy() {
    return Piece(
      type: type,
      color: color,
      row: row,
      col: col,
      hasMoved: hasMoved,
    );
  }

  String get symbol => type.symbol(color);

  @override
  String toString() => '${color.name} ${type.name} at ($row,$col)';
}
