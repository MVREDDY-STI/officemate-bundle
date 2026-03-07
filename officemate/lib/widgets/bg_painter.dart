import 'dart:math';
import 'package:flutter/material.dart';

/// Replicates bg.svg using CustomPainter:
///  - white background
///  - two large soft circular blobs (bottom-left + top-right)
///  - organic wavy shape on the right
///  - office illustration image clipped top-right (via Image widget overlaid)
class BgPainter extends CustomPainter {
  const BgPainter();

  // bg.svg blob colour: #eef2f5 at opacity 0.471
  static const _blobColor = Color(0x78EEF2F5); // blended approximation

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // ── White base ───────────────────────────────────────────
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = const Color(0xFFFFFFFF),
    );

    final blobPaint = Paint()
      ..color = _blobColor
      ..style = PaintingStyle.fill;

    // ── Blob 1 (bottom-left area, large circle r≈1304 centred ~0,2223) ──
    // Original SVG: path centred at (1304,1304) translated to (0,919)
    // => effective centre: (1304, 1304+919) = (1304, 2223), radius 1304
    // Scaled from 1920×1080 viewbox → actual size
    final scaleX = w / 1920;
    final scaleY = h / 1080;
    final scale  = min(scaleX, scaleY);

    canvas.drawCircle(
      Offset(1304 * scaleX, (1304 + 919) * scaleY),
      1304 * scale,
      blobPaint,
    );

    // ── Blob 2 (top-right area, centred ~2755,-1254+1304=50) ──
    // translate(1451, -1254): centre = (1304+1451, 1304-1254) = (2755, 50)
    canvas.drawCircle(
      Offset(2755 * scaleX, 50 * scaleY),
      1304 * scale,
      blobPaint,
    );

    // ── Organic right-side wave shape (Path_69 from SVG) ─────
    // The original path is centred around x≈1142–1970, y≈560–870
    // We scale proportionally and draw a simplified organic blob
    final path = _buildWavePath(w, h, scaleX, scaleY);
    canvas.drawPath(path, blobPaint);
  }

  Path _buildWavePath(double w, double h, double scaleX, double scaleY) {
    // Simplified version of Path_69 from the SVG (organic shape right side)
    // Original coordinates range: x 201–764 (relative to translate 1142.04,559.9)
    // so absolute x: 1343–1906, y: 323–607  → scaled
    final p = Path();
    // Approximate the organic wave as a smooth blob
    p.moveTo(1906 * scaleX, 567 * scaleY);
    p.cubicTo(
      1880 * scaleX, 520 * scaleY,
      1835 * scaleX, 490 * scaleY,
      1815 * scaleX, 465 * scaleY,
    );
    p.cubicTo(
      1800 * scaleX, 427 * scaleY,
      1790 * scaleX, 406 * scaleY,
      1784 * scaleX, 385 * scaleY,
    );
    p.cubicTo(
      1780 * scaleX, 363 * scaleY,
      1765 * scaleX, 345 * scaleY,
      1750 * scaleX, 340 * scaleY,
    );
    p.cubicTo(
      1710 * scaleX, 330 * scaleY,
      1670 * scaleX, 338 * scaleY,
      1640 * scaleX, 340 * scaleY,
    );
    p.cubicTo(
      1560 * scaleX, 345 * scaleY,
      1490 * scaleX, 350 * scaleY,
      1440 * scaleX, 356 * scaleY,
    );
    p.cubicTo(
      1380 * scaleX, 365 * scaleY,
      1343 * scaleX, 390 * scaleY,
      1343 * scaleX, 450 * scaleY,
    );
    p.cubicTo(
      1352 * scaleX, 490 * scaleY,
      1370 * scaleX, 520 * scaleY,
      1400 * scaleX, 550 * scaleY,
    );
    p.cubicTo(
      1420 * scaleX, 565 * scaleY,
      1445 * scaleX, 578 * scaleY,
      1460 * scaleX, 585 * scaleY,
    );
    p.cubicTo(
      1480 * scaleX, 590 * scaleY,
      1510 * scaleX, 600 * scaleY,
      1560 * scaleX, 607 * scaleY,
    );
    p.cubicTo(
      1640 * scaleX, 610 * scaleY,
      1740 * scaleX, 595 * scaleY,
      1810 * scaleX, 585 * scaleY,
    );
    p.cubicTo(
      1870 * scaleX, 578 * scaleY,
      1910 * scaleX, 565 * scaleY,
      1906 * scaleX, 567 * scaleY,
    );
    p.close();
    return p;
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
