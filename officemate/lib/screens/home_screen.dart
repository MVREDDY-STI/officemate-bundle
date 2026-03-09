import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/data_models.dart';
import '../services/api_service.dart';
import '../services/app_config.dart';
import '../services/ws_service.dart';
import '../widgets/sidebar.dart';
import '../widgets/aq_gauge.dart';
import '../widgets/bg_image.dart';
import '../widgets/sensor_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

// Returns true if the booking's end_slot time has NOT yet passed for today.
// Slot 0 = 09:00, slot 1 = 09:30, ... base is 9:00 AM with 30-min intervals.
bool _isBookingActive(Map<String, dynamic> b) {
  final endSlot  = b['end_slot'] as int? ?? 0;
  final now      = DateTime.now();
  final totalMin = 9 * 60 + endSlot * 30;
  final endTime  = DateTime(now.year, now.month, now.day, totalMin ~/ 60, totalMin % 60);
  return now.isBefore(endTime);
}

// Convert a filtered raw booking list into MeetingRoom display objects.
List<MeetingRoom> _toDisplayBookings(List<Map<String, dynamic>> raw) {
  final active = raw.where(_isBookingActive).toList();
  return active.asMap().entries
      .map((e) => MeetingRoom.fromBooking(e.value, e.key))
      .toList();
}

class _HomeScreenState extends State<HomeScreen> {
  String _timeStr       = '';
  Timer? _timer;

  // Live data
  String  _displayTitle = 'Officemate';
  String  _roomCode     = '';
  String? _logoUrl;
  Color   _themeColor   = kSidebarBg;   // initialized from cache, then refreshed from API
  List<Map<String, dynamic>> _rawBookings = []; // full API response, re-filtered each minute
  List<MeetingRoom>  _bookings = [];
  List<DisplaySlide> _slides   = [];
  bool _dataLoaded = false;

  @override
  void initState() {
    super.initState();
    // Load cached theme color immediately so sidebar shows correct color on start
    _themeColor = hexToColor(AppConfig.themeColor);

    _refreshTime();
    final now = DateTime.now();
    Future.delayed(Duration(seconds: 60 - now.second), () {
      if (mounted) {
        _refreshTime();
        _timer = Timer.periodic(const Duration(minutes: 1), (_) => _refreshTime());
      }
    });

    _loadData();
    _connectWebSocket();
  }

