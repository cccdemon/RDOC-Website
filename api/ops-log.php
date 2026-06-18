<?php
// Ops-Log feed — concluded ("after-action") public operations from the
// Fleetmanager. The Fleetplanner is a SPA, so scraping its HTML returns an
// empty shell; instead we call its JSON API directly:
//   GET /fleetplanner/api/v1/operations?past=1
// and keep only public, concluded ops (completed / cancelled).
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

$ops = rdoc_fetch_operations(true); // include past
$reports = [];
foreach ($ops as $op) {
  $status = strtolower((string) ($op['status'] ?? ''));
  // After-action log = concluded operations only.
  if ($status !== 'completed' && $status !== 'cancelled') continue;
  $reports[] = rdoc_map_operation($op);
}

echo json_encode($reports, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
