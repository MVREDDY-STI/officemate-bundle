import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';

class OfficeMateApp extends StatelessWidget {
  const OfficeMateApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'OfficeMate',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: kSidebarBg),
        // Set Pretendard as the global default font
        fontFamily: kFont,
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
