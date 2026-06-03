<?php

// Login
$opts = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => json_encode(['email' => 'ana@gmail.com', 'password' => 'test']),
        'ignore_errors' => true,
    ]
];
$context  = stream_context_create($opts);
$response = file_get_contents('http://localhost:8000/api/login_check', false, $context);
$status_line = $http_response_header[0];
preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
$status = $match[1];

if ($status !== '200') {
    echo "Login failed: $status\n";
    die();
}

$data = json_decode($response, true);
$token = $data['token'];
echo "Token obtained.\n";

$opts = [
    'http' => [
        'method'  => 'GET',
        'header'  => "Accept: application/json\r\nAuthorization: Bearer $token\r\n",
        'ignore_errors' => true,
    ]
];
$context  = stream_context_create($opts);
$res = file_get_contents('http://localhost:8000/api/tickets', false, $context);
$status_line = $http_response_header[0];
preg_match('{HTTP\/\S*\s(\d{3})}', $status_line, $match);
$status = $match[1];

echo "Tickets status: $status\n";
$body = json_decode($res, true);
echo "Tickets returned: " . count($body['hydra:member'] ?? []) . "\n";
