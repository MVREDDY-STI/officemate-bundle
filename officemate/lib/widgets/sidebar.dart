import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/data_models.dart';
import '../widgets/meeting_card.dart';
import '../widgets/mini_calendar.dart';
import '../widgets/sidebar_template.dart';

class SidebarWidget extends StatefulWidget {
  const SidebarWidget({super.key});

  @override
  State<SidebarWidget> createState() => _SidebarWidgetState();
}

class _SidebarWidgetState extends State<SidebarWidget> {
  int _cycleIndex = 0;

  final List<(String, bool)> _cycleStates = const [
    ('template1', true),
    ('template2', true),
    ('template3', true),
    ('template4', true),
    ('template1', false),
    ('template2', false),
    ('template3', false),
    ('template4', false),
  ];

  @override
  void initState() {
    super.initState();
    Stream.periodic(const Duration(seconds: 3)).listen((_) {
      if (!mounted) return;
      setState(() => _cycleIndex = (_cycleIndex + 1) % _cycleStates.length);
    });
  }

  @override
  Widget build(BuildContext context) {
    final sideW = sidebarWidth(context);
    final (templateType, isMeeting) = _cycleStates[_cycleIndex];

    return SizedBox(
      width: sideW,
      child: Column(
        children: [
          _LogoSection(),
          Expanded(child: _MeetingsSection(isMeeting: isMeeting)),
          Expanded(child: _BottomSection(templateType: templateType)),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// LOGO SECTION
// ─────────────────────────────────────────────────────────────
class _LogoSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final h    = clampH(context, 48, 9, 160);
    final pad  = clampW(context, 4, 1.5, 24);
    // Logo height: compact — 30–40% of the logo bar height
    final logoH = (h * 0.36).clamp(16.0, 52.0);

    return Container(
      height: h,
      width: double.infinity,
      color: kSidebarBg,
      child: Stack(
        children: [
          Padding(
            padding: EdgeInsets.only(left: pad),
            child: Align(
              alignment: Alignment.centerLeft,
              child: SvgPicture.asset(
                'assets/images/logo.svg',
                height: logoH,
                colorFilter: const ColorFilter.mode(
                    Colors.white, BlendMode.srcIn),
              ),
            ),
          ),
          // Subtle separator line at bottom
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
}

// ─────────────────────────────────────────────────────────────
// MEETINGS SECTION
// ─────────────────────────────────────────────────────────────
class _MeetingsSection extends StatelessWidget {
  final bool isMeeting;
  const _MeetingsSection({required this.isMeeting});

  @override
  Widget build(BuildContext context) {
    final pad      = clampW(context, 4, 1.5, 24);
    final dateBarH = clampH(context, 32, 4.5, 90);
    final iconSz   = tvIcon(context, 13);
    final fontSize = clampW(context, 7, 0.8, 20);
    final dateStr  = DateFormat('EEE, MMM d').format(DateTime.now()).toUpperCase();

    return Container(
      color: kSidebarBg,
      child: Column(
        children: [
          // Date bar — uses native Icon (no SVG, no GPU needed)
          SizedBox(
            height: dateBarH,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: pad),
              child: Row(
                children: [
                  Icon(Icons.calendar_today_outlined,
                      color: Colors.white70, size: iconSz),
                  SizedBox(width: clampW(context, 4, 0.5, 14)),
                  Text(dateStr,
                      style: kPretendard(
                        fontSize: fontSize,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2,
                        color: Colors.white.withValues(alpha: 0.85),
                      )),
                ],
              ),
            ),
          ),
          // Meeting list ↔ Calendar — animated crossfade
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 500),
              child: isMeeting
                  ? _MeetingsList(key: const ValueKey('meetings'), pad: pad)
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
  const _MeetingsList({super.key, required this.pad});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: EdgeInsets.symmetric(horizontal: pad, vertical: 4),
      itemCount: kMeetingRooms.length,
      itemBuilder: (ctx, i) => MeetingCard(meeting: kMeetingRooms[i])
          .animate()
          .fadeIn(duration: 400.ms, delay: Duration(milliseconds: i * 80))
          .slideY(begin: 0.1, end: 0),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// BOTTOM SECTION
// ─────────────────────────────────────────────────────────────
class _BottomSection extends StatelessWidget {
  final String templateType;
  const _BottomSection({required this.templateType});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: kSidebarBottom,
      child: Column(
        children: [
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 600),
              transitionBuilder: (child, anim) =>
                  FadeTransition(opacity: anim, child: child),
              child: SidebarTemplate(
                  key: ValueKey(templateType), templateType: templateType),
            ),
          ),
          _EmployeeBar(),
        ],
      ),
    );
  }
}

class _EmployeeBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final pad  = clampW(context, 4, 1.5, 24);
    final vPad = clampH(context, 6, 1.2, 28);

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: kFooterBg,
        border: Border(top: BorderSide(color: Color(0x1AFFFFFF))),
      ),
      padding: EdgeInsets.symmetric(horizontal: pad, vertical: vPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Hugo Hwangjoo Cho',
              style: kPretendard(
                fontSize: clampW(context, 7, 0.9, 24),
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: 0.3,
              ),
              overflow: TextOverflow.ellipsis),
          SizedBox(height: clampH(context, 1, 0.3, 6)),
          Text('Head of Technical Engineering, CTO',
              style: kPretendard(
                fontSize: clampW(context, 6, 0.75, 20),
                fontWeight: FontWeight.w400,
                color: kLavender,
              ),
              overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}
