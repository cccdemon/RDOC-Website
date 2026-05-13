<?php
header('Content-Type: application/json');
header('Cache-Control: no-store');

$logins = $_GET['logins'] ?? [];
if (!is_array($logins)) $logins = [$logins];

// ENV per .htaccess / Apache SetEnv setzen
$client = getenv('TWITCH_CLIENT_ID');
$secret = getenv('TWITCH_CLIENT_SECRET');
if (!$client || !$secret || empty($logins)) { echo json_encode(['live'=>[]]); exit; }

// Token holen (einfach, ohne Persist-Cache)
$ch = curl_init('https://id.twitch.tv/oauth2/token');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => http_build_query([
    'client_id' => $client,
    'client_secret' => $secret,
    'grant_type' => 'client_credentials'
  ]),
  CURLOPT_RETURNTRANSFER => true
]);
$tok = json_decode(curl_exec($ch), true);
curl_close($ch);
if (!isset($tok['access_token'])) { echo json_encode(['live'=>[]]); exit; }

$qs = implode('&', array_map(fn($l) => 'user_login='.rawurlencode($l), $logins));
$ch = curl_init('https://api.twitch.tv/helix/streams?'.$qs);
curl_setopt_array($ch, [
  CURLOPT_HTTPHEADER => ["Client-Id: $client", "Authorization: Bearer ".$tok['access_token']],
  CURLOPT_RETURNTRANSFER => true
]);
$res = curl_exec($ch);
curl_close($ch);
$j = json_decode($res, true);
$live = array_map(fn($d) => strtolower($d['user_login'] ?? ''), $j['data'] ?? []);
echo json_encode(['live' => $live]);
