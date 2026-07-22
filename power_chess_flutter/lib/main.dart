import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/welcome_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  runApp(const PowerChessApp());
}

class PowerChessApp extends StatelessWidget {
  const PowerChessApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Power Chess: Spellbound Tactics',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0A0A1A),
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFF7C3AED),
          secondary: const Color(0xFF6D28D9),
          surface: const Color(0xFF1A0A2E),
        ),
        fontFamily: 'Roboto',
      ),
      home: const WelcomeScreen(),
    );
  }
}
