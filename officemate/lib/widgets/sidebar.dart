import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_theme.dart';
import '../models/data_models.dart';
import '../widgets/meeting_card.dart';
import '../widgets/mini_calendar.dart';
import '../widgets/sidebar_template.dart';

class SidebarWidget extends StatefulWidget {
  final String? logoUrl;
  final List<MeetingRoom> bookings;
  final List<DisplaySlide> slides;
  final bool hasData;
  final Color themeColor;

  const SidebarWidget({
    super.key,
    this.logoUrl,
    required this.bookings,
    required this.slides,
    required this.hasData,
    this.themeColor = kSidebarBg,
  });

  @override
  State<SidebarWidget> createState() => _SidebarWidgetState();
}

class _SidebarWidgetState extends State<SidebarWidget> {
  int  _slideIndex   = 0;
  Timer? _slideTimer;

  @override
  void initState() {
    super.initState();
    _startSlideTimer();
  }

  void _startSlideTimer() {
    _slideTimer?.cancel();
    if (widget.slides.isEmpty) return;
    final secs = widget.slides[_slideIndex % widget.slides.length].durationSeconds;
    _slideTimer = Timer(Duration(seconds: secs), () {
      if (!mounted) return;
      setState(() => _slideIndex = (_slideIndex + 1) % widget.slides.length);
      _startSlideTimer();
    });
  }

  @override
  void didUpdateWidget(SidebarWidget old) {
    super.didUpdateWidget(old);
    if (old.slides != widget.slides) {
      _slideIndex = 0;
      _startSlideTimer();
    }
  }

  @override
  void dispose() {
    _slideTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sideW = sidebarWidth(context);

    // Derive all 3 sidebar colors from the single theme color
    final bg       = sidebarBgFrom(widget.themeColor);
    final bottom   = sidebarBottomFrom(widget.themeColor);
    final footerBg = footerBgFrom(widget.themeColor);

    final DisplaySlide? currentSlide = widget.slides.isNotEmpty
        ? widget.slides[_slideIndex % widget.slides.length]
        : null;

    return SizedBox(
      width: sideW,
      child: Column(
        children: [
          _LogoSection(logoUrl: widget.logoUrl, bgColor: bg),
          Expanded(
            child: _MeetingsSection(
              isMeeting:  widget.bookings.isNotEmpty,
              bookings:   widget.bookings,
              bgColor:    bg,
              themeColor: widget.themeColor,
            ),
          ),
          Expanded(child: _BottomSection(
            slide:     currentSlide,
            bgColor:   bottom,
            footerBg:  footerBg,
          )),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// LOGO SECTION
// ─────────────────────────────────────────────────────────────
class _LogoSection extends StatelessWidget {
  final String? logoUrl;
  final Color bgColor;
  const _LogoSection({this.logoUrl, this.bgColor = kSidebarBg});

  @override
  Widget build(BuildContext context) {
    final h     = clampH(context, 48, 9, 160);
    final pad   = clampW(context, 4, 1.5, 24);
    final logoH = (h * 0.26).clamp(10.0, 36.0);

    return Container(
      height: h,
      width: double.infinity,
      color: bgColor,
      child: Stack(
        children: [
          Padding(
            padding: EdgeInsets.only(left: pad),
            child: Align(
              alignment: Alignment.centerLeft,
              child: _buildLogo(logoH),
            ),
          ),
          Positioned(
            bottom: 0, left: pad, right: pad,
            child: Container(
              height: 1,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    Color(0x2EFFFFFF),
                    Color(0x2EFFFFFF),
                    Colors.transparent,
                  ],
                  stops: [0.0, 0.2, 0.8, 1.0],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogo(double logoH) {
    if (logoUrl != null && logoUrl!.isNotEmpty) {
      if (logoUrl!.endsWith('.svg')) {
        return SvgPicture.network(
          logoUrl!,
          height: logoH,
          colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
          placeholderBuilder: (_) => _fallbackLogo(logoH),
        );
      }
      return CachedNetworkImage(
        imageUrl: logoUrl!,
        height: logoH,
        fit: BoxFit.contain,
        color: Colors.white,
        colorBlendMode: BlendMode.srcIn,
        errorWidget: (_, __, ___) => _fallbackLogo(logoH),
      );
    }
    return _fallbackLogo(logoH);
  }

  Widget _fallbackLogo(double logoH) {
    return SvgPicture.asset(
      'assets/images/logo.svg',
      height: logoH,
      colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// MEETINGS SECTION
// ─────────────────────────────────────────────────────────────
class _MeetingsSection extends StatelessWidget {
  final bool isMeeting;
  final List<MeetingRoom> bookings;
  final Color bgColor;
  final Color themeColor;
  const _MeetingsSection({
    required this.isMeeting,
    required this.bookings,
    this.bgColor = kSidebarBg,
    this.themeColor = kSidebarBg,
  });

  @override
  Widget build(BuildContext context) {
    final pad      = clampW(context, 4, 1.5, 24);
    final dateBarH = clampH(context, 32, 4.5, 90);
    final iconSz   = tvIcon(context, 13);
    final fontSize = clampW(context, 7, 0.8, 20);
    final dateStr  = DateFormat('EEE, MMM d').format(DateTime.now()).toUpperCase();

    return Container(
      color: bgColor,
      child: Column(
        children: [
          SizedBox(
            height: dateBarH,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: pad),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: clampW(context, 6, 1.0, 20),
                    vertical:   clampH(context, 3, 0.5, 10),
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.calendar_today_outlined,
                          color: Colors.white, size: iconSz),
                      SizedBox(width: clampW(context, 4, 0.5, 14)),
                      Text(dateStr,
                          style: kPretendard(
                            fontSize: fontSize,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.2,
                            color: Colors.white,
                          )),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 500),
              child: isMeeting
                  ? _MeetingsList(key: const ValueKey('meetings'), pad: pad, bookings: bookings, themeColor: themeColor)
                  : MiniCalendar(key: const ValueKey('calendar'), pad: pad),
            ),
          ),
        ],
      ),
    );
  }
}

class _MeetingsList extends StatelessWidget {
  final double pad;
  final List<MeetingRoom> bookings;
  final Color themeColor;
  const _MeetingsList({super.key, required this.pad, required this.bookings, required this.themeColor});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: EdgeInsets.symmetric(horizontal: pad, vertical: 4),
      itemCount: bookings.length,
      itemBuilder: (ctx, i) => MeetingCard(meeting: bookings[i], themeColor: themeColor)
          .animate()
          .fadeIn(duration: 400.ms, delay: Duration(milliseconds: i * 80))
          .slideY(begin: 0.1, end: 0),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// BOTTOM SECTION
// Each slide template manages its own footer internally.
// ─────────────────────────────────────────────────────────────
class _BottomSection extends StatelessWidget {
  final DisplaySlide? slide;
  final Color bgColor;
  final Color footerBg;
  const _BottomSection({
    this.slide,
    this.bgColor = kSidebarBottom,
    this.footerBg = kFooterBg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: bgColor,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 600),
        transitionBuilder: (child, anim) => FadeTransition(opacity: anim, child: child),
        child: slide != null
            ? SidebarTemplate(
                key: ValueKey('${slide!.id}_${slide!.slideType}'),
                slide: slide!,
                footerColor: footerBg,
              )
            : Container(key: const ValueKey('empty'), color: bgColor),
      ),
    );
  }
}
