import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_theme.dart';

class AqGauge extends StatefulWidget {
  const AqGauge({super.key});

  @override
  State<AqGauge> createState() => _AqGaugeState();
}

class _AqGaugeState extends State<AqGauge> with TickerProviderStateMixin {
  late final List<AnimationController> _ringControllers;
  late final List<AnimationController> _dotControllers;
  late final AnimationController _progressCtrl;
  late final Animation<double> _progressAnim;
  late final List<_DotData> _dots;

  @override
  void initState() {
    super.initState();

    // ── 8 organic blob rings (durations match CSS animation durations) ──
    const ringDurations = [15, 18, 22, 14, 19, 16, 21, 13];
    _ringControllers = List.generate(8, (i) {
      final ctrl = AnimationController(
        vsync: this,
        duration: Duration(seconds: ringDurations[i]),
      );
      if (i.isEven) {
        ctrl.repeat();
      } else {
        ctrl.repeat(reverse: true);
      }
      return ctrl;
    });

    // ── 12 floating dots (fade in/out, staggered) ──
    final rng = Random(42);
    _dotControllers = List.generate(12, (i) {
      final ctrl = AnimationController(
        vsync: this,
        duration: Duration(milliseconds: 3000 + rng.nextInt(2000)),
      );
      Future.delayed(Duration(milliseconds: rng.nextInt(4000)), () {
        if (mounted) ctrl.repeat(reverse: true);
      });
      return ctrl;
    });

    // Dot positions: bands at 22–36%, 38–48%, 46–60% radius (matching CSS)
    final r = Random(99);
    _dots = List.generate(12, (i) {
      final angle = r.nextDouble() * 2 * pi;
      final band = i % 4;
      final double radiusPct = band == 0
          ? 0.22 + r.nextDouble() * 0.14
          : band == 1
              ? 0.38 + r.nextDouble() * 0.10
              : 0.46 + r.nextDouble() * 0.14;
      return _DotData(angle: angle, radiusPct: radiusPct);
    });

    // ── Progress arc: 0% → 90% fill over 2s ──
    _progressCtrl = AnimationController(vsync: this, duration: 2.seconds);
    _progressAnim = Tween<double>(begin: 0, end: 0.9).animate(
      CurvedAnimation(parent: _progressCtrl, curve: Curves.easeOut),
    );
    _progressCtrl.forward();
  }

