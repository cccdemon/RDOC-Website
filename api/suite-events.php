<?php
// Upcoming public operations from the Fleetmanager, for the homepage
// "Nächste Operationen" list. Fleetplanner is a SPA; we call its JSON API
// (see fleet-ops.php) and keep only public, not-yet-concluded ops.
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

require __DIR__ . '/fleet-ops.php';

$allowedOrigin = env_get('ALLOWED_ORIGIN', 'https://raumdock.org');
header('Access-Control-Allow-Origin: ' . $allowedOrigin);

$ops = rdoc_fetch_operations(false); // upcoming only
$events = [];
foreach ($ops as $op) {
  $status = strtolower((string) ($op['status'] ?? ''));
  // Skip anything already concluded — those belong in the Ops-Log.
  if ($status === 'completed' || $status === 'cancelled') continue;
  $events[] = rdoc_map_operation($op);
}

echo json_encode($events, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
