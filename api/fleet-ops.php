<?php
// Shared Fleetplanner-operations client. The Fleetplanner (suite.raumdock.org)
// is a React SPA — its HTML is an empty shell — so we talk to its JSON API:
//   GET {RDOC_SUITE_URL}/api/v1/operations[?past=1]
// Public, no auth required for public-visibility operations.
//
// Requires env_get() to be defined by the including file.

// Fetch operations from the Fleetplanner JSON API. $includePast adds ?past=1.
// Returns an array of public operations (raw API shape), or [] on any failure.
function rdoc_fetch_operations($includePast = false) {
  $base = rtrim(env_get('RDOC_SUITE_URL', 'https://suite.raumdock.org/fleetplanner'), '/');
  $url = $base . '/api/v1/operations' . ($includePast ? '?past=1' : '');

  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_USERAGENT => 'raumdock.org fleet-ops/1.0',
    CURLOPT_HTTPHEADER => ['Accept: application/json'],
  ]);
  $body = curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  curl_close($ch);

  if (!$body || $status < 200 || $status >= 300) return [];
  $data = json_decode($body, true);
  if (!is_array($data) || !isset($data['operations']) || !is_array($data['operations'])) return [];

  // Public operations only — never leak private/guild-internal ops to the site.
  return array_values(array_filter($data['operations'], function ($op) {
    return is_array($op) && (($op['visibility'] ?? '') === 'public');
  }));
}

// Map a raw operation to the flat shape the website JS expects
// (title, date, time, type, guild, status, units, leader, url).
function rdoc_map_operation($op) {
  $base = rtrim(env_get('RDOC_SUITE_URL', 'https://suite.raumdock.org/fleetplanner'), '/');

  $date = '';
  $time = '';
  if (!empty($op['scheduledAt'])) {
    try {
      $dt = new DateTime($op['scheduledAt']);
      $dt->setTimezone(new DateTimeZone('Europe/Berlin'));
      $date = $dt->format('d.m.Y');
      $time = $dt->format('H:i') . ' Uhr';
    } catch (Exception $e) { /* leave empty */ }
  }

  $seats = '';
  $total = (int) ($op['totalSeats'] ?? 0);
  $filled = (int) ($op['filledSeats'] ?? 0);
  if ($total > 0) {
    $seats = $filled . '/' . $total . ' Sitze';
  } elseif ($filled > 0) {
    $seats = $filled . ' Sitze';
  }

  $location = trim((string) ($op['meetingLocation'] ?? ''));
  $guild = '';
  if (isset($op['guild']['name'])) $guild = trim((string) $op['guild']['name']);

  $id = (string) ($op['id'] ?? '');

  return [
    'title'  => trim((string) ($op['title'] ?? 'RDOC Fleet Operation')),
    'date'   => $date,
    'time'   => $time,
    'type'   => trim((string) ($op['opType'] ?? '')),
    'guild'  => $guild,
    'status' => strtolower((string) ($op['status'] ?? '')),
    'units'  => $seats,
    'leader' => $location, // surfaced as the teaser/row sub-line
    'url'    => $id ? ($base . '/ops/' . rawurlencode($id)) : $base,
  ];
}
