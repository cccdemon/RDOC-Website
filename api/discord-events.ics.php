<?php
header('Content-Type: text/calendar; charset=utf-8');
header('Content-Disposition: attachment; filename="raumdock-events.ics"');
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

$url = "https://discord.com/api/v10/guilds/{$GUILD}/scheduled-events?with_user_count=false";
$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_HTTPHEADER => ["Authorization: Bot {$BOT}"],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 10
]);
$res = curl_exec($ch);
curl_close($ch);
$data = json_decode($res, true);

$lines = [];
$lines[] = 'BEGIN:VCALENDAR';
$lines[] = 'VERSION:2.0';
$lines[] = 'PRODID:-//Raumdock//Discord Events//DE';
if (is_array($data)) {
  foreach ($data as $ev) {
    $start = isset($ev['scheduled_start_time']) ? strtotime($ev['scheduled_start_time']) : 0;
    if ($start <= 0) continue;
    $end = isset($ev['scheduled_end_time']) && $ev['scheduled_end_time'] ? strtotime($ev['scheduled_end_time']) : ($start + 7200);
    $uid = $ev['id'].'@raumdock';
    $name = str_replace(array("\r","\n"),' ', $ev['name'] ?? 'Event');
    $desc = str_replace(array("\r","\n"),' ', $ev['description'] ?? '');
    $loc = $ev['entity_metadata']['location'] ?? 'Discord';
    $dt = gmdate('Ymd\THis\Z', $start);
    $dtEnd = gmdate('Ymd\THis\Z', $end);
    $lines[] = 'BEGIN:VEVENT';
    $lines[] = 'UID:'.$uid;
    $lines[] = 'DTSTAMP:'.gmdate('Ymd\THis\Z');
    $lines[] = 'DTSTART:'.$dt;
    $lines[] = 'DTEND:'.$dtEnd;
    $lines[] = 'SUMMARY:'.addcslashes($name, ",;");
    if ($desc) $lines[] = 'DESCRIPTION:'.addcslashes($desc, ",;");
    if ($loc)  $lines[] = 'LOCATION:'.addcslashes($loc, ",;");
    $lines[] = 'END:VEVENT';
  }
}
$lines[] = 'END:VCALENDAR';
echo implode("\r\n", $lines);
