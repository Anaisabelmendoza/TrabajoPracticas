<?php
$url = 'http://localhost:8000/api/login_check';
$data = json_encode(['username' => 'anaisabelmendozajurado@gmail.com', 'password' => 'admin']); // Assuming this is the admin credentials
$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => $data,
        'ignore_errors' => true,
    ],
];
$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);
$tokenInfo = json_decode($result, true);

if (!isset($tokenInfo['token'])) {
    die("Login failed: " . $result);
}
$token = $tokenInfo['token'];

// Now let's try to patch user ID 1
$patchUrl = 'http://localhost:8000/api/users/1';
$patchData = json_encode(['isActive' => false]);
$patchOptions = [
    'http' => [
        'header'  => "Content-type: application/merge-patch+json\r\nAuthorization: Bearer $token\r\n",
        'method'  => 'PATCH',
        'content' => $patchData,
        'ignore_errors' => true,
    ],
];
$patchContext = stream_context_create($patchOptions);
$patchResult = file_get_contents($patchUrl, false, $patchContext);
echo "PATCH Result:\n";
echo $patchResult;
echo "\nHTTP Response headers:\n";
print_r($http_response_header);
