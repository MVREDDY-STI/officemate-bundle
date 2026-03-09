import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/data_models.dart';

class MeetingCard extends StatelessWidget {
  final MeetingRoom meeting;
  const MeetingCard({super.key, required this.meeting});

  @override
  Widget build(BuildContext context) {
    final titleSz = clampW(context, 8, 0.9, 24);
    final subSz   = clampW(context, 6, 0.7, 18);
    final vPad    = clampH(context, 6, 1.2, 22);

    return Padding(
      padding: EdgeInsets.only(bottom: vPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Time — now uses the LARGER font (was titleSz on subject before)
              Text(meeting.time,
                  style: kPretendard(
                    fontSize: titleSz,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  )),
              const SizedBox(width: 6),
              // Booker name — right-aligned, ellipsis
              Expanded(
                child: Text(meeting.team,
                    style: kPretendard(
                      fontSize: subSz,
                      fontWeight: FontWeight.w400,
                      color: Colors.white60,
                    ),
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.end),
              ),
            ],
          ),
          const SizedBox(height: 2),
          // Subject — now uses the SMALLER font (was subSz on time before)
          Text(meeting.title,
              style: kPretendard(
                fontSize: subSz,
                fontWeight: FontWeight.w400,
                color: Colors.white54,
                letterSpacing: 0.3,
              ),
              overflow: TextOverflow.ellipsis),
          SizedBox(height: vPad * 0.4),
          Container(height: 0.5, color: Colors.white.withValues(alpha: 0.12)),
        ],
      ),
    );
  }
}
