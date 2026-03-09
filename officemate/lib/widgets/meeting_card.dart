import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/data_models.dart';

class MeetingCard extends StatelessWidget {
  final MeetingRoom meeting;
  final Color themeColor;
  const MeetingCard({super.key, required this.meeting, this.themeColor = kSidebarBg});

  @override
  Widget build(BuildContext context) {
    // Derive a readable accent from the theme (lighter lavender tint)
    final accent  = lightenColor(themeColor, 0.44);
    final timeSz  = clampW(context, 10, 1.0, 26);
    final titleSz = clampW(context, 10, 0.95, 26);
    final nameSz  = clampW(context, 8,  0.82, 20);
    final iconSz  = clampW(context, 10, 0.95, 22);
    final vPad    = clampH(context, 10, 1.8,  32);

    // "09:00 AM to 11:30 AM" → "09:00 AM  —  11:30 AM"
    final displayTime = meeting.time.replaceAll(' to ', '  —  ');

    return Padding(
      padding: EdgeInsets.only(bottom: vPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Row 1: clock icon + time (highlighted pill) ──────
          Container(
            padding: EdgeInsets.symmetric(
              horizontal: clampW(context, 6, 0.6, 14),
              vertical:   clampH(context, 3, 0.4, 8),
            ),
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.access_time_outlined, color: accent, size: iconSz),
                SizedBox(width: clampW(context, 4, 0.4, 10)),
                Text(
                  displayTime,
                  style: kPretendard(
                    fontSize: timeSz,
                    fontWeight: FontWeight.w400,
                    color: accent,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),

          SizedBox(height: clampH(context, 5, 0.55, 12)),

          // ── Row 2: meeting title (white, normal) ─────────────
          Text(
            meeting.title,
            style: kPretendard(
              fontSize: titleSz,
              fontWeight: FontWeight.w400,
              color: Colors.white,
              letterSpacing: 0.15,
            ),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),

          SizedBox(height: clampH(context, 4, 0.45, 10)),

          // ── Row 3: person icon + booker name ─────────────────
          Row(
            children: [
              Icon(Icons.person_outline_rounded, color: Colors.white54, size: iconSz * 0.92),
              SizedBox(width: clampW(context, 4, 0.4, 10)),
              Expanded(
                child: Text(
                  meeting.team,
                  style: kPretendard(
                    fontSize: nameSz,
                    fontWeight: FontWeight.w400,
                    color: Colors.white54,
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            ],
          ),

          SizedBox(height: vPad * 0.7),
          Container(
            height: 0.5,
            color: Colors.white.withValues(alpha: 0.15),
          ),
        ],
      ),
    );
  }
}
