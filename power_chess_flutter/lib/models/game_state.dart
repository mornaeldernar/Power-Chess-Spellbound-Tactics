import 'enums.dart';
import 'piece.dart';
import 'shield.dart';
import 'move.dart';

class EnPassantTarget {
  final int row;
  final int col;
  final PieceColor color;

  const EnPassantTarget({
    required this.row,
    required this.col,
    required this.color,
  });
}

class GameState {
  List<List<Piece?>> board;
  PieceColor currentTurn;
  Piece? selectedPiece;
  List<ChessMove> validMoves;
  int mana;
  int aiMana;
  int score;
  int highScore;
  int level;
  List<Piece> playerCaptured;
  List<Piece> aiCaptured;
  List<Shield> shieldedPieces;
  PowerType? activePower;
  List<ChessMove> powerTargets;
  GamePhase phase;
  bool aiThinking;
  bool inCheck;
  Piece? promotingPawn;
  EnPassantTarget? enPassantTarget;
  bool skipNextTurn;
  List<String> positionHistory;
  List<String> actionLog;

  GameState({
    List<List<Piece?>>? board,
    this.currentTurn = PieceColor.white,
    this.selectedPiece,
    List<ChessMove>? validMoves,
    this.mana = 0,
    this.aiMana = 0,
    this.score = 0,
    this.highScore = 0,
    this.level = 1,
    List<Piece>? playerCaptured,
    List<Piece>? aiCaptured,
    List<Shield>? shieldedPieces,
    this.activePower,
    List<ChessMove>? powerTargets,
    this.phase = GamePhase.playing,
    this.aiThinking = false,
    this.inCheck = false,
    this.promotingPawn,
    this.enPassantTarget,
    this.skipNextTurn = false,
    List<String>? positionHistory,
    List<String>? actionLog,
  })  : board = board ?? _initBoard(),
        validMoves = validMoves ?? [],
        playerCaptured = playerCaptured ?? [],
        aiCaptured = aiCaptured ?? [],
        shieldedPieces = shieldedPieces ?? [],
        powerTargets = powerTargets ?? [],
        positionHistory = positionHistory ?? [],
        actionLog = actionLog ?? [];

  static List<List<Piece?>> _initBoard() {
    final board = List.generate(8, (_) => List<Piece?>.filled(8, null));
    const backRow = [
      PieceType.rook, PieceType.knight, PieceType.bishop, PieceType.queen,
      PieceType.king, PieceType.bishop, PieceType.knight, PieceType.rook,
    ];

    for (int c = 0; c < 8; c++) {
      board[0][c] = Piece(type: backRow[c], color: PieceColor.black, row: 0, col: c);
      board[1][c] = Piece(type: PieceType.pawn, color: PieceColor.black, row: 1, col: c);
      board[7][c] = Piece(type: backRow[c], color: PieceColor.white, row: 7, col: c);
      board[6][c] = Piece(type: PieceType.pawn, color: PieceColor.white, row: 6, col: c);
    }
    return board;
  }

  void reset({bool keepScore = false}) {
    board = _initBoard();
    currentTurn = PieceColor.white;
    selectedPiece = null;
    validMoves = [];
    shieldedPieces = [];
    activePower = null;
    powerTargets = [];
    phase = GamePhase.playing;
    aiThinking = false;
    inCheck = false;
    promotingPawn = null;
    enPassantTarget = null;
    skipNextTurn = false;
    positionHistory = [];
    aiCaptured = [];

    if (!keepScore) {
      mana = 0;
      aiMana = 0;
      score = 0;
      level = 1;
      playerCaptured = [];
      actionLog = [];
    } else {
      mana += 1;
      aiMana += 1;
    }
  }

  bool isInBounds(int r, int c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  Piece? pieceAt(int r, int c) => isInBounds(r, c) ? board[r][c] : null;

  bool isShielded(Piece piece) {
    return shieldedPieces.any(
      (s) => s.row == piece.row && s.col == piece.col && s.color == piece.color,
    );
  }

  Piece? findKing(PieceColor color) {
    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final p = board[r][c];
        if (p != null && p.type == PieceType.king && p.color == color) return p;
      }
    }
    return null;
  }

  String getBoardHash() {
    final buf = StringBuffer(currentTurn == PieceColor.white ? 'w' : 'b');
    for (int r = 0; r < 8; r++) {
      for (int c = 0; c < 8; c++) {
        final p = board[r][c];
        if (p != null) {
          buf.write('${p.color.name[0]}${p.type.name[0]}$r$c');
        } else {
          buf.write('.');
        }
      }
    }
    return buf.toString();
  }

  void addLog(String message) {
    actionLog.insert(0, message);
    if (actionLog.length > 30) actionLog.removeLast();
  }
}
