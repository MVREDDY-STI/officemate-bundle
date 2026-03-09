import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_theme.dart';
import '../services/app_config.dart';
import '../services/api_service.dart';
import 'home_screen.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key});

  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final _serverCtrl  = TextEditingController();
  final _codeCtrl    = TextEditingController();
  bool _loading      = false;
  String? _error;

  @override
  void dispose() {
    _serverCtrl.dispose();
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _connect() async {
    setState(() { _loading = true; _error = null; });
    try {
      final serverUrl = _serverCtrl.text.trim().replaceAll(RegExp(r'/$'), '');
      final pairingCode = _codeCtrl.text.trim().toUpperCase();

      if (serverUrl.isEmpty) throw Exception('Server URL is required');
      if (pairingCode.length != 6) throw Exception('Pairing code must be 6 characters');

      // Save server URL so ApiService can use it for this request
      await AppConfig.setServerUrl(serverUrl);

      final result = await ApiService.register(pairingCode: pairingCode);

      final token       = result['device_token'] as String?;
      final displayId   = result['display_id']   as String?;
      final displayName = result['display_name'] as String? ?? 'TV Display';

      if (token == null || displayId == null) {
        throw Exception('Invalid response from server');
      }

      await AppConfig.setDeviceToken(token);
      await AppConfig.setDisplayInfo(id: displayId, name: displayName);

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const HomeScreen()),
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kSidebarBg,
      body: _SetupLayout(
        loading:    _loading,
        error:      _error,
        serverCtrl: _serverCtrl,
        codeCtrl:   _codeCtrl,
        onConnect:  _connect,
      ),
    );
  }
}

class _SetupLayout extends StatelessWidget {
  final bool _loading;
  final String? _error;
  final TextEditingController _serverCtrl;
  final TextEditingController _codeCtrl;
  final VoidCallback _onConnect;

  const _SetupLayout({
    required bool loading,
    required String? error,
    required TextEditingController serverCtrl,
    required TextEditingController codeCtrl,
    required VoidCallback onConnect,
  }) : _loading    = loading,
       _error      = error,
       _serverCtrl = serverCtrl,
       _codeCtrl   = codeCtrl,
       _onConnect  = onConnect;

  @override
  Widget build(BuildContext context) {
    final w     = MediaQuery.of(context).size.width;
    final h     = MediaQuery.of(context).size.height;
    final cardW = (w * 0.38).clamp(300.0, 520.0);
    final logoh = (h * 0.06).clamp(32.0, 64.0);
    final titleSz = clampW(context, 18, 2.5, 42.0);
    final subSz   = clampW(context, 11, 1.2, 20.0);
    final fieldSz = clampW(context, 12, 1.3, 18.0);
    final btnH    = clampH(context, 40, 6, 80.0);

    return Stack(
      children: [
        // Background gradient
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF290D68), Color(0xFF1A0845), Color(0xFF0D062A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),

        // Subtle shapes overlay
        Positioned.fill(
          child: Opacity(
            opacity: 0.08,
            child: SvgPicture.asset('assets/images/shapes.svg', fit: BoxFit.cover),
          ),
        ),

        // Center card
        Center(
          child: Container(
            width: cardW,
            padding: EdgeInsets.all(clampW(context, 24, 3, 56)),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Logo
                SvgPicture.asset(
                  'assets/images/logo.svg',
                  height: logoh,
                  colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
                ),
                SizedBox(height: clampH(context, 20, 3, 48)),

                // Title
                Text(
                  'Display Setup',
                  style: kPretendard(
                    fontSize: titleSz,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: -0.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: clampH(context, 6, 1, 14)),
                Text(
                  'Connect this display to your OfficeMate server',
                  style: kPretendard(fontSize: subSz, color: kLavender, height: 1.4),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: clampH(context, 24, 4, 56)),

                // Server URL field
                _FieldLabel(text: 'Server URL', fontSize: fieldSz * 0.85),
                SizedBox(height: clampH(context, 6, 0.8, 12)),
                _InputField(
                  controller: _serverCtrl,
                  hint: 'http://192.168.1.10:3000',
                  fontSize: fieldSz,
                  enabled: !_loading,
                ),
                SizedBox(height: clampH(context, 14, 2, 28)),

                // Pairing code field
                _FieldLabel(text: 'Pairing Code', fontSize: fieldSz * 0.85),
                SizedBox(height: clampH(context, 6, 0.8, 12)),
                _InputField(
                  controller: _codeCtrl,
                  hint: 'ABC123',
                  fontSize: fieldSz * 1.4,
                  letterSpacing: 4,
                  maxLength: 6,
                  textCaps: true,
                  enabled: !_loading,
                ),

                // Error
                if (_error != null) ...[
                  SizedBox(height: clampH(context, 10, 1.5, 20)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      _error!,
                      style: kPretendard(fontSize: fieldSz * 0.82, color: const Color(0xFFFFAAAA)),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],

                SizedBox(height: clampH(context, 20, 3, 40)),

                // Connect button
                SizedBox(
                  width: double.infinity,
                  height: btnH,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _onConnect,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6D3AFF),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.white.withValues(alpha: 0.15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Text('Connect',
                            style: kPretendard(
                              fontSize: fieldSz * 1.1,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            )),
                  ),
                ),

                SizedBox(height: clampH(context, 16, 2.5, 32)),
                Text(
                  'Get the pairing code from the TV Setup tab in your OfficeMate dashboard.',
                  style: kPretendard(fontSize: fieldSz * 0.78, color: kLavender.withValues(alpha: 0.7), height: 1.5),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  final double fontSize;
  const _FieldLabel({required this.text, required this.fontSize});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(text, style: kPretendard(fontSize: fontSize, fontWeight: FontWeight.w600, color: kLavender)),
    );
  }
}

class _InputField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final double fontSize;
  final double letterSpacing;
  final int? maxLength;
  final bool textCaps;
  final bool enabled;

  const _InputField({
    required this.controller,
    required this.hint,
    required this.fontSize,
    this.letterSpacing = 0,
    this.maxLength,
    this.textCaps = false,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      enabled: enabled,
      maxLength: maxLength,
      textCapitalization: textCaps ? TextCapitalization.characters : TextCapitalization.none,
      style: kPretendard(fontSize: fontSize, color: Colors.white, letterSpacing: letterSpacing),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: kPretendard(fontSize: fontSize, color: Colors.white38, letterSpacing: letterSpacing),
        counterText: '',
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.08),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF6D3AFF), width: 2),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.07)),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}
