// ── Meeting room (for sidebar display) ───────────────────────
class MeetingRoom {
  final int id;
  final String title;
  final String roomNumber;
  final String time;
  final String team;

  const MeetingRoom({
    required this.id,
    required this.title,
    required this.roomNumber,
    required this.time,
    required this.team,
  });

  factory MeetingRoom.fromBooking(Map<String, dynamic> b, int index) {
    final start = _slotToTime(b['start_slot'] as int? ?? 0);
    final end   = _slotToTime(b['end_slot']   as int? ?? 1);
    return MeetingRoom(
      id:         index,
      title:      (b['title'] as String? ?? 'Meeting').toUpperCase(),
      roomNumber: (b['room_name'] as String? ?? ''),
      time:       '$start to $end',
      team:       b['user_name'] as String? ?? '',
    );
  }

  static String _slotToTime(int slot) {
    final totalMins = 9 * 60 + slot * 30;
    final h = totalMins ~/ 60;
    final m = totalMins % 60;
    final ampm = h >= 12 ? 'PM' : 'AM';
    final h12  = h > 12 ? h - 12 : (h == 0 ? 12 : h);
    return '${h12.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')} $ampm';
  }
}

// ── Sensor data ───────────────────────────────────────────────
class SensorData {
  final String icon;
  final String title;
  final String statusText;
  final String statusValue;
  final int colorHex;

  const SensorData({
    required this.icon,
    required this.title,
    required this.statusText,
    required this.statusValue,
    required this.colorHex,
  });
}

const kSensors = [
  SensorData(
    icon: 'temperature',
    title: 'Temperature',
    statusText: 'Good',
    statusValue: '27.0C',
    colorHex: 0xFF4A97DC,
  ),
  SensorData(
    icon: 'humidity',
    title: 'Humidity',
    statusText: 'Dry',
    statusValue: '37%',
    colorHex: 0xFFE8973A,
  ),
  SensorData(
    icon: 'air',
    title: 'Discomfort',
    statusText: 'Low',
    statusValue: '12',
    colorHex: 0xFF4A97DC,
  ),
];

// ── Display config (from API) ─────────────────────────────────
class DisplayConfig {
  final String id;
  final String name;
  final String? roomId;
  final String? roomName;
  final String? roomCode;

  const DisplayConfig({
    required this.id,
    required this.name,
    this.roomId,
    this.roomName,
    this.roomCode,
  });

  factory DisplayConfig.fromJson(Map<String, dynamic> j) {
    return DisplayConfig(
      id:       j['id'] as String? ?? '',
      name:     j['name'] as String? ?? 'Officemate',
      roomId:   j['room_id'] as String?,
      roomName: j['room_name'] as String?,
      roomCode: j['room_code'] as String?,
    );
  }
}

// ── Display slide (from API) ──────────────────────────────────
class DisplaySlide {
  final String id;
  final String title;
  final String slideType; // text | quote_avatar | image | birthday
  final Map<String, dynamic> content;
  final int durationSeconds;
  final int sortOrder;

  const DisplaySlide({
    required this.id,
    required this.title,
    required this.slideType,
    required this.content,
    required this.durationSeconds,
    required this.sortOrder,
  });

  factory DisplaySlide.fromJson(Map<String, dynamic> j) {
    return DisplaySlide(
      id:              j['id'] as String? ?? '',
      title:           j['title'] as String? ?? '',
      slideType:       j['slide_type'] as String? ?? 'text',
      content:         (j['content'] as Map?)?.cast<String, dynamic>() ?? {},
      durationSeconds: j['duration_seconds'] as int? ?? 5,
      sortOrder:       j['sort_order'] as int? ?? 0,
    );
  }
}
