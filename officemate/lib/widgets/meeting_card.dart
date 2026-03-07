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
              Expanded(
                child: Text(meeting.title,
                    style: kPretendard(
                      fontSize: titleSz,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                    overflow: TextOverflow.ellipsis),
              ),
              Text(meeting.roomNumber,
                  style: kPretendard(
                    fontSize: subSz,
                    fontWeight: FontWeight.w400,
                    color: Colors.white60,
                  )),
            ],
          ),
          const SizedBox(height: 2),
          Text(meeting.time,
              style: kPretendard(
                fontSize: subSz,
                fontWeight: FontWeight.w400,
                color: Colors.white54,
              )),
          Text(meeting.team,
              style: kPretendard(
                fontSize: subSz,
                fontWeight: FontWeight.w400,
                color: Colors.white.withValues(alpha: 0.45),
              )),
          SizedBox(height: vPad * 0.4),
          Container(height: 0.5, color: Colors.white.withValues(alpha: 0.12)),
        ],
      ),
    );
  }
}
