<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, must-revalidate');

function env_get($key, $default = null) {
  $v = getenv($key);
  if ($v !== false && $v !== '') return $v;
  $envPath = __DIR__ . '/.env';
  if (is_readable($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
      if (strpos(trim($line), '#') === 0) continue;
      if (strpos($line, '=') === false) continue;
      [$k, $val] = array_map('trim', explode('=', $line, 2));
      if ($k === $key) return $val;
    }
  }
  return $default;
}

$BOT = env_get('DISCORD_BOT_TOKEN', '');
$GUILD = env_get('DISCORD_GUILD_ID', '');
$ALLOWED_ORIGIN = env_get('ALLOWED_ORIGIN', 'https://raumdock.org');
header('Access-Control-Allow-Origin: ' . $ALLOWED_ORIGIN);

if (!$BOT || !$GUILD) { echo json_encode([]); exit; }

$url = "https://discord.com/api/v10/guilds/{$GUILD}/scheduled-events?with_user_count=false";
$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_HTTPHEADER => ["Authorization: Bot {$BOT}"],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 10
]);
$res = curl_exec($ch);
curl_close($ch);
if (!$res) { echo json_encode([]); exit; }
$data = json_decode($res, true);
if (!is_array($data)) { echo json_encode([]); exit; }

$now = time();
$out = [];
foreach ($data as $ev) {
  $start = isset($ev['scheduled_start_time']) ? strtotime($ev['scheduled_start_time']) : 0;
  $end = isset($ev['scheduled_end_time']) && $ev['scheduled_end_time'] ? strtotime($ev['scheduled_end_time']) : null;
  if ($start + 60 < $now && (!$end || $end < $now)) continue;
  $image = null;
  if (!empty($ev['image'])) {
    $image = "https://cdn.discordapp.com/guild-events/{$ev['id']}/{$ev['image']}.png?size=512";
  }
  $location = null;
  if (isset($ev['entity_metadata']['location'])) $location = $ev['entity_metadata']['location'];
  $desc = isset($ev['description']) ? $ev['description'] : '';
  $urlPublic = "https://discord.com/events/{$GUILD}/{$ev['id']}";
  $out[] = [
    'id' => $ev['id'],
    'name' => $ev['name'] ?? 'Event',
    'description' => $desc,
    'start_time' => $ev['scheduled_start_time'] ?? null,
    'end_time' => $ev['scheduled_end_time'] ?? null,
    'location' => $location,
    'image' => $image,
    'url' => $urlPublic
  ];
}
usort($out, function($a,$b){ return strcmp($a['start_time'] ?? '', $b['start_time'] ?? ''); });
echo json_encode($out, JSON_UNESCAPED_SLASHES);
