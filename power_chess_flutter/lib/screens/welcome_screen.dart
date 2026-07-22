import 'package:flutter/material.dart';
import 'game_screen.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});
  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeIn;
  late Animation<double> _scaleTitle;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _fadeIn = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );
    _scaleTitle = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _startGame() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => const GameScreen(),
        transitionsBuilder: (_, anim, __, child) =>
            FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 500),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0A0A1A), Color(0xFF1A0A2E), Color(0xFF0A1A2E)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, child) => Opacity(
                opacity: _fadeIn.value,
                child: child,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ScaleTransition(
                    scale: _scaleTitle,
                    child: const Text(
                      '♔',
                      style: TextStyle(fontSize: 80),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [Color(0xFFA78BFA), Color(0xFF60A5FA)],
                    ).createShader(bounds),
                    child: const Text(
                      'Power Chess',
                      style: TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Spellbound Tactics',
                    style: TextStyle(
                      fontSize: 16,
                      color: Color(0xFFC4B5FD),
                      letterSpacing: 3,
                    ),
                  ),
                  const SizedBox(height: 48),
                  _buildFeatureRow('⚡', 'Poderes mágicos'),
                  const SizedBox(height: 12),
                  _buildFeatureRow('🧠', 'IA progresiva'),
                  const SizedBox(height: 12),
                  _buildFeatureRow('♟', 'Ajedrez completo'),
                  const SizedBox(height: 48),
                  _buildPlayButton(),
                  const SizedBox(height: 24),
                  const Text(
                    'Hackathon Kiro / Código Facilito',
                    style: TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureRow(String icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(icon, style: const TextStyle(fontSize: 20)),
        const SizedBox(width: 10),
        Text(text, style: const TextStyle(fontSize: 14, color: Color(0xFF9CA3AF))),
      ],
    );
  }

  Widget _buildPlayButton() {
    return GestureDetector(
      onTap: _startGame,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF6D28D9), Color(0xFF4C1D95)],
          ),
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF7C3AED).withOpacity(0.4),
              blurRadius: 20,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Text(
          '⚔  JUGAR',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            letterSpacing: 2,
          ),
        ),
      ),
    );
  }
}
