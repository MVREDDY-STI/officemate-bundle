import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/data_models.dart';

class SensorCard extends StatelessWidget {
  final SensorData sensor;
  const SensorCard({super.key, required this.sensor});

  @override
  Widget build(BuildContext context) {
    final color    = Color(sensor.colorHex);
    final iconSz   = tvIcon(context, 26);
    final titleSz  = clampW(context, 11, 1.0, 28);
    final valSz    = clampW(context, 20, 1.7, 58);
    final statusSz = clampW(context, 9, 0.85, 22);
    final gap      = clampW(context, 8, 0.8, 20);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SensorIcon(icon: sensor.icon, color: color, size: iconSz),
        SizedBox(width: gap),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(sensor.title,
                  style: kPretendard(
                    fontSize: titleSz,
                    fontWeight: FontWeight.w400,
                    color: kMuted,
                    height: 1.0,
                  )),
              SizedBox(height: clampH(context, 4, 0.5, 10)),
              Text(sensor.statusText,
                  style: kPretendard(
                    fontSize: statusSz,
                    fontWeight: FontWeight.w400,
                    color: color,
                    height: 1.0,
                  )),
              SizedBox(height: clampH(context, 3, 0.4, 8)),
              Text(sensor.statusValue,
                  style: kPretendard(
                    fontSize: valSz,
                    fontWeight: FontWeight.w700,
                    color: color,
                    height: 1.0,
                  )),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Sensor icon using native Flutter Icons ────────────────────
class _SensorIcon extends StatelessWidget {
  final String icon;
  final Color color;
  final double size;
  const _SensorIcon(
      {required this.icon, required this.color, required this.size});

  IconData get _iconData {
    switch (icon) {
      case 'temperature':
        return Icons.device_thermostat;
      case 'humidity':
        return Icons.water_drop_outlined;
      case 'air':
      default:
        return Icons.air;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Icon(_iconData, size: size, color: kMuted.withValues(alpha: 0.6));
  }
}
