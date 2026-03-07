import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// 4 sidebar templates that cycle every 3 seconds
class SidebarTemplate extends StatelessWidget {
  final String templateType;
  const SidebarTemplate({super.key, required this.templateType});

  @override
  Widget build(BuildContext context) {
    switch (templateType) {
      case 'template1': return _QuoteTemplate();
      case 'template2': return _QuoteWithPersonTemplate();
      case 'template3': return _WishesTemplate();
      case 'template4': return _BirthdayTemplate();
      default:          return _BirthdayTemplate();
    }
  }
}

const _kQuote =
    'The best way to find yourself is to lose yourself in the service of others.';

// ─────────────────────────────────────────────────────────────
// Template 1 – Quote text only
// ─────────────────────────────────────────────────────────────
class _QuoteTemplate extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final pad    = clampW(context, 4, 1.5, 24);
    final vPad   = clampH(context, 10, 5, 52);
    final qMarkW = clampW(context, 18, 2.5, 72);
    final textSz = clampW(context, 9, 0.95, 26);

    return Container(
      color: kSidebarBg,
      padding: EdgeInsets.symmetric(horizontal: pad, vertical: vPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _QuoteMark(size: qMarkW, flip: true),
          Expanded(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: vPad * 0.4),
              child: Text(_kQuote,
                  style: kPretendard(
                    fontSize: textSz,
                    fontWeight: FontWeight.w400,
                    color: Colors.white,
                    height: 1.6,
                  )),
            ),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: _QuoteMark(size: qMarkW, flip: false),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Template 2 – Quote + person thumbnail
// ─────────────────────────────────────────────────────────────
class _QuoteWithPersonTemplate extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final pad    = clampW(context, 4, 1.5, 24);
    final vPad   = clampH(context, 10, 5, 52);
    final qMarkW = clampW(context, 18, 2.5, 72);
    final textSz = clampW(context, 9, 0.95, 26);
    final thumbW = clampW(context, 55, 6.0, 180);

    return Container(
      color: kSidebarBg,
      padding: EdgeInsets.symmetric(horizontal: pad, vertical: vPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _QuoteMark(size: qMarkW, flip: true),
          Expanded(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: vPad * 0.3),
              child: Text(_kQuote,
                  style: kPretendard(
                    fontSize: textSz,
                    fontWeight: FontWeight.w400,
                    color: Colors.white,
                    height: 1.6,
                  )),
            ),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: ClipOval(
              child: Image.asset(
                'assets/images/temp-3.jpg',
                width: thumbW, height: thumbW,
                fit: BoxFit.cover,
                errorBuilder: (ctx, err, st) => _FallbackAvatar(size: thumbW),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Template 3 – Full-bleed image
// ─────────────────────────────────────────────────────────────
class _WishesTemplate extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox.expand(
      child: Image.asset(
        'assets/images/temp-3.jpg',
        fit: BoxFit.cover,
        errorBuilder: (ctx, err, st) => const _GradientFallback(),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Template 4 – Birthday
// ─────────────────────────────────────────────────────────────
class _BirthdayTemplate extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final pad     = clampW(context, 4, 1.5, 24);
    final vPad    = clampH(context, 4, 1, 22);
    final happySz = clampW(context, 11, 1.8, 52);
    final bDaySz  = clampW(context, 16, 3.6, 90);

    return Stack(
      children: [
        Positioned.fill(
          child: Image.asset(
            'assets/images/profileImage.png',
            fit: BoxFit.cover,
            alignment: Alignment.topCenter,
            errorBuilder: (ctx, err, st) => const _GradientFallback(),
          ),
        ),
        Positioned(
          bottom: vPad, left: pad,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Happy',
                  style: kPretendard(
                    fontSize: happySz,
                    fontWeight: FontWeight.w300,
                    fontStyle: FontStyle.italic,
                    color: Colors.white,
                    height: 1.3,
                  )),
              Text('Birthday',
                  style: kPretendard(
                    fontSize: bDaySz,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    height: 1.0,
                    shadows: [
                      Shadow(
                        color: Colors.black.withValues(alpha: 0.45),
                        offset: const Offset(0, 2),
                        blurRadius: 12,
                      ),
                    ],
                  )),
            ],
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/// Quotation mark drawn with a styled Text widget.
/// No SVG / no GPU needed. Uses Unicode " (left) and " (right) curly quotes.
class _QuoteMark extends StatelessWidget {
  final double size;
  final bool flip;
  const _QuoteMark({required this.size, required this.flip});

  @override
  Widget build(BuildContext context) {
    return Text(
      flip ? '\u201C' : '\u201D',   // " and "
      style: TextStyle(
        fontFamily: kFont,
        fontSize: size * 2.2,
        fontWeight: FontWeight.w900,
        color: Colors.white.withValues(alpha: 0.35),
        height: 0.8,
      ),
    );
  }
}

class _FallbackAvatar extends StatelessWidget {
  final double size;
  const _FallbackAvatar({required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size, height: size,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [Color(0xFF4A97DC), Color(0xFF290D68)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
      ),
      child: const Icon(Icons.person, color: Colors.white60),
    );
  }
}

class _GradientFallback extends StatelessWidget {
  const _GradientFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF3A1080), Color(0xFF1A0845), Color(0xFF290D68)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
      ),
    );
  }
}
