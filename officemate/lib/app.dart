import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'services/app_config.dart';
import 'screens/home_screen.dart';
import 'screens/setup_screen.dart';

class OfficeMateApp extends StatelessWidget {
  const OfficeMateApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'OfficeMate',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: kSidebarBg),
        fontFamily: kFont,
        useMaterial3: true,
      ),
      // Route to setup if not configured, otherwise go home
      home: AppConfig.isConfigured ? const HomeScreen() : const SetupScreen(),
    );
  }
}
