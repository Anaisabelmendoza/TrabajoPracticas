<?php
require 'vendor/autoload.php';
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mime\Email;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$transport = Transport::fromDsn($_ENV['MAILER_DSN']);
$mailer = new Mailer($transport);

$email = (new Email())
    ->from('soporte@helpdesk.com')
    ->to('anaisabelmendozajurado@gmail.com')
    ->subject('Test Mailer')
    ->text('Testing MAILER_DSN in symfony.');

try {
    $mailer->send($email);
    echo "Email sent successfully\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
