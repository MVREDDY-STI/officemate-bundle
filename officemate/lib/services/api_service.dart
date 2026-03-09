import 'dart:convert';
import 'package:http/http.dart' as http;
import 'app_config.dart';

/// HTTP client for the OfficeMate backend.
/// Uses the device_token from AppConfig for authentication.
class ApiService {
  static String get _base => AppConfig.serverUrl ?? '';

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (AppConfig.deviceToken != null)
      'X-Device-Token': AppConfig.deviceToken!,
  };

  // ── Registration (no device token needed yet) ────────────
  static Future<Map<String, dynamic>> register({
    required String pairingCode,
  }) async {
    final uri = Uri.parse('$_base/api/v1/displays/register');
    final res = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'pairing_code': pairingCode.toUpperCase().trim(),
        'device_id': AppConfig.deviceId,
      }),
    ).timeout(const Duration(seconds: 10));
    return _parse(res);
  }

  // ── Display config ───────────────────────────────────────
  static Future<Map<String, dynamic>> getDisplayConfig() async {
    final res = await http.get(
      Uri.parse('$_base/api/v1/displays/me'),
      headers: _headers,
    ).timeout(const Duration(seconds: 10));
    return _parse(res);
  }

  // ── Slides ───────────────────────────────────────────────
  static Future<List<Map<String, dynamic>>> getSlides() async {
    final res = await http.get(
      Uri.parse('$_base/api/v1/displays/me/slides'),
      headers: _headers,
    ).timeout(const Duration(seconds: 10));
    final data = _parse(res);
    if (data is List) return data.cast<Map<String, dynamic>>();
    throw Exception('Unexpected response format');
  }

  // ── Bookings ─────────────────────────────────────────────
  static Future<List<Map<String, dynamic>>> getBookings({String? date}) async {
    final d = date ?? _today();
    final res = await http.get(
      Uri.parse('$_base/api/v1/displays/me/bookings?date=$d'),
      headers: _headers,
    ).timeout(const Duration(seconds: 10));
    final data = _parse(res);
    if (data is List) return data.cast<Map<String, dynamic>>();
    throw Exception('Unexpected response format');
  }

  // ── Theme color ──────────────────────────────────────────
  static Future<String?> getThemeColor() async {
    try {
      final res = await http.get(
        Uri.parse('$_base/api/v1/displays/theme'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      final data = _parse(res);
      return data['color'] as String?;
    } catch (_) {
      return null;
    }
  }

  // ── Logo ─────────────────────────────────────────────────
  static Future<String?> getLogo() async {
    try {
      final res = await http.get(
        Uri.parse('$_base/api/v1/logo'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      final data = _parse(res);
      return data['url'] as String?;
    } catch (_) {
      return null;
    }
  }

  // ── Helpers ──────────────────────────────────────────────
  static dynamic _parse(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.isEmpty) return {};
      return jsonDecode(res.body);
    }
    String errMsg = 'HTTP ${res.statusCode}';
    try {
      final body = jsonDecode(res.body) as Map;
      errMsg = body['error']?.toString() ?? errMsg;
    } catch (_) {}
    throw Exception(errMsg);
  }

  static String _today() {
    final now = DateTime.now();
    return '${now.year.toString().padLeft(4, '0')}-'
           '${now.month.toString().padLeft(2, '0')}-'
           '${now.day.toString().padLeft(2, '0')}';
  }
}
