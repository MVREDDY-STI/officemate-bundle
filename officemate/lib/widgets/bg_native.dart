import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

Widget buildPlatformBg() {
  return SvgPicture.asset(
    'assets/images/bg.svg',
    fit: BoxFit.cover,
    alignment: Alignment.bottomRight,
  );
}