  void _refreshTime() {
    final now  = DateTime.now();
    final hour = now.hour % 12 == 0 ? 12 : now.hour % 12;
    final min  = now.minute.toString().padLeft(2, '0');
    final ampm = now.hour >= 12 ? 'PM' : 'AM';
    setState(() {
      _timeStr  = '$hour:$min $ampm';
      // Re-filter every minute so expired bookings vanish and calendar reappears automatically
      _bookings = _toDisplayBookings(_rawBookings);
    });
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        ApiService.getDisplayConfig().catchError((_) => <String, dynamic>{}),
        ApiService.getBookings().catchError((_) => <Map<String, dynamic>>[]),
        ApiService.getSlides().catchError((_) => <Map<String, dynamic>>[]),
        ApiService.getLogo().then((v) => v).catchError((_) => null as String?),
        ApiService.getThemeColor().then((v) => v).catchError((_) => null as String?),
      ]);

      final config     = results[0] as Map<String, dynamic>;
      final bookings   = results[1] as List<Map<String, dynamic>>;
      final slides     = results[2] as List<Map<String, dynamic>>;
      final logoUrl    = results[3] as String?;
      final themeColor = results[4] as String?;

      if (!mounted) return;
      setState(() {
        _displayTitle = config['room_name'] as String? ?? 'Officemate';
        _roomCode     = config['room_code'] as String? ?? '';
        _rawBookings  = bookings;
        _bookings     = _toDisplayBookings(bookings); // only non-expired bookings
        _slides       = slides.map(DisplaySlide.fromJson).toList();
        _logoUrl      = logoUrl;
        if (themeColor != null) {
          AppConfig.setThemeColor(themeColor);
          _themeColor = hexToColor(themeColor);
        }
        _dataLoaded   = true;
      });
    } catch (_) {
      if (mounted) setState(() => _dataLoaded = true);
    }
  }

  void _connectWebSocket() {
    WsService.instance.addHandler(_onWsEvent);
    WsService.instance.connect();
  }

  void _onWsEvent(String event, dynamic data) {
    switch (event) {
      case 'display:booking_updated':
        ApiService.getBookings().then((list) {
          if (!mounted) return;
          setState(() {
            _rawBookings = list;
            _bookings    = _toDisplayBookings(list); // filter expired before displaying
          });
        }).catchError((_) {});
        break;

      case 'display:slides_updated':
        ApiService.getSlides().then((list) {
          if (!mounted) return;
          setState(() => _slides = list.map(DisplaySlide.fromJson).toList());
        }).catchError((_) {});
        break;

      case 'display:logo_updated':
        final url = (data as Map?)?['url'] as String?;
        if (url != null && mounted) setState(() => _logoUrl = url);
        break;

      case 'display:config_updated':
        ApiService.getDisplayConfig().then((cfg) {
          if (!mounted) return;
          setState(() {
            _displayTitle = cfg['room_name'] as String? ?? 'Officemate';
            _roomCode     = cfg['room_code'] as String? ?? '';
          });
        }).catchError((_) {});
        break;

      case 'display:theme_updated':
        final color = (data as Map?)?['color'] as String?;
        if (color != null && mounted) {
          AppConfig.setThemeColor(color);
          setState(() => _themeColor = hexToColor(color));
        }
        break;
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    WsService.instance.removeHandler(_onWsEvent);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Row(
        children: [
          SidebarWidget(
            logoUrl:    _logoUrl,
            bookings:   _bookings,
            slides:     _slides,
            hasData:    _dataLoaded,
            themeColor: _themeColor,
          ),
          Expanded(child: _MainContent(
            timeStr:      _timeStr,
            displayTitle: _displayTitle,
            roomCode:     _roomCode,
          )),
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
  final String displayTitle;
  final String roomCode;
  const _MainContent({
    required this.timeStr,
    required this.displayTitle,
    required this.roomCode,
  });

  @override
  Widget build(BuildContext context) {
    final mainPadT = clampH(context, 14, 2.5, 60);
    final mainPadL = clampW(context, 14, 2.5, 72);
    final mainPadB = clampH(context, 12, 2.0, 48);
    final sensorW  = clampW(context, 150, 20, 520);

    return Stack(
      children: [
        const Positioned.fill(child: NativeOrWebBg()),
        Positioned.fill(
          child: Padding(
            padding: EdgeInsets.fromLTRB(mainPadL, mainPadT, sensorW + 8, mainPadB),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _HeaderSection(title: displayTitle, roomCode: roomCode),
                const Expanded(child: _GaugeSection()),
                _BottomInfoSection(timeStr: timeStr),
              ],
            ),
          ),
        ),
        Positioned(
          top: mainPadT, right: 0, width: sensorW,
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
  final String title;
  final String roomCode;
  const _HeaderSection({required this.title, required this.roomCode});

  @override
  Widget build(BuildContext context) {
    final titleSz = clampW(context, 22, 3.5, 110);
    final subSz   = clampW(context, 9, 0.9, 26);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
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
              if (roomCode.isNotEmpty)
                TextSpan(
                  text: roomCode,
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
// BOTTOM INFO
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
            Text('24 ', style: kPretendard(fontSize: tempSz, color: kDark)),
            Padding(
              padding: const EdgeInsets.only(bottom: 3),
              child: Text('°C | °F',
                  style: kPretendard(fontSize: unitSz, color: const Color(0xFF6B7280))),
            ),
          ],
        ),
        Text('Bengaluru, India',
            style: kPretendard(fontSize: citySz, color: kMuted, letterSpacing: 0.5)),
        SizedBox(height: clampH(context, 10, 2, 44)),
        Text(timeStr,
            style: kPretendard(
                fontSize: timeSz, fontWeight: FontWeight.w700,
                color: kDark, letterSpacing: -0.5)),
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
    final titleSz = clampW(context, 14, 1.8, 52);
    final padL    = clampW(context, 10, 1.5, 48);
    final padR    = clampW(context, 10, 1.4, 36);
    final cardGap = clampH(context, 18, 5, 100);

    return Padding(
      padding: EdgeInsets.only(left: padL, right: padR),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sensors',
              style: kPretendard(fontSize: titleSz, fontWeight: FontWeight.w400, color: kDark))
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