  @override
  void dispose() {
    for (final c in _ringControllers) { c.dispose(); }
    for (final c in _dotControllers) { c.dispose(); }
    _progressCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screen = MediaQuery.of(context).size;
    final gaugeSize = min(
      max(180.0, screen.width * 0.30),
      max(180.0, screen.height * 0.48),
    );

    return SizedBox(
      width: gaugeSize,
      height: gaugeSize,
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // z:0 — 8 organic blob rings
          ..._buildRings(gaugeSize),

          // z:1 — SVG-style progress arc (72% of gauge)
          Positioned.fill(
            child: FractionallySizedBox(
              widthFactor: 0.72,
              heightFactor: 0.72,
              child: AnimatedBuilder(
                animation: _progressAnim,
                builder: (_, child) => CustomPaint(
                  painter: _ArcPainter(progress: _progressAnim.value),
                ),
              ),
            ),
          ),

          // z:2 — 12 floating dots
          ..._buildDots(gaugeSize),

          // z:3 — Centre text
          _CentreText(),
        ],
      ),
    );
  }

  // ── Key fix: border-radius values are PERCENTAGES of the ring's dimensions ──
  // CSS: border-radius: 43% 57% 65% 35% / 50% 41% 59% 50%
  // means: topLeft.x=43% of width, topLeft.y=50% of height, etc.
  List<Widget> _buildRings(double gaugeSize) {
    const sizes   = [0.95, 0.80, 0.92, 0.85, 0.98, 0.78, 0.88, 0.96];
    const heights = [0.82, 0.94, 0.87, 0.96, 0.80, 0.90, 0.95, 0.86];

    // CSS border-radius % values:
    // Each row: [TL-X, TR-X, BR-X, BL-X, TL-Y, TR-Y, BR-Y, BL-Y]
    // (CSS shorthand: "H1 H2 H3 H4 / V1 V2 V3 V4")
    const radii = [
      [43, 57, 65, 35, 50, 41, 59, 50],
      [55, 45, 38, 62, 42, 55, 45, 58],
      [61, 39, 51, 49, 52, 58, 42, 48],
      [40, 60, 48, 52, 60, 38, 62, 40],
      [48, 52, 62, 38, 44, 48, 52, 56],
      [54, 46, 40, 60, 58, 41, 59, 42],
      [38, 62, 55, 45, 45, 52, 48, 55],
      [51, 49, 60, 40, 52, 45, 55, 48],
    ];

    return List.generate(8, (i) {
      final rw = gaugeSize * sizes[i];
      final rh = gaugeSize * heights[i];
      final r  = radii[i];

      return AnimatedBuilder(
        animation: _ringControllers[i],
        builder: (context, child) {
          final t = _ringControllers[i].value;
          // Even rings rotate CW, odd rings rotate CCW — matches CSS
          final angle = i.isEven ? t * 2 * pi : (1 - t) * 2 * pi;
          return Transform.rotate(
            angle: angle,
            child: Container(
              width: rw,
              height: rh,
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.grey.withValues(alpha: 0.45),
                  width: 1.5,
                ),
                // Correct: multiply % by actual pixel dimensions
                borderRadius: BorderRadius.only(
                  topLeft:     Radius.elliptical(r[0] / 100 * rw, r[4] / 100 * rh),
                  topRight:    Radius.elliptical(r[1] / 100 * rw, r[5] / 100 * rh),
                  bottomRight: Radius.elliptical(r[2] / 100 * rw, r[6] / 100 * rh),
                  bottomLeft:  Radius.elliptical(r[3] / 100 * rw, r[7] / 100 * rh),
                ),
              ),
            ),
          );
        },
      );
    });
  }

  List<Widget> _buildDots(double gaugeSize) {
    final dotSize = (gaugeSize * 0.013).clamp(4.0, 8.0);
    return List.generate(12, (i) {
      final d  = _dots[i];
      final cx = gaugeSize / 2 + cos(d.angle) * d.radiusPct * gaugeSize;
      final cy = gaugeSize / 2 + sin(d.angle) * d.radiusPct * gaugeSize;
      return Positioned(
        left: cx - dotSize / 2,
        top:  cy - dotSize / 2,
        child: FadeTransition(
          opacity: _dotControllers[i],
          child: Container(
            width: dotSize,
            height: dotSize,
            decoration: const BoxDecoration(
              color: Color(0xD8787878),
              shape: BoxShape.circle,
            ),
          ),
        ),
      );
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Arc Painter (replaces the SVG stroke progress animation)
// ─────────────────────────────────────────────────────────────
class _ArcPainter extends CustomPainter {
  final double progress;
  const _ArcPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center  = Offset(size.width / 2, size.height / 2);
    final radius  = size.width / 2 * 0.94;
    const strokeW = 8.0;

    // Background ring
    canvas.drawCircle(center, radius,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeW
          ..color = const Color(0xFFE0E4EA));

    // Foreground arc (blue, animated 0→90%)
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2, // start at top (12 o'clock)
      2 * pi * progress,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeW
        ..strokeCap = StrokeCap.round
        ..color = kBlue,
    );
  }

  @override
  bool shouldRepaint(_ArcPainter old) => old.progress != progress;
}

// ─────────────────────────────────────────────────────────────
// Centre text block
// ─────────────────────────────────────────────────────────────
class _CentreText extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final labelSz  = clampW(context, 9, 1.0, 22);
    final numSz    = clampW(context, 30, 6.0, 120);
    final statusSz = clampW(context, 12, 2.2, 44);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Indoor Air Quality',
            style: kPretendard(
              fontSize: labelSz,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF333333),
              letterSpacing: 0.2,
            ))
            .animate()
            .fadeIn(delay: 200.ms, duration: 600.ms),
        const SizedBox(height: 4),
        Text('90',
            style: kPretendard(
              fontSize: numSz,
              fontWeight: FontWeight.w700,
              color: kBlue,
              height: 1,
              letterSpacing: -2,
            ))
            .animate()
            .fadeIn(delay: 400.ms, duration: 600.ms)
            .scale(begin: const Offset(0.8, 0.8), end: const Offset(1, 1)),
        const SizedBox(height: 4),
        Text('Fresh',
            style: kPretendard(
              fontSize: statusSz,
              fontWeight: FontWeight.w400,
              color: kLightBlue,
            ))
            .animate()
            .fadeIn(delay: 600.ms, duration: 600.ms),
      ],
    );
  }
}

class _DotData {
  final double angle;
  final double radiusPct;
  const _DotData({required this.angle, required this.radiusPct});
}
