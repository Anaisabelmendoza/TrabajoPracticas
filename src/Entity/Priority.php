<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use App\Repository\PriorityRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: PriorityRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['priority:read']],
    denormalizationContext: ['groups' => ['priority:write']],
    operations: [
        new Get(),
        new GetCollection(),
        new Post(security: "is_granted('ROLE_ADMIN')"),
        new Patch(security: "is_granted('ROLE_ADMIN')"),
        new Delete(security: "is_granted('ROLE_ADMIN')")
    ]
)]
class Priority
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['priority:read', 'ticket:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['priority:read', 'ticket:read', 'priority:write'])]
    private ?string $name = null;

    #[ORM\Column(type: \Doctrine\DBAL\Types\Types::INTEGER, options: ['default' => 24])]
    #[Groups(['priority:read', 'priority:write'])]
    private ?int $slaHours = 24;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getSlaHours(): ?int
    {
        return $this->slaHours;
    }

    public function setSlaHours(int $slaHours): static
    {
        $this->slaHours = $slaHours;

        return $this;
    }
}
