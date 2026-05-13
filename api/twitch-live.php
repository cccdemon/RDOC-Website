<?php
// api/twitch-live.php — Raumdock
// Secure server-side Twitch live check (no secrets in client)
// Reads env from web server or ./api/.env (local file not web-accessible)

header('Content-Type: application/json');
header('Cache-Control: no-store, must-revalidate');

// ---- simple .env loader (KEY=VALUE per line)
function env_get($key, $default = null) {
  $v = getenv($key);
  if ($v !== false && $v !== '') return $v;
  $envPath = __DIR__ . '/.env';
  if (is_readable($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
      if (strpos(trim($line), '#') === 0) continue;
      if (!str_contains($line, '=')) continue;
      [$k, $val] = array_map('trim', explode('=', $line, 2));
      if ($k === $key) return $val;
    }
  }
  return $default;
}

$CLIENT_ID = env_get('TWITCH_CLIENT_ID', '');
$CLIENT_SECRET = env_get('TWITCH_CLIENT_SECRET', '');
$ALLOWED_ORIGIN = env_get('ALLOWED_ORIGIN', 'https://raumdock.org'); // change to your domain

header('Access-Control-Allow-Origin: ' . $ALLOWED_ORIGIN);

// read query
$logins = $_GET['logins'] ?? [];
if (!is_array($logins)) $logins = [$logins];
if (!$CLIENT_ID || !$CLIENT_SECRET || empty($logins)) { echo json_encode(['live'=>[]]); exit; }

// get app token
$ch = curl_init('https://id.twitch.tv/oauth2/token');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => http_build_query([
    'client_id' => $CLIENT_ID,
    'client_secret' => $CLIENT_SECRET,
    'grant_type' => 'client_credentials'
  ]),
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 10
]);
$tok = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);
if (!$tok || $err) { echo json_encode(['live'=>[]]); exit; }
$tok = json_decode($tok, true);
if (!isset($tok['access_token'])) { echo json_encode(['live'=>[]]); exit; }
$token = $tok['access_token'];

// query streams
$qs = implode('&', array_map(fn($l) => 'user_login='.rawurlencode($l), $logins));
$ch = curl_init('https://api.twitch.tv/helix/streams?'.$qs);
curl_setopt_array($ch, [
  CURLOPT_HTTPHEADER => ["Client-Id: $CLIENT_ID", "Authorization: Bearer $token"],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 10
]);
$res = curl_exec($ch);
curl_close($ch);
$j = json_decode($res, true);
$live = array_map(fn($d) => strtolower($d['user_login'] ?? ''), $j['data'] ?? []);

echo json_encode(['live' => $live], JSON_UNESCAPED_SLASHES);
