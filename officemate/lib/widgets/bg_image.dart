import 'bg_native.dart' if (dart.library.html) 'bg_web.dart';
import 'package:flutter/material.dart';

class NativeOrWebBg extends StatelessWidget {
  const NativeOrWebBg({super.key});

  @override
  Widget build(BuildContext context) {
    return buildPlatformBg();
  }
}
