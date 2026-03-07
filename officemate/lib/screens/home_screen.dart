import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/data_models.dart';
import '../widgets/sidebar.dart';
import '../widgets/aq_gauge.dart';
import '../widgets/bg_image.dart';
import '../widgets/sensor_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _timeStr = '';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _refreshTime();
    final now = DateTime.now();
    Future.delayed(Duration(seconds: 60 - now.second), () {
      if (mounted) {
        _refreshTime();
        _timer = Timer.periodic(
            const Duration(minutes: 1), (_) => _refreshTime());
      }
    });
  }

  void _refreshTime() {
    final now  = DateTime.now();
    final hour = now.hour % 12 == 0 ? 12 : now.hour % 12;
    final min  = now.minute.toString().padLeft(2, '0');
    final ampm = now.hour >= 12 ? 'PM' : 'AM';
    setState(() => _timeStr = '$hour:$min $ampm');
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Row(
        children: [
          const SidebarWidget(),
          Expanded(child: _MainContent(timeStr: _timeStr)),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN CONTENT PANEL
// ─────────────────────────────────────────────────────────────
class _MainContent extends StatelessWidget {
  final String timeStr;
  const _MainContent({required this.timeStr});

  @override
  Widget build(BuildContext context) {
    final size     = MediaQuery.of(context).size;
    final mainPadT = clampH(context, 14, 2.5, 60);
    // Reduced left padding to bring content closer to the sidebar
    final mainPadL = clampW(context, 14, 2.5, 72);
    final mainPadB = clampH(context, 12, 2.0, 48);
    // Sensor panel width scales with TV size
    final sensorW  = clampW(context, 150, 20, 520);

    return Stack(
      children: [
        // ── Layer 0: bg.svg (natively dynamically handled) ─────────
        const Positioned.fill(
          child: NativeOrWebBg(),
        ),

        // The original background now natively handles the image on Web.

        // ── Layer 2: main body (header | gauge | bottom) ──────
        Positioned.fill(
          child: Padding(
            padding: EdgeInsets.fromLTRB(
                mainPadL, mainPadT, sensorW + 8, mainPadB),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _HeaderSection(),
                const Expanded(child: _GaugeSection()),
                _BottomInfoSection(timeStr: timeStr),
              ],
            ),
          ),
        ),

        // ── Layer 3: sensor panel ──────────────────────────────
        Positioned(
          top: mainPadT,
          right: 0,
          width: sensorW,
          child: _SensorPanel(),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────
class _HeaderSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final titleSz = clampW(context, 22, 3.5, 110);
    final subSz   = clampW(context, 9, 0.9, 26);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Avalokana',
            style: kPretendard(
              fontSize: titleSz,
              fontWeight: FontWeight.w300,
              color: kDark,
              height: 1.0,
              letterSpacing: -1,
            ))
            .animate()
            .fadeIn(duration: 600.ms)
            .slideY(begin: -0.1, end: 0),
        SizedBox(height: clampH(context, 2, 0.5, 10)),
        RichText(
          text: TextSpan(
            style: kPretendard(fontSize: subSz, color: kMuted),
            children: [
              TextSpan(text: DateFormat('EEE, MMM d').format(DateTime.now())),
              const TextSpan(text: '   '),
              TextSpan(
                text: 'Room 01',
                style: kPretendard(
                  fontSize: subSz,
                  color: const Color(0xFF374151),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ).animate().fadeIn(delay: 100.ms, duration: 600.ms),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────
// GAUGE
// ─────────────────────────────────────────────────────────────
class _GaugeSection extends StatelessWidget {
  const _GaugeSection();

  @override
  Widget build(BuildContext context) => const Center(child: AqGauge());
}

// ─────────────────────────────────────────────────────────────
// BOTTOM INFO (temperature + city + clock)
// ─────────────────────────────────────────────────────────────
class _BottomInfoSection extends StatelessWidget {
  final String timeStr;
  const _BottomInfoSection({required this.timeStr});

  @override
  Widget build(BuildContext context) {
    final tempSz = clampW(context, 14, 1.8, 56);
    final unitSz = clampW(context, 8, 0.8, 24);
    final citySz = clampW(context, 7, 0.75, 22);
    final timeSz = clampW(context, 18, 2.8, 80);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('24 ',
                style: kPretendard(fontSize: tempSz, color: kDark)),
            Padding(
              padding: const EdgeInsets.only(bottom: 3),
              child: Text('°C | °F',
                  style: kPretendard(
                      fontSize: unitSz,
                      color: const Color(0xFF6B7280))),
            ),
          ],
        ),
        Text('Bengaluru, India',
            style: kPretendard(
                fontSize: citySz,
                color: kMuted,
                letterSpacing: 0.5)),
        SizedBox(height: clampH(context, 10, 2, 44)),
        Text(timeStr,
            style: kPretendard(
                fontSize: timeSz,
                fontWeight: FontWeight.w700,
                color: kDark,
                letterSpacing: -0.5)),
      ],
    ).animate().fadeIn(delay: 200.ms, duration: 600.ms);
  }
}

// ─────────────────────────────────────────────────────────────
// SENSOR PANEL
// ─────────────────────────────────────────────────────────────
class _SensorPanel extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final titleSz = clampW(context, 12, 1.5, 44);
    final padL    = clampW(context, 22, 3.5, 88);
    final padR    = clampW(context, 10, 1.4, 36);
    final cardGap = clampH(context, 14, 4, 88);

    return Padding(
      padding: EdgeInsets.only(left: padL, right: padR),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sensors',
              style: kPretendard(
                  fontSize: titleSz,
                  fontWeight: FontWeight.w400,
                  color: kDark))
              .animate()
              .fadeIn(delay: 300.ms, duration: 600.ms),
          SizedBox(height: cardGap),
          ...kSensors.asMap().entries.map((e) => Padding(
                padding: EdgeInsets.only(
                    bottom: e.key < kSensors.length - 1 ? cardGap : 0),
                child: SensorCard(sensor: e.value)
                    .animate()
                    .fadeIn(
                        delay: Duration(milliseconds: 400 + e.key * 100),
                        duration: 600.ms)
                    .slideX(begin: 0.1, end: 0),
              )),
        ],
      ),
    );
  }
}
