<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class RegistroController extends AbstractController
{
    #[Route('/api/register', name: 'app_register', methods: ['POST'])]
    public function register(
        Request $request, 
        UserPasswordHasherInterface $userPasswordHasher, 
        EntityManagerInterface $entityManager
    ): Response {
        // 1. Recibimos los datos del formulario (JSON)
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email']) || !isset($data['password']) || !isset($data['firstName']) || !isset($data['lastName'])) {
            return $this->json(['detail' => 'Todos los campos son obligatorios (email, password, firstName, lastName)'], 400);
        }

        // 2. Creamos la instancia del nuevo usuario
        $user = new User();
        $user->setEmail($data['email']);
        $user->setFirstName($data['firstName']);
        $user->setLastName($data['lastName']);

        // Asignamos los roles que vienen del frontend, o ROLE_USER por defecto
        $roles = $data['roles'] ?? ['ROLE_USER'];
        $user->setRoles($roles); 
        
        // 3. Encriptamos la contraseña (esto es vital para el Login)
        $hashedPassword = $userPasswordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);

        // 4. Guardamos en la base de datos de Aiven
        try {
            $entityManager->persist($user);
            $entityManager->flush();
        } catch (\Exception $e) {
            return $this->json([
                'detail' => 'Error al guardar en base de datos: ' . $e->getMessage()
            ], 500);
        }

        return $this->json([
            'message' => '¡Usuario creado con éxito!',
            'user' => $user->getUserIdentifier()
        ], 201);
    }
}