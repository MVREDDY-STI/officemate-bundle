import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';

class MiniCalendar extends StatefulWidget {
  final double pad;
  const MiniCalendar({super.key, required this.pad});

  @override
  State<MiniCalendar> createState() => _MiniCalendarState();
}

class _MiniCalendarState extends State<MiniCalendar> {
  DateTime _month = DateTime.now();

  void _prev() =>
      setState(() => _month = DateTime(_month.year, _month.month - 1));
  void _next() =>
      setState(() => _month = DateTime(_month.year, _month.month + 1));

  @override
  Widget build(BuildContext context) {
    final titleSz  = clampW(context, 7, 0.85, 22);
    final cellSz   = clampW(context, 7, 0.85, 22);
    final iconSz   = tvIcon(context, 14);

    final firstDay    = DateTime(_month.year, _month.month, 1);
    final daysInMonth = DateTime(_month.year, _month.month + 1, 0).day;
    final startWD     = firstDay.weekday % 7; // 0=Sun
    final today       = DateTime.now();

    final List<int?> cells = [
      ...List.filled(startWD, null),
      ...List.generate(daysInMonth, (i) => i + 1),
    ];

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: widget.pad, vertical: 4),
      child: Column(
        children: [
          // Month nav
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: _prev,
                child: Icon(Icons.chevron_left,
                    color: Colors.white70, size: iconSz),
              ),
              Text(DateFormat('MMMM yyyy').format(_month),
                  style: kPretendard(
                    fontSize: titleSz,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withValues(alpha: 0.9),
                  )),
              GestureDetector(
                onTap: _next,
                child: Icon(Icons.chevron_right,
                    color: Colors.white70, size: iconSz),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // Weekday headers
          Row(
            children: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
                .map((d) => Expanded(
                      child: Center(
                        child: Text(d,
                            style: kPretendard(
                              fontSize: cellSz * 0.75,
                              color: Colors.white38,
                              fontWeight: FontWeight.w500,
                            )),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 2),
          // Days grid
          Expanded(
            child: GridView.builder(
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 7, childAspectRatio: 1),
              itemCount: cells.length,
              itemBuilder: (_, i) {
                final day = cells[i];
                if (day == null) return const SizedBox();
                final isToday = today.year == _month.year &&
                    today.month == _month.month &&
                    today.day == day;
                return Center(
                  child: Container(
                    width: cellSz * 1.8,
                    height: cellSz * 1.8,
                    decoration: isToday
                        ? BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            shape: BoxShape.circle,
                          )
                        : null,
                    child: Center(
                      child: Text('$day',
                          style: kPretendard(
                            fontSize: cellSz,
                            color: isToday ? Colors.white : Colors.white70,
                            fontWeight: isToday
                                ? FontWeight.w700
                                : FontWeight.w400,
                          )),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
