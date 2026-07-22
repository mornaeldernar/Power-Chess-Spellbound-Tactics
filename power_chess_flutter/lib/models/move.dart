class ChessMove {
  final int row;
  final int col;
  final bool enPassant;
  final String? castling; // 'kingside' or 'queenside'

  const ChessMove({
    required this.row,
    required this.col,
    this.enPassant = false,
    this.castling,
  });

  @override
  bool operator ==(Object other) =>
      other is ChessMove && row == other.row && col == other.col;

  @override
  int get hashCode => row.hashCode ^ col.hashCode;
}
