<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class [B[AController extends AbstractController{
    #[Route('//b/a', name: 'app__b_a')]
    public function index(): Response
    {
        return $this->render('[b[a/index.html.twig', [
            'controller_name' => '[B[AController',
        ]);
    }
}
