import 'enums.dart';

class Shield {
  int row;
  int col;
  final PieceColor color;
  int turnsLeft;

  Shield({
    required this.row,
    required this.col,
    required this.color,
    this.turnsLeft = 1,
  });
}
