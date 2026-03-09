import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'app_config.dart';

typedef WsEventHandler = void Function(String event, dynamic data);

/// WebSocket client for real-time events from the backend.
/// Connects using the device_token and reconnects automatically on disconnect.
class WsService {
  WsService._();
  static final WsService instance = WsService._();

  WebSocketChannel? _channel;
  StreamSubscription? _sub;
  Timer? _reconnectTimer;
  Timer? _pingTimer;
  bool _disposed = false;

  final _handlers = <WsEventHandler>[];

  void addHandler(WsEventHandler h) => _handlers.add(h);
  void removeHandler(WsEventHandler h) => _handlers.remove(h);

  Future<void> connect() async {
    _disposed = false;
    _doConnect();
  }

  void _doConnect() {
    final token  = AppConfig.deviceToken;
    final server = AppConfig.serverUrl;
    if (token == null || server == null) return;

    // Convert http(s) → ws(s)
    final wsBase = server.replaceFirst(RegExp(r'^http'), 'ws');
    final uri = Uri.parse('$wsBase/ws/display?device_token=$token');

    try {
      _channel = WebSocketChannel.connect(uri);
      _sub = _channel!.stream.listen(
        _onMessage,
        onError: (_) => _scheduleReconnect(),
        onDone: _scheduleReconnect,
        cancelOnError: true,
      );

      // Start ping loop
      _pingTimer?.cancel();
      _pingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        _send({'action': 'ping'});
      });
    } catch (_) {
      _scheduleReconnect();
    }
  }

  void _onMessage(dynamic raw) {
    try {
      final msg = jsonDecode(raw as String) as Map<String, dynamic>;
      final event = msg['event'] as String? ?? '';
      final data  = msg['data'];
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

  void _scheduleReconnect() {
    if (_disposed) return;
    _pingTimer?.cancel();
    _sub?.cancel();
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      if (!_disposed) _doConnect();
    });
  }

  void dispose() {
    _disposed = true;
    _pingTimer?.cancel();
    _reconnectTimer?.cancel();
    _sub?.cancel();
    _channel?.sink.close();
  }
}
