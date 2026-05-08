<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Patch;
use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Serializer\Attribute\SerializedName;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
#[ApiResource(
    normalizationContext: ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:write']],
    operations: [
        new GetCollection(),
        new Post(processor: \App\State\UserPasswordHasher::class),
        new Get(),
        new Put(processor: \App\State\UserPasswordHasher::class),
        new Patch(processor: \App\State\UserPasswordHasher::class),
        new Delete(),
    ]
)]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:read', 'ticket:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 180, nullable: false)]
    #[Groups(['user:read', 'user:write', 'ticket:read'])]
    #[Assert\NotBlank]
    private ?string $email = null;

    #[ORM\Column(length: 100, nullable: false)]
    #[Groups(['user:read', 'user:write', 'ticket:read'])]
    #[SerializedName('firstName')]
    private ?string $firstName = null;

    #[ORM\Column(length: 100, nullable: false)]
    #[Groups(['user:read', 'user:write', 'ticket:read'])]
    #[SerializedName('lastName')]
    private ?string $lastName = null;

    #[ORM\Column(type: 'json')]
    #[Groups(['user:read', 'user:write'])]
    private array $roles = [];

    #[ORM\Column(options: ['default' => true])]
    #[Groups(['user:read', 'user:write'])]
    private bool $isActive = true;

    #[ORM\Column(options: ['default' => true])]
    #[Groups(['user:read', 'user:write'])]
    private bool $isOnDuty = true;

    #[ORM\Column(type: 'datetime', nullable: true)]
    #[Groups(['user:read'])]
    private ?\DateTimeInterface $lastActivityAt = null;

    #[ORM\Column]
    private ?string $password = null;

    #[Groups(['user:write'])]
    #[SerializedName('password')]
    private ?string $plainPassword = null;

    #[ORM\OneToMany(mappedBy: 'author', targetEntity: Ticket::class)]
    private Collection $authoredTickets;

    #[ORM\OneToMany(mappedBy: 'agent', targetEntity: Ticket::class)]
    private Collection $assignedTickets;

    public function __construct()
    {
        $this->authoredTickets = new ArrayCollection();
        $this->assignedTickets = new ArrayCollection();
    }

    // ========== MÉTODOS OBLIGATORIOS DE SEGURIDAD ==========

    /**
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * @see UserInterface
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // Garantizamos que cada usuario tenga al menos ROLE_USER
        $roles[] = 'ROLE_USER';
        return array_unique($roles);
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function eraseCredentials(): void
    {
        $this->plainPassword = null;
    }

    // ========== GETTERS Y SETTERS NORMALES ==========

    public function getId(): ?int { return $this->id; }

    public function getEmail(): ?string { return $this->email; }

    public function setEmail(string $email): static { $this->email = $email; return $this; }

    public function getFirstName(): ?string { return $this->firstName; }

    public function setFirstName(string $firstName): static { $this->firstName = $firstName; return $this; }

    public function getLastName(): ?string { return $this->lastName; }

    public function setLastName(string $lastName): static { $this->lastName = $lastName; return $this; }

    public function setRoles(array $roles): static { $this->roles = $roles; return $this; }

    public function setPassword(string $password): static { $this->password = $password; return $this; }

    public function getPlainPassword(): ?string { return $this->plainPassword; }

    public function setPlainPassword(?string $plainPassword): self { $this->plainPassword = $plainPassword; return $this; }

    public function getAuthoredTickets(): Collection { return $this->authoredTickets; }

    public function addAuthoredTicket(Ticket $ticket): static
    {
        if (!$this->authoredTickets->contains($ticket)) {
            $this->authoredTickets->add($ticket);
            $ticket->setAuthor($this);
        }

        return $this;
    }

    public function removeAuthoredTicket(Ticket $ticket): static
    {
        if ($this->authoredTickets->removeElement($ticket)) {
            if ($ticket->getAuthor() === $this) {
                $ticket->setAuthor(null);
            }
        }

        return $this;
    }

    public function getAssignedTickets(): Collection { return $this->assignedTickets; }

    public function addAssignedTicket(Ticket $ticket): static
    {
        if (!$this->assignedTickets->contains($ticket)) {
            $this->assignedTickets->add($ticket);
            $ticket->setAgent($this);
        }

        return $this;
    }

    public function removeAssignedTicket(Ticket $ticket): static
    {
        if ($this->assignedTickets->removeElement($ticket)) {
            if ($ticket->getAgent() === $this) {
                $ticket->setAgent(null);
            }
        }

        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;
        return $this;
    }

    public function isOnDuty(): bool
    {
        return $this->isOnDuty;
    }

    public function setIsOnDuty(bool $isOnDuty): self
    {
        $this->isOnDuty = $isOnDuty;
        return $this;
    }

    public function getLastActivityAt(): ?\DateTimeInterface
    {
        return $this->lastActivityAt;
    }

    public function setLastActivityAt(?\DateTimeInterface $lastActivityAt): self
    {
        $this->lastActivityAt = $lastActivityAt;
        return $this;
    }
}