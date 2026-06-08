<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Comment;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mime\Address;

class CommentAuthorProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
        private readonly MailerInterface $mailer
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $isNewComment = false;

        if ($data instanceof Comment) {
            $isNewComment = $data->getId() === null;

            // Asignar autor si no tiene
            if (!$data->getAuthor()) {
                $user = $this->security->getUser();
                if ($user) {
                    $data->setAuthor($user);
                }
            }

            // REAPERTURA AUTOMÁTICA
            $ticket = $data->getTicket();
            if ($ticket && in_array($ticket->getStatus(), ['Resuelto', 'Cerrado'])) {
                $oldStatus = $ticket->getStatus();
                $ticket->setStatus('Nuevo');
                
                // Forzamos actualización de timestamp para que suba en el kanban
                $ticket->updateTimestamps();
            }
        }

        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        if ($isNewComment && $data instanceof Comment) {
            $ticket = $data->getTicket();
            $commentAuthor = $data->getAuthor();
            $ticketClient = $ticket?->getAuthor();

            $systemEmails = ['anaisabelmendozajurado@gmail.com', 'soporte@helpdesk.com'];
            
            // Si el autor del comentario NO es el cliente del ticket, asumimos que es el agente/admin
            // y enviamos un email al cliente.
            if ($ticket && $ticketClient && $commentAuthor && $ticketClient->getId() !== $commentAuthor->getId()) {
                $recipientEmail = $ticketClient->getEmail();
                
                // Evitar auto-enviarnos correos a la bandeja de la empresa
                if (!in_array(strtolower($recipientEmail), $systemEmails)) {
                    try {
                        $email = (new TemplatedEmail())
                            ->from(new Address('soporte@helpdesk.com', 'HelpDesk Soporte'))
                            ->replyTo(new Address('soporte@helpdesk.com', 'HelpDesk Soporte'))
                            ->to($recipientEmail)
                            ->subject(sprintf('Nuevo mensaje en tu incidencia #%d', $ticket->getId()))
                            ->htmlTemplate('emails/new_message.html.twig')
                            ->context([
                                'clientName' => $ticketClient->getFirstName() ?: 'Cliente',
                                'agentName' => $commentAuthor->getFirstName() . ' ' . $commentAuthor->getLastName(),
                                'ticketId' => $ticket->getId(),
                                'subject' => $ticket->getTitle(),
                                'messageContent' => $data->getContent(),
                                'ticketUrl' => (getenv('DEFAULT_URI') ?: 'http://localhost:4200') . '/tickets/' . $ticket->getId()
                            ]);

                        $this->mailer->send($email);
                    } catch (\Exception $e) {
                        file_put_contents('/tmp/mailer_error.log', date('Y-m-d H:i:s') . ' Error enviando correo de nuevo mensaje: ' . $e->getMessage() . "\n", FILE_APPEND);
                        error_log('Error enviando correo de nuevo mensaje: ' . $e->getMessage());
                    }
                }
            }
        }

        return $result;
    }
}
