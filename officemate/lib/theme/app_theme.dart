import 'package:flutter/material.dart';

// ── Brand colours ────────────────────────────────────────────
const kSidebarBg     = Color(0xFF290D68);
const kSidebarBottom = Color(0xFF1A0845);
const kFooterBg      = Color(0xFF3A3078);
const kBlue          = Color(0xFF4A97DC);
const kOrange        = Color(0xFFE8973A);
const kLavender      = Color(0xFFC4B8E8);
const kDark          = Color(0xFF111827);
const kMuted         = Color(0xFFA9B3BC);
const kLightBlue     = Color(0xFF60A5E0);

// ── Font (Pretendard — matches Ionic app) ────────────────────
const kFont = 'Pretendard';

TextStyle kPretendard({
  double fontSize = 14,
  FontWeight fontWeight = FontWeight.w400,
  Color color = Colors.black,
  double? letterSpacing,
  double? height,
  FontStyle fontStyle = FontStyle.normal,
  List<Shadow>? shadows,
}) =>
    TextStyle(
      fontFamily: kFont,
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      letterSpacing: letterSpacing,
      height: height,
      fontStyle: fontStyle,
      shadows: shadows,
    );

// ─────────────────────────────────────────────────────────────
// TV-AWARE FLUID SIZING
//
// Designed for:
//   • 85" 4K TV  → 3840 × 2160 px
//   • 65" 4K TV  → 3840 × 2160 px
//   • 42" FHD TV → 1920 × 1080 px  (baseline)
//   • 32" HD TV  → 1366 × 768  px
//   • 24" HD TV  → 1280 × 720  px
//
// All values are clamped so the UI never gets too small on 720p
// or too large on 4K. The vw/vh % is calibrated to 1920×1080.
// For 4K screens the layout scales up 2× naturally via %.
// ─────────────────────────────────────────────────────────────

double clampW(BuildContext ctx, double minPx, double vwPct, double maxPx) {
  final w = MediaQuery.of(ctx).size.width;
  return (w * vwPct / 100).clamp(minPx, maxPx);
}

double clampH(BuildContext ctx, double minPx, double vhPct, double maxPx) {
  final h = MediaQuery.of(ctx).size.height;
  return (h * vhPct / 100).clamp(minPx, maxPx);
}

/// Scale factor relative to 1080p baseline (used for icon sizes, padding)
double tvScale(BuildContext ctx) {
  final h = MediaQuery.of(ctx).size.height;
  // 720p → 0.67×, 1080p → 1.0×, 2160p (4K) → 2.0×
  return (h / 1080).clamp(0.60, 2.5);
}

/// Scaled icon size: base size multiplied by TV scale
double tvIcon(BuildContext ctx, double base) =>
    (base * tvScale(ctx)).clamp(base * 0.6, base * 2.5);

/// Sidebar width as proportion of screen width:
///   • 1920px wide → 20% = 384px
///   • 3840px wide → 18% = 691px (cap at 760)
///   • 1280px wide → 22% = 282px (min 240)
double sidebarWidth(BuildContext ctx) =>
    clampW(ctx, 240, 20, 760);
