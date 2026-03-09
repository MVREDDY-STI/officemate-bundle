import 'package:shared_preferences/shared_preferences.dart';

/// Persistent configuration for the TV display app.
/// Stored in SharedPreferences so it survives app restarts.
class AppConfig {
  static const _keyServerUrl   = 'om_server_url';
  static const _keyDeviceToken = 'om_device_token';
  static const _keyDisplayId   = 'om_display_id';
  static const _keyDisplayName = 'om_display_name';
  static const _keyDeviceId    = 'om_device_id';
  static const _keyThemeColor  = 'om_theme_color';
  static const _defaultThemeColor = '#290D68';

  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static SharedPreferences get _p {
    if (_prefs == null) throw StateError('AppConfig.init() not called');
    return _prefs!;
  }

  // ── Server URL ───────────────────────────────────────────
  static String? get serverUrl => _p.getString(_keyServerUrl);
  static Future<void> setServerUrl(String url) => _p.setString(_keyServerUrl, url.trimRight().replaceAll(RegExp(r'/$'), ''));

  // ── Device token (issued on pairing) ────────────────────
  static String? get deviceToken => _p.getString(_keyDeviceToken);
  static Future<void> setDeviceToken(String token) => _p.setString(_keyDeviceToken, token);

  // ── Display metadata ─────────────────────────────────────
  static String? get displayId   => _p.getString(_keyDisplayId);
  static String? get displayName => _p.getString(_keyDisplayName);
  static Future<void> setDisplayInfo({ required String id, required String name }) async {
    await _p.setString(_keyDisplayId,   id);
    await _p.setString(_keyDisplayName, name);
  }

  // ── Unique device ID (generated once, never changes) ─────
  static String get deviceId {
    var id = _p.getString(_keyDeviceId);
    if (id == null) {
      // Generate a stable random device ID
      id = _generateDeviceId();
      _p.setString(_keyDeviceId, id);
    }
    return id;
  }

  static String _generateDeviceId() {
    final now = DateTime.now().millisecondsSinceEpoch;
    final rand = (now ^ (now >> 16)).toRadixString(16).padLeft(8, '0');
    return 'om-tv-$rand';
  }

  // ── Theme color ──────────────────────────────────────────
  static String get themeColor =>
      _p.getString(_keyThemeColor) ?? _defaultThemeColor;
  static Future<void> setThemeColor(String hex) =>
      _p.setString(_keyThemeColor, hex);

  // ── Check if setup is complete ───────────────────────────
  static bool get isConfigured =>
      serverUrl != null && serverUrl!.isNotEmpty &&
      deviceToken != null && deviceToken!.isNotEmpty;

  // ── Reset (for debugging / factory reset) ────────────────
  static Future<void> reset() async {
    await _p.remove(_keyServerUrl);
    await _p.remove(_keyDeviceToken);
    await _p.remove(_keyDisplayId);
    await _p.remove(_keyDisplayName);
    await _p.remove(_keyThemeColor);
  }
}
