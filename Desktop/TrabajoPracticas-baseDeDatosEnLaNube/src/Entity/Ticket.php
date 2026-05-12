<?php

namespace App\Entity;

use App\Repository\TicketRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: TicketRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['ticket:read']],
    denormalizationContext: ['groups' => ['ticket:write']],
    operations: [
        new GetCollection(),
        new Post(processor: \App\State\TicketAuthorProcessor::class),
        new Get(security: "is_granted('ROLE_AGENT') or object.getAuthor() == user"),
        new Put(security: "is_granted('ROLE_AGENT') or object.getAuthor() == user"),
        new Patch(security: "is_granted('ROLE_AGENT') or object.getAuthor() == user"),
        new Delete(security: "is_granted('ROLE_ADMIN') or object.getAuthor() == user"),
        new Post(
            uriTemplate: '/tickets-claim/{id}',
            processor: \App\State\TicketClaimProcessor::class,
            security: "is_granted('ROLE_AGENT')",
            input: false,
            read: true,
            status: 200
        ),
    ]
)]
class Ticket
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ticket:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private ?string $description = null;

    #[ORM\Column(length: 255)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private ?string $status = 'Nuevo'; // Estado por defecto

    #[ORM\Column(length: 255)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private ?string $priority = 'Media'; // Prioridad por defecto

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private bool $deletedByUser = false;

    #[ORM\ManyToOne(inversedBy: 'authoredTickets')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['ticket:read'])]
    private ?User $author = null;

    #[ORM\ManyToOne(inversedBy: 'assignedTickets')]
    #[Groups(['ticket:read', 'ticket:write'])]
    private ?User $agent = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private ?Category $category = null;

    #[ORM\Column]
    #[Groups(['ticket:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'ticket', targetEntity: Comment::class, cascade: ['remove'])]
    #[Groups(['ticket:read'])]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    private Collection $comments;

    #[ORM\OneToMany(mappedBy: 'ticket', targetEntity: TicketHistory::class, cascade: ['remove'])]
    #[Groups(['ticket:read'])]
    #[ORM\OrderBy(['createdAt' => 'DESC'])]
    private Collection $history;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['ticket:read', 'ticket:write'])]
    private ?array $attachments = null;

    #[ORM\OneToMany(mappedBy: 'ticket', targetEntity: WorkLog::class, cascade: ['remove'])]
    #[Groups(['ticket:read'])]
    #[ORM\OrderBy(['createdAt' => 'DESC'])]
    private Collection $workLogs;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->comments = new ArrayCollection();
        $this->history = new ArrayCollection();
        $this->workLogs = new ArrayCollection();
        $this->status = 'Nuevo';
        $this->priority = 'Media';
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

    public function getPriority(): ?string
    {
        return $this->priority;
    }

    public function setPriority(string $priority): static
    {
        $this->priority = $priority;
        return $this;
    }

    public function isDeletedByUser(): bool
    {
        return $this->deletedByUser;
    }

    public function setDeletedByUser(bool $deletedByUser): static
    {
        $this->deletedByUser = $deletedByUser;
        return $this;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;
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

    public function getCategory(): ?Category
    {
        return $this->category;
    }

    public function setCategory(?Category $category): static
    {
        $this->category = $category;
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
     * @return Collection<int, Comment>
     */
    public function getComments(): Collection
    {
        return $this->comments;
    }

    public function addComment(Comment $comment): static
    {
        if (!$this->comments->contains($comment)) {
            $this->comments->add($comment);
            $comment->setTicket($this);
        }

        return $this;
    }

    public function removeComment(Comment $comment): static
    {
        if ($this->comments->removeElement($comment)) {
            // set the owning side to null (unless already changed)
            if ($comment->getTicket() === $this) {
                $comment->setTicket(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, TicketHistory>
     */
    public function getHistory(): Collection
    {
        return $this->history;
    }

    public function addHistory(TicketHistory $history): static
    {
        if (!$this->history->contains($history)) {
            $this->history->add($history);
            $history->setTicket($this);
        }

        return $this;
    }

    public function removeHistory(TicketHistory $history): static
    {
        if ($this->history->removeElement($history)) {
            // set the owning side to null (unless already changed)
            if ($history->getTicket() === $this) {
                $history->setTicket(null);
            }
        }

        return $this;
    }

    public function getAttachments(): ?array
    {
        return $this->attachments;
    }

    public function setAttachments(?array $attachments): static
    {
        $this->attachments = $attachments;

        return $this;
    }

    /**
     * @return Collection<int, WorkLog>
     */
    public function getWorkLogs(): Collection
    {
        return $this->workLogs;
    }

    public function addWorkLog(WorkLog $workLog): static
    {
        if (!$this->workLogs->contains($workLog)) {
            $this->workLogs->add($workLog);
            $workLog->setTicket($this);
        }

        return $this;
    }

    public function removeWorkLog(WorkLog $workLog): static
    {
        if ($this->workLogs->removeElement($workLog)) {
            // set the owning side to null (unless already changed)
            if ($workLog->getTicket() === $this) {
                $workLog->setTicket(null);
            }
        }

        return $this;
    }
}