import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/app_theme.dart';
import '../models/data_models.dart';

/// Renders the appropriate sidebar bottom template for a given slide.
class SidebarTemplate extends StatelessWidget {
  final DisplaySlide slide;
  final Color footerColor;
  const SidebarTemplate({super.key, required this.slide, this.footerColor = kFooterBg});

  @override
  Widget build(BuildContext context) {
    final c = slide.content;
    switch (slide.slideType) {
      case 'text':
        return _NoticeTemplate(
          heading: c['heading'] as String? ?? '',
          body:    c['body']    as String? ?? '',
        );
      case 'quote_avatar':
        return _QuoteAvatarTemplate(
          text:        c['text']        as String? ?? '',
          author:      c['author']      as String? ?? '',
          designation: c['designation'] as String? ?? '',
          avatarUrl:   c['avatar_url']  as String?,
          footerColor: footerColor,
        );
      case 'image':
        return _EventImageTemplate(
          imageUrl: c['image_url'] as String? ?? '',
          title:    c['title']    as String? ?? '',
          subtitle: c['subtitle'] as String?,
        );
      case 'birthday':
        return _BirthdayTemplate(
          name:        c['name']        as String? ?? '',
          designation: c['designation'] as String? ?? '',
          imageUrl:    c['image_url']   as String?,
          footerColor: footerColor,
        );
      default:
        return Container(color: kSidebarBg);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Template 1 – Notice / Announcement  (text type)
// ─────────────────────────────────────────────────────────────
class _NoticeTemplate extends StatelessWidget {
  final String heading;
  final String body;
  const _NoticeTemplate({required this.heading, required this.body});

  @override
  Widget build(BuildContext context) {
    final headSz = clampW(context, 12, 1.9, 54);
    final bodySz = clampW(context, 7.5, 1.0, 24);
    final pad    = clampW(context, 14, 2.2, 56);
    final vPad   = clampH(context, 12, 1.8, 48);

    return Container(
      color: kSidebarBg,
      width: double.infinity,
      height: double.infinity,
      padding: EdgeInsets.symmetric(horizontal: pad, vertical: vPad),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Announcement chip
          Container(
            padding: EdgeInsets.symmetric(
              horizontal: clampW(context, 6, 0.8, 20),
              vertical:   clampH(context, 3, 0.4, 10),
            ),
            decoration: BoxDecoration(
              color: kLavender.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: kLavender.withValues(alpha: 0.35)),
            ),
            child: Text(
              '📢  NOTICE',
              style: kPretendard(
                fontSize: clampW(context, 6, 0.65, 16),
                fontWeight: FontWeight.w700,
                color: kLavender,
                letterSpacing: 1.2,
              ),
            ),
          ),
          SizedBox(height: clampH(context, 8, 1.2, 30)),
          // Heading — max 2 lines, ellipsis
          Text(
            heading.isNotEmpty ? heading : 'Heading',
            style: kPretendard(
              fontSize: headSz, fontWeight: FontWeight.w700,
              color: Colors.white, height: 1.25, letterSpacing: -0.2,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          SizedBox(height: clampH(context, 6, 0.8, 20)),
          // Divider
          Container(height: 1, color: kLavender.withValues(alpha: 0.22)),
          SizedBox(height: clampH(context, 6, 0.8, 20)),
          // Body — fills remaining space, max lines with ellipsis
          Expanded(
            child: Text(
              body.isNotEmpty ? body : 'Notice body text...',
              style: kPretendard(
                fontSize: bodySz, fontWeight: FontWeight.w400,
                color: Colors.white.withValues(alpha: 0.82), height: 1.6,
              ),
              maxLines: 10,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Template 2 – Event / Holiday Image  (image type)
// ─────────────────────────────────────────────────────────────
class _EventImageTemplate extends StatelessWidget {
  final String imageUrl;
  final String title;
  final String? subtitle;
  const _EventImageTemplate({required this.imageUrl, required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    final titleSz = clampW(context, 13, 2.2, 60);
    final subSz   = clampW(context, 7,  0.85, 20);
    final pad     = clampW(context, 12, 1.8, 48);
    final padT    = clampH(context, 14, 2.0, 52);

    return Stack(
      children: [
        // Background image
        Positioned.fill(
          child: imageUrl.isNotEmpty
              ? CachedNetworkImage(
                  imageUrl: imageUrl,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => const _GradientFallback(),
                )
              : const _GradientFallback(),
        ),

        // Top gradient overlay for text readability
        Positioned.fill(
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: const [0.0, 0.60],
                colors: [
                  Colors.black.withValues(alpha: 0.72),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),

        // Title + subtitle at top — constrained to avoid overflow
        Positioned(
          top: padT, left: pad, right: pad,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontFamily: 'Georgia',
                  fontSize: titleSz,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  height: 1.2,
                  shadows: [
                    Shadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      offset: const Offset(0, 2),
                      blurRadius: 10,
                    ),
                  ],
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              if (subtitle != null && subtitle!.isNotEmpty) ...[
                SizedBox(height: clampH(context, 4, 0.5, 14)),
                Text(
                  subtitle!.toUpperCase(),
                  style: kPretendard(
                    fontSize: subSz, fontWeight: FontWeight.w600,
                    color: Colors.white.withValues(alpha: 0.88),
                    letterSpacing: 1.6,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Template 3 – Quote + Circular Avatar  (quote_avatar type)
// ─────────────────────────────────────────────────────────────
class _QuoteAvatarTemplate extends StatelessWidget {
  final String text;
  final String author;
  final String designation;
  final String? avatarUrl;
  final Color footerColor;
  const _QuoteAvatarTemplate({
    required this.text,
    required this.author,
    required this.designation,
    this.avatarUrl,
    this.footerColor = kFooterBg,
  });

  @override
  Widget build(BuildContext context) {
    final pad      = clampW(context, 12, 1.8, 48);
    final vPad     = clampH(context, 8,  1.4, 40);
    final qMarkSz  = clampW(context, 26, 3.6, 88);
    final textSz   = clampW(context, 8.5, 1.0, 26);
    final avatarSz = clampW(context, 42, 6.0, 136);
    final footerH  = clampH(context, 44, 6.4, 140);
    final authorSz = clampW(context, 7,  0.85, 22);
    final desgSz   = clampW(context, 6,  0.7,  18);

    return Column(
      children: [
        // ── Quote body ───────────────────────────────────────
        Expanded(
          child: Container(
            color: kSidebarBg,
            padding: EdgeInsets.fromLTRB(pad, vPad, pad, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Opening quote mark
                Text(
                  '\u201C',
                  style: TextStyle(
                    fontFamily: 'Georgia',
                    fontSize: qMarkSz,
                    fontWeight: FontWeight.w900,
                    color: kLavender.withValues(alpha: 0.45),
                    height: 1.0,
                  ),
                ),
                // Quote text — fills space, clamps to max lines
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(top: vPad * 0.1, bottom: vPad * 0.2),
                    child: Text(
                      text.isNotEmpty ? text : 'Enter your quote here...',
                      style: kPretendard(
                        fontSize: textSz, fontWeight: FontWeight.w400,
                        color: Colors.white, height: 1.6,
                      ),
                      maxLines: 7,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                // Circular avatar — bottom right
                Align(
                  alignment: Alignment.centerRight,
                  child: Padding(
                    padding: EdgeInsets.only(bottom: vPad * 0.4, right: 2),
                    child: ClipOval(
                      child: _NetOrAssetImage(
                        url: avatarUrl,
                        fallbackAsset: 'assets/images/profileImage.png',
                        width: avatarSz, height: avatarSz,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // ── Author footer ────────────────────────────────────
        _CardFooter(
          name: author,
          designation: designation,
          height: footerH,
          nameFontSize: authorSz,
          desgFontSize: desgSz,
          color: footerColor,
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Template 4 – Birthday  (birthday type)
// ─────────────────────────────────────────────────────────────
class _BirthdayTemplate extends StatelessWidget {
  final String name;
  final String designation;
  final String? imageUrl;
  final Color footerColor;
  const _BirthdayTemplate({
    required this.name,
    required this.designation,
    this.imageUrl,
    this.footerColor = kFooterBg,
  });

  @override
  Widget build(BuildContext context) {
    final pad         = clampW(context, 12, 1.8, 48);
    final happySz     = clampW(context, 11, 1.7, 46);
    final birthdaySz  = clampW(context, 18, 3.4, 82);
    final footerH     = clampH(context, 44, 6.4, 140);
    final authorSz    = clampW(context, 7,  0.85, 22);
    final desgSz      = clampW(context, 6,  0.7,  18);
    final textBottomP = clampH(context, 10, 1.4,  36);

    return Column(
      children: [
        // ── Photo + text area ────────────────────────────────
        Expanded(
          child: Stack(
            children: [
              // Background — photo or gradient
              Positioned.fill(
                child: imageUrl != null && imageUrl!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: imageUrl!,
                        fit: BoxFit.cover,
                        alignment: Alignment.topCenter,
                        errorWidget: (_, __, ___) => const _GradientFallback(),
                      )
                    : const _GradientFallback(),
              ),

              // Bottom gradient for text readability
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: const [0.35, 1.0],
                      colors: [
                        Colors.transparent,
                        kSidebarBg.withValues(alpha: 0.80),
                      ],
                    ),
                  ),
                ),
              ),

              // "Happy Birthday" text at bottom-left — FittedBox handles narrow sidebar
              Positioned(
                left: pad, right: pad, bottom: textBottomP,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Happy',
                        style: TextStyle(
                          fontFamily: 'Georgia',
                          fontSize: happySz,
                          fontStyle: FontStyle.italic,
                          fontWeight: FontWeight.w400,
                          color: Colors.white,
                          height: 1.2,
                          shadows: [
                            Shadow(
                              color: Colors.black.withValues(alpha: 0.45),
                              offset: const Offset(0, 2),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                      ),
                    ),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Birthday',
                        style: TextStyle(
                          fontFamily: 'Georgia',
                          fontSize: birthdaySz,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          height: 1.0,
                          shadows: [
                            Shadow(
                              color: Colors.black.withValues(alpha: 0.55),
                              offset: const Offset(0, 3),
                              blurRadius: 14,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // ── Name + role footer ───────────────────────────────
        _CardFooter(
          name: name,
          designation: designation,
          height: footerH,
          nameFontSize: authorSz,
          desgFontSize: desgSz,
          color: footerColor,
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Shared: footer bar (used by quote_avatar + birthday)
// ─────────────────────────────────────────────────────────────
class _CardFooter extends StatelessWidget {
  final String name;
  final String designation;
  final double height;
  final double nameFontSize;
  final double desgFontSize;
  final Color color;

  const _CardFooter({
    required this.name,
    required this.designation,
    required this.height,
    required this.nameFontSize,
    required this.desgFontSize,
    this.color = kFooterBg,
  });

  @override
  Widget build(BuildContext context) {
    final pad = clampW(context, 12, 1.8, 48);
    return Container(
      width: double.infinity,
      height: height,
      decoration: BoxDecoration(
        color: color,
        border: const Border(top: BorderSide(color: Color(0x22FFFFFF))),
      ),
      padding: EdgeInsets.symmetric(horizontal: pad),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            name.isNotEmpty ? name : 'Name',
            style: kPretendard(
              fontSize: nameFontSize, fontWeight: FontWeight.w700,
              color: Colors.white, letterSpacing: 0.2,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            designation.isNotEmpty ? designation : 'Designation',
            style: kPretendard(
              fontSize: desgFontSize, fontWeight: FontWeight.w400,
              color: kLavender,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Shared: network image with asset fallback
// ─────────────────────────────────────────────────────────────
class _NetOrAssetImage extends StatelessWidget {
  final String? url;
  final String  fallbackAsset;
  final double? width;
  final double? height;
  final BoxFit  fit;
  final Alignment alignment;

  const _NetOrAssetImage({
    required this.url,
    required this.fallbackAsset,
    this.width,
    this.height,
    this.fit       = BoxFit.cover,
    this.alignment = Alignment.center,
  });

  @override
  Widget build(BuildContext context) {
    if (url != null && url!.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: url!,
        width: width, height: height,
        fit: fit, alignment: alignment,
        errorWidget: (_, __, ___) => _assetFallback(),
      );
    }
    return _assetFallback();
  }

  Widget _assetFallback() => Image.asset(
    fallbackAsset,
    width: width, height: height,
    fit: fit, alignment: alignment,
    errorBuilder: (_, __, ___) => const _GradientFallback(),
  );
}

// ─────────────────────────────────────────────────────────────
// Shared: gradient fallback (when no image provided)
// ─────────────────────────────────────────────────────────────
class _GradientFallback extends StatelessWidget {
  const _GradientFallback();

  @override
  Widget build(BuildContext context) => Container(
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        colors: [Color(0xFF3A1080), Color(0xFF1A0845), Color(0xFF290D68)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
  );
}
