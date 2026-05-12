<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity]
#[ApiResource(
    normalizationContext: ['groups' => ['worklog:read']],
    denormalizationContext: ['groups' => ['worklog:write']],
    operations: [
        new GetCollection(),
        new Post(security: "is_granted('ROLE_AGENT')"),
        new Get(),
        new Delete(security: "is_granted('ROLE_ADMIN') or object.getAgent() == user"),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['agent' => 'exact'])]
class WorkLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['worklog:read', 'ticket:read', 'user:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'workLogs')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['worklog:read', 'worklog:write'])]
    private ?Ticket $ticket = null;

    #[ORM\ManyToOne(inversedBy: 'workLogs')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['worklog:read', 'worklog:write'])]
    private ?User $agent = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['worklog:read', 'worklog:write', 'ticket:read', 'user:read'])]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column]
    #[Groups(['worklog:read', 'worklog:write', 'ticket:read', 'user:read'])]
    private ?int $minutesSpent = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['worklog:read', 'worklog:write', 'ticket:read', 'user:read'])]
    private ?string $description = null;

    #[ORM\Column]
    #[Groups(['worklog:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->date = new \DateTime(); // Fecha actual por defecto
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTicket(): ?Ticket
    {
        return $this->ticket;
    }

    public function setTicket(?Ticket $ticket): static
    {
        $this->ticket = $ticket;

        return $this;
    }

    public function getAgent(): ?User
    {
        return $this->agent;
    }

    public function setAgent(?User $agent): static
    {
        $this->agent = $agent;

        return $this;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): static
    {
        $this->date = $date;

        return $this;
    }

    public function getMinutesSpent(): ?int
    {
        return $this->minutesSpent;
    }

    public function setMinutesSpent(int $minutesSpent): static
    {
        $this->minutesSpent = $minutesSpent;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }
}
