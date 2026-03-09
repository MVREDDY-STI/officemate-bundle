import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/data_models.dart';

class MeetingCard extends StatelessWidget {
  final MeetingRoom meeting;
  const MeetingCard({super.key, required this.meeting});

  @override
  Widget build(BuildContext context) {
    final timeSz  = clampW(context, 8,  0.85, 22);
    final titleSz = clampW(context, 7,  0.75, 18);
    final vPad    = clampH(context, 6,  1.2,  22);

    return Padding(
      padding: EdgeInsets.only(bottom: vPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Row 1: time (left, semi-bold) + booker name (right, ellipsis) ──
          Row(
            children: [
              Text(
                meeting.time,
                style: kPretendard(
                  fontSize: timeSz,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  meeting.team,
                  style: kPretendard(
                    fontSize: timeSz,
                    fontWeight: FontWeight.w400,
                    color: Colors.white60,
                  ),
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.end,
                ),
              ),
            ],
          ),

          SizedBox(height: clampH(context, 2, 0.3, 6)),

          // ── Row 2: meeting subject / title ──────────────────
          Text(
            meeting.title,
            style: kPretendard(
              fontSize: titleSz,
              fontWeight: FontWeight.w400,
              color: Colors.white54,
              letterSpacing: 0.2,
            ),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),

          SizedBox(height: vPad * 0.5),
          Container(
            height: 0.5,
            color: Colors.white.withValues(alpha: 0.12),
          ),
        ],
      ),
    );
  }
}
