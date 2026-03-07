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
}

const kMeetingRooms = [
  MeetingRoom(
    id: 1,
    title: 'SANKALPA.',
    roomNumber: '02',
    time: '10:00 am to 11:30 am.',
    team: 'Mobile Developers Team',
  ),
  MeetingRoom(
    id: 2,
    title: 'CHINTANA.',
    roomNumber: '03',
    time: '10:00 am to 11:30 am.',
    team: 'Mobile Developers Team',
  ),
  MeetingRoom(
    id: 3,
    title: 'MANTUANA.',
    roomNumber: '04',
    time: '10:00 am to 11:30 am.',
    team: 'Mobile Developers Team',
  ),
];

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
