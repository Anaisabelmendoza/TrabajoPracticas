<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mime\Address;

class ResetPasswordController extends AbstractController
{
    #[Route('/api/forgot-password', name: 'app_forgot_password', methods: ['POST'])]
    public function forgotPassword(Request $request, EntityManagerInterface $em, MailerInterface $mailer): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $emailAddress = $data['email'] ?? null;

        if (!$emailAddress) {
            return new JsonResponse(['error' => 'Email requerido'], 400);
        }

        $user = $em->getRepository(User::class)->findOneBy(['email' => $emailAddress]);
        
        if ($user) {
            $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $user->setResetPasswordCode($code);
            $user->setResetPasswordExpiresAt((new \DateTime())->modify('+1 hour'));
            $em->flush();

            $email = (new TemplatedEmail())
                ->from(new Address('anaisabelmendozajurado@gmail.com', 'HelpDesk Soporte'))
                ->to($user->getEmail())
                ->subject('Recuperación de contraseña')
                ->htmlTemplate('emails/reset_password.html.twig')
                ->context([
                    'reset_code' => $code,
                ]);

            $mailer->send($email);
        }

        // Siempre devolvemos éxito para no revelar si el email existe
        return new JsonResponse(['message' => 'Si el email existe, se ha enviado un código de recuperación']);
    }

    #[Route('/api/reset-password', name: 'app_reset_password', methods: ['POST'])]
    public function resetPassword(
        Request $request, 
        EntityManagerInterface $em, 
        UserPasswordHasherInterface $passwordHasher
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $emailAddress = $data['email'] ?? null;
        $code = $data['code'] ?? null;
        $newPassword = $data['password'] ?? null;

        if (!$emailAddress || !$code || !$newPassword) {
            return new JsonResponse(['error' => 'Faltan datos requeridos'], 400);
        }

        $user = $em->getRepository(User::class)->findOneBy(['email' => $emailAddress]);
        
        if (!$user) {
            return new JsonResponse(['error' => 'Código inválido o expirado'], 400);
        }

        if ($user->getResetPasswordCode() !== $code) {
            return new JsonResponse(['error' => 'Código inválido o expirado'], 400);
        }

        if ($user->getResetPasswordExpiresAt() === null || $user->getResetPasswordExpiresAt() < new \DateTime()) {
            return new JsonResponse(['error' => 'El código ha expirado'], 400);
        }

        $hashedPassword = $passwordHasher->hashPassword($user, $newPassword);
        $user->setPassword($hashedPassword);
        
        // Limpiamos el código
        $user->setResetPasswordCode(null);
        $user->setResetPasswordExpiresAt(null);
        
        $em->flush();

        return new JsonResponse(['message' => 'Contraseña actualizada con éxito']);
    }
}
