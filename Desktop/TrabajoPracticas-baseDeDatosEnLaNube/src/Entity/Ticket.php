<?php

namespace App\Entity;

use App\Repository\TicketRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use App\State\TicketOwnerProcessor;
use Symfony\Component\Serializer\Annotation\Groups;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

#[ORM\Entity(repositoryClass: TicketRepository::class)]
#[ApiResource(
    operations: [
        new Get(security: "is_granted('ROLE_ADMIN') or is_granted('ROLE_AGENT') or object.getOwner() == user or object.getAssignee() == user"),
        new GetCollection(),
        new Post(security: "is_granted('ROLE_USER')", processor: TicketOwnerProcessor::class),
        new Patch(security: "is_granted('ROLE_ADMIN') or is_granted('ROLE_AGENT') or object.getOwner() == user or object.getAssignee() == user"),
        new Delete(security: "is_granted('ROLE_ADMIN') or object.getOwner() == user")
    ],
    normalizationContext: ['groups' => ['ticket:read']],
    denormalizationContext: ['groups' => ['ticket:write']],
)]
#[ApiFilter(SearchFilter::class, properties: ['status' => 'exact', 'priority.id' => 'exact', 'category.id' => 'exact'])]
#[ApiFilter(OrderFilter::class, properties: ['createdAt', 'priority'])]
class Ticket
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ticket:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ticket:read', 'ticket:write'])]
    #[Assert\NotBlank(message: 'El título no puede estar vacío.')]
    #[Assert\Length(min: 3, minMessage: 'El título debe tener al menos {{ limit }} caracteres.')]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['ticket:read', 'ticket:write'])]
    #[Assert\NotBlank(message: 'La descripción no puede estar vacía.')]
    private ?string $description = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ticket:read', 'ticket:write'])]
    #[Assert\NotBlank]
    private ?string $status = 'Nuevo';

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['ticket:read', 'ticket:write'])]
    #[Assert\NotNull(message: 'La prioridad es obligatoria.')]
    private ?Priority $priority = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['ticket:read'])]
    private ?User $owner = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private ?User $assignee = null;

    #[ORM\ManyToOne(targetEntity: Category::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private ?Category $category = null;

    #[ORM\Column]
    #[Groups(['ticket:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'ticket', targetEntity: Evidence::class, orphanRemoval: true)]
    #[Groups(['ticket:read'])]
    private Collection $evidences;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->evidences = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getPriority(): ?Priority
    {
        return $this->priority;
    }

    public function setPriority(?Priority $priority): static
    {
        $this->priority = $priority;
        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;
        return $this;
    }

    public function getCategory(): ?Category
    {
        return $this->category;
    }

    public function setCategory(?Category $category): static
    {
        $this->category = $category;
        return $this;
    }

    public function getAssignee(): ?User
    {
        return $this->assignee;
    }

    public function setAssignee(?User $assignee): static
    {
        $this->assignee = $assignee;
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

    /**
     * @return Collection<int, Evidence>
     */
    public function getEvidences(): Collection
    {
        return $this->evidences;
    }

    public function addEvidence(Evidence $evidence): static
    {
        if (!$this->evidences->contains($evidence)) {
            $this->evidences->add($evidence);
            $evidence->setTicket($this);
        }

        return $this;
    }

    public function removeEvidence(Evidence $evidence): static
    {
        if ($this->evidences->removeElement($evidence)) {
            // set the owning side to null (unless already changed)
            if ($evidence->getTicket() === $this) {
                $evidence->setTicket(null);
            }
        }

        return $this;
    }

    #[Assert\Callback]
    public function validateAssignee(ExecutionContextInterface $context): void
    {
        if ($this->assignee !== null) {
            $roles = $this->assignee->getRoles();
            if (!in_array('ROLE_AGENT', $roles) && !in_array('ROLE_ADMIN', $roles)) {
                $context->buildViolation('Solo se puede asignar el ticket a un Agente o Administrador.')
                    ->atPath('assignee')
                    ->addViolation();
            }
        }
    }
}