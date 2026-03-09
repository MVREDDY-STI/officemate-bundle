import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/data_models.dart';

class MeetingCard extends StatelessWidget {
  final MeetingRoom meeting;
  const MeetingCard({super.key, required this.meeting});

  @override
  Widget build(BuildContext context) {
    final timeSz  = clampW(context, 10, 1.05, 28); // slightly larger, medium weight
    final nameSz  = clampW(context, 9,  0.95, 24); // booker name
    final titleSz = clampW(context, 9,  0.95, 24); // subject
    final vPad    = clampH(context, 10, 1.8,  32); // more vertical breathing room

    return Padding(
      padding: EdgeInsets.only(bottom: vPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Row 1: time (left) + booker name (right, ellipsis) ─
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                meeting.time,
                style: kPretendard(
                  fontSize: timeSz,
                  fontWeight: FontWeight.w500, // medium — less bold than before
                  color: Colors.white,
                  letterSpacing: 0.2,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  meeting.team,
                  style: kPretendard(
                    fontSize: nameSz,
                    fontWeight: FontWeight.w400,
                    color: Colors.white60,
                  ),
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.end,
                ),
              ),
            ],
          ),

          SizedBox(height: clampH(context, 4, 0.5, 10)),

          // ── Row 2: meeting subject / title ──────────────────
          Text(
            meeting.title,
            style: kPretendard(
              fontSize: titleSz,
              fontWeight: FontWeight.w400,
              color: Colors.white54,
              letterSpacing: 0.15,
            ),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),

          SizedBox(height: vPad * 0.65),
          Container(
            height: 0.5,
            color: Colors.white.withValues(alpha: 0.15),
          ),
        ],
      ),
    );
  }
}
