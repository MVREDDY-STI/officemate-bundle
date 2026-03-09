import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'services/app_config.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Load persistent config before the app renders
  await AppConfig.init();

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  runApp(const OfficeMateApp());
}
