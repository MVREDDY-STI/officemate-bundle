import 'dart:html' as html;
import 'package:flutter/material.dart';
import 'dart:ui_web' as ui_web;

bool _registered = false;

Widget buildPlatformBg() {
  const id = 'bg-svg-view';
  
  if (!_registered) {
    ui_web.platformViewRegistry.registerViewFactory(id, (int viewId) {
      final img = html.ImageElement()
        ..src = 'assets/assets/images/bg.svg'
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.objectFit = 'cover'
        ..style.objectPosition = 'bottom right'
        ..style.border = 'none';
      return img;
    });
    _registered = true;
  }
  
  return const HtmlElementView(viewType: id);
}
