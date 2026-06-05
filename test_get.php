<?php
$url = 'http://localhost:8000/api/login_check';
$data = json_encode(['username' => 'anaisabelmendozajurado@gmail.com', 'password' => 'admin']); 
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

// GET users
$getUrl = 'http://localhost:8000/api/users';
$getOptions = [
    'http' => [
        'header'  => "Accept: application/ld+json\r\nAuthorization: Bearer $token\r\n",
        'method'  => 'GET',
        'ignore_errors' => true,
    ],
];
$getContext = stream_context_create($getOptions);
$getResult = file_get_contents($getUrl, false, $getContext);
echo "GET Result:\n";
echo $getResult;
