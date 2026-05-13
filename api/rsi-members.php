<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

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

function json_response($payload, $status = 200) {
  http_response_code($status);
  echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  exit;
}

function text_between($html, $pattern) {
  if (preg_match($pattern, $html, $m)) return html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
  return '';
}

function parse_members($html) {
  $parts = explode('<li class="member-item', $html);
  $members = [];

  for ($i = 1; $i < count($parts); $i++) {
    $chunk = $parts[$i];
    $end = strpos($chunk, '</li>');
    if ($end === false) continue;

    $item = '<li class="member-item' . substr($chunk, 0, $end + 5);
    if (!preg_match('/href="([^"]+)"/', $item, $hrefMatch)) continue;

    $href = $hrefMatch[1];
    if (strpos($href, '/citizens/') !== 0) continue;

    preg_match_all('/<span class="trans-03s name [^"]+">([^<]+)<\/span>/', $item, $nameMatches);
    preg_match_all('/<span class="trans-03s nick [^"]+">([^<]+)<\/span>/', $item, $nickMatches);
    preg_match_all('/<li class="role">([^<]+)<\/li>/', $item, $roleMatches);

    $handleFromUrl = substr($href, strlen('/citizens/'));
    $name = count($nameMatches[1]) ? html_entity_decode(trim(end($nameMatches[1])), ENT_QUOTES | ENT_HTML5, 'UTF-8') : $handleFromUrl;
    $handle = count($nickMatches[1]) ? html_entity_decode(trim(end($nickMatches[1])), ENT_QUOTES | ENT_HTML5, 'UTF-8') : $handleFromUrl;
    $rank = text_between($item, '/<span class="rank">([^<]+)<\/span>/');
    $roles = array_map(fn($r) => html_entity_decode(trim($r), ENT_QUOTES | ENT_HTML5, 'UTF-8'), $roleMatches[1] ?? []);

    $members[] = [
      'name' => $name,
      'handle' => $handle,
      'rank' => $rank,
      'membership' => str_contains($item, 'org-main') ? 'Main' : 'Affiliate',
      'roles' => $roles,
      'url' => 'https://robertsspaceindustries.com' . $href,
    ];
  }

  return $members;
}

$ttl = max(900, (int) env_get('RDOC_RSI_MEMBERS_CACHE_TTL', 21600));
$cacheDir = __DIR__ . '/cache';
$cacheFile = $cacheDir . '/rsi-members.json';

if (is_readable($cacheFile) && (time() - filemtime($cacheFile)) < $ttl) {
  $cached = json_decode(file_get_contents($cacheFile), true);
  if (is_array($cached)) json_response($cached);
}

$url = 'https://robertsspaceindustries.com/en/orgs/RDOC/members';
$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_TIMEOUT => 15,
  CURLOPT_CONNECTTIMEOUT => 8,
  CURLOPT_USERAGENT => 'Raumdock Website Member Sync/1.0',
  CURLOPT_HTTPHEADER => ['Accept: text/html'],
]);
$html = curl_exec($ch);
$http = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if (!$html || $http >= 400 || $error) {
  if (is_readable($cacheFile)) {
    $cached = json_decode(file_get_contents($cacheFile), true);
    if (is_array($cached)) json_response($cached);
  }
  json_response(['source' => $url, 'updated_at' => gmdate('c'), 'members' => [], 'error' => 'RSI members unavailable'], 502);
}

$members = parse_members($html);
$payload = [
  'source' => $url,
  'updated_at' => gmdate('c'),
  'count' => count($members),
  'members' => $members,
];

if (!is_dir($cacheDir)) @mkdir($cacheDir, 0755, true);
if (is_dir($cacheDir) && is_writable($cacheDir)) {
  @file_put_contents($cacheFile, json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
}

json_response($payload);
