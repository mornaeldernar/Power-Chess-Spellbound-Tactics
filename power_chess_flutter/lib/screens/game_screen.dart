import 'package:flutter/material.dart';
import '../logic/game_controller.dart';
import '../models/enums.dart';
import '../widgets/board_painter.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});
  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  final GameController _ctrl = GameController();

  @override
  void initState() {
    super.initState();
    _ctrl.addListener(_onStateChange);
  }

  void _onStateChange() => setState(() {});

  @override
  void dispose() {
    _ctrl.removeListener(_onStateChange);
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final boardSize = constraints.maxWidth < constraints.maxHeight * 0.6
                ? constraints.maxWidth
                : constraints.maxHeight * 0.55;
            final tileSize = boardSize / 8;

            return Column(
              children: [
                _buildHeader(),
                _buildManaBar(),
                _buildBoard(boardSize, tileSize),
                Expanded(child: _buildPowersPanel()),
                if (state.phase != GamePhase.playing) _buildOverlay(),
              ],
            );
          },
        ),
      ),
    );
  }

  GameState get state => _ctrl.state;

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('⚔ Power Chess', style: TextStyle(fontSize: 16, color: Color(0xFFA78BFA), fontWeight: FontWeight.bold)),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              border: Border.all(color: state.currentTurn == PieceColor.white ? Color(0xFF6D28D9) : Color(0xFFDC2626)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              state.currentTurn == PieceColor.white ? 'Tu turno' : 'IA piensa...',
              style: TextStyle(fontSize: 12, color: Color(0xFFC4B5FD)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildManaBar() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Color(0xFF0F0A28).withOpacity(0.85),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Color(0xFF4C1D95)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _statChip('✦', '${state.mana}', Color(0xFF60A5FA)),
          _statChip('☠', '${state.aiMana}', Color(0xFFF87171)),
          _statChip('Nv', '${state.level}', Color(0xFFA78BFA)),
          _statChip('Pts', '${state.score}', Color(0xFFFBBF24)),
          _statChip('Hi', '${state.highScore}', Color(0xFF6B7280)),
        ],
      ),
    );
  }

  Widget _statChip(String label, String value, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(label, style: TextStyle(fontSize: 10, color: color.withOpacity(0.7))),
        Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  Widget _buildBoard(double boardSize, double tileSize) {
    return GestureDetector(
      onTapDown: (details) {
        final col = (details.localPosition.dx / tileSize).floor().clamp(0, 7);
        final row = (details.localPosition.dy / tileSize).floor().clamp(0, 7);
        _ctrl.onTileTap(row, col);
      },
      child: Container(
        width: boardSize,
        height: boardSize,
        margin: EdgeInsets.symmetric(vertical: 4),
        decoration: BoxDecoration(
          border: Border.all(color: Color(0xFF6D28D9), width: 2),
          borderRadius: BorderRadius.circular(4),
          boxShadow: [BoxShadow(color: Color(0xFF6D28D9).withOpacity(0.3), blurRadius: 20)],
        ),
        child: CustomPaint(
          painter: BoardPainter(state: state, tileSize: tileSize),
          size: Size(boardSize, boardSize),
        ),
      ),
    );
  }

  Widget _buildPowersPanel() {
    final powers = _ctrl.availablePowers;
    final allPowers = PowerType.values;

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('⚡ Hechizos', style: TextStyle(fontSize: 13, color: Color(0xFFA78BFA), fontWeight: FontWeight.bold)),
          SizedBox(height: 4),
          Expanded(
            child: ListView(
              children: [
                // Enabled powers first
                ...powers.map((p) => _powerButton(p, enabled: true)),
                // Disabled powers
                ...allPowers.where((p) => !powers.contains(p)).map((p) => _powerButton(p, enabled: false)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _powerButton(PowerType power, {required bool enabled}) {
    final isActive = state.activePower == power;
    return GestureDetector(
      onTap: enabled ? () => _ctrl.activatePower(power) : null,
      child: Container(
        margin: EdgeInsets.only(bottom: 6),
        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? Color(0xFF7C3AED).withOpacity(0.3) : Color(0xFF1E143C).withOpacity(enabled ? 0.8 : 0.3),
          border: Border.all(color: isActive ? Color(0xFF7C3AED) : Color(0xFF4C1D95).withOpacity(enabled ? 1 : 0.4)),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          children: [
            Text(power.icon, style: TextStyle(fontSize: 18)),
            SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(power.displayName, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: enabled ? Color(0xFFC4B5FD) : Color(0xFF6B7280))),
                  if (isActive) Text(power.description, style: TextStyle(fontSize: 10, color: Color(0xFF9CA3AF))),
                ],
              ),
            ),
            Text('${power.manaCost}✦', style: TextStyle(fontSize: 11, color: enabled ? Color(0xFF60A5FA) : Color(0xFF4B5563))),
          ],
        ),
      ),
    );
  }

  Widget _buildOverlay() {
    switch (state.phase) {
      case GamePhase.gameOver:
        return _modal('💀 Game Over', 'Nivel: ${state.level}\nPuntuación: ${state.score}', 'Reintentar', _ctrl.restart);
      case GamePhase.levelUp:
        return _modal('🌟 Nivel Completado!', 'Pasas al nivel ${state.level + 1}', 'Siguiente', _ctrl.nextLevel);
      case GamePhase.draw:
        return _modal('⚖ Empate', 'Nivel: ${state.level}\nPuntuación: ${state.score}', 'Reintentar', _ctrl.restart);
      case GamePhase.promoting:
        return _promotionDialog();
      default:
        return SizedBox.shrink();
    }
  }

  Widget _modal(String title, String body, String btnText, VoidCallback onTap) {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.8),
        child: Center(
          child: Container(
            padding: EdgeInsets.all(24),
            margin: EdgeInsets.all(32),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFF1A0A2E), Color(0xFF0A1A2E)]),
              border: Border.all(color: Color(0xFF6D28D9), width: 2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title, style: TextStyle(fontSize: 22, color: Color(0xFFA78BFA), fontWeight: FontWeight.bold)),
                SizedBox(height: 12),
                Text(body, style: TextStyle(color: Color(0xFFC4B5FD)), textAlign: TextAlign.center),
                SizedBox(height: 20),
                ElevatedButton(
                  onPressed: onTap,
                  style: ElevatedButton.styleFrom(backgroundColor: Color(0xFF6D28D9), padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
                  child: Text(btnText, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _promotionDialog() {
    final types = [PieceType.queen, PieceType.rook, PieceType.bishop, PieceType.knight];
    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.85),
        child: Center(
          child: Container(
            padding: EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Color(0xFF1A0A2E),
              border: Border.all(color: Color(0xFFFBBF24), width: 2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('♛ Coronación', style: TextStyle(fontSize: 18, color: Color(0xFFFBBF24), fontWeight: FontWeight.bold)),
                SizedBox(height: 16),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: types.map((t) => GestureDetector(
                    onTap: () => _ctrl.promotePawn(t),
                    child: Container(
                      margin: EdgeInsets.symmetric(horizontal: 6),
                      padding: EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Color(0xFF2D1B4E),
                        border: Border.all(color: Color(0xFF4C1D95)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(t.symbol(PieceColor.white), style: TextStyle(fontSize: 32)),
                    ),
                  )).toList(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
