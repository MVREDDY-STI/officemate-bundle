import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'app_config.dart';

typedef WsEventHandler = void Function(String event, dynamic data);

/// WebSocket client for real-time events from the backend.
/// Connects using the device_token and reconnects automatically on disconnect
/// using exponential backoff (2 → 4 → 8 → 16 → 30 seconds, capped).
class WsService {
  WsService._();
  static final WsService instance = WsService._();

  WebSocketChannel? _channel;
  StreamSubscription? _sub;
  Timer? _reconnectTimer;
  Timer? _pingTimer;
  bool _disposed     = false;
  bool _isConnected  = false;
  int  _retryCount   = 0;

  final _handlers = <WsEventHandler>[];

  bool get isConnected => _isConnected;

  void addHandler(WsEventHandler h) => _handlers.add(h);
  void removeHandler(WsEventHandler h) => _handlers.remove(h);

  /// Start the connection (called once on app start).
  Future<void> connect() async {
    _disposed    = false;
    _retryCount  = 0;
    _doConnect();
  }

  /// Force an immediate reconnect attempt if not currently connected.
  /// Safe to call at any time (e.g. from a periodic refresh timer).
  void ensureConnected() {
    if (_disposed) return;
    if (!_isConnected) {
      _reconnectTimer?.cancel();
      _doConnect();
    }
  }

  void _doConnect() {
    final token  = AppConfig.deviceToken;
    final server = AppConfig.serverUrl;
    if (token == null || server == null) return; // not configured yet

    // Convert http(s) → ws(s)
    final wsBase = server.replaceFirst(RegExp(r'^http'), 'ws');
    final uri    = Uri.parse('$wsBase/ws/display?device_token=$token');

    try {
      _sub?.cancel();
      _channel = WebSocketChannel.connect(uri);
      _sub = _channel!.stream.listen(
        _onMessage,
        onError: (_) => _onDisconnected(),
        onDone:       _onDisconnected,
        cancelOnError: true,
      );

      // Restart ping loop
      _pingTimer?.cancel();
      _pingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        _send({'action': 'ping'});
      });
    } catch (_) {
      _onDisconnected();
    }
  }

  void _onMessage(dynamic raw) {
    try {
      final msg   = jsonDecode(raw as String) as Map<String, dynamic>;
      final event = msg['event'] as String? ?? '';
      final data  = msg['data'];

      // Mark as connected on first successful message (server sends 'connected')
      if (event == 'connected') {
        _isConnected = true;
        _retryCount  = 0; // reset backoff on successful connection
      }

      for (final h in List.of(_handlers)) {
        h(event, data);
      }
    } catch (_) {}
  }

  void _send(Map<String, dynamic> msg) {
    try {
      _channel?.sink.add(jsonEncode(msg));
    } catch (_) {}
  }

  void _onDisconnected() {
    if (_disposed) return;
    _isConnected = false;
    _pingTimer?.cancel();
    _sub?.cancel();
    _reconnectTimer?.cancel();

    // Exponential backoff: 2 → 4 → 8 → 16 → 30 seconds (capped)
    _retryCount++;
    final delaySec = (_retryCount <= 5)
        ? (2 * (1 << (_retryCount - 1))).clamp(2, 30) // 2, 4, 8, 16, 30
        : 30;

    _reconnectTimer = Timer(Duration(seconds: delaySec), () {
      if (!_disposed) _doConnect();
    });
  }

  void dispose() {
    _disposed    = true;
    _isConnected = false;
    _pingTimer?.cancel();
    _reconnectTimer?.cancel();
    _sub?.cancel();
    _channel?.sink.close();
  }
}
