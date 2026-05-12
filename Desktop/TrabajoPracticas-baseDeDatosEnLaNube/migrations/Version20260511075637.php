<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260511075637 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE work_log (id INT AUTO_INCREMENT NOT NULL, date DATE NOT NULL, minutes_spent INT NOT NULL, description VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, ticket_id INT NOT NULL, agent_id INT NOT NULL, INDEX IDX_F5513F59700047D2 (ticket_id), INDEX IDX_F5513F593414710B (agent_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('ALTER TABLE work_log ADD CONSTRAINT FK_F5513F59700047D2 FOREIGN KEY (ticket_id) REFERENCES ticket (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE work_log ADD CONSTRAINT FK_F5513F593414710B FOREIGN KEY (agent_id) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE comment DROP FOREIGN KEY `FK_9474526CF675F31B`');
        $this->addSql('ALTER TABLE comment CHANGE author_id author_id INT NOT NULL');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT FK_9474526CF675F31B FOREIGN KEY (author_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE ticket DROP FOREIGN KEY `FK_97A0ADA33414710B`');
        $this->addSql('ALTER TABLE ticket DROP FOREIGN KEY `FK_97A0ADA3F675F31B`');
        $this->addSql('ALTER TABLE ticket DROP agent_name_fallback, CHANGE author_id author_id INT NOT NULL');
        $this->addSql('ALTER TABLE ticket ADD CONSTRAINT FK_97A0ADA33414710B FOREIGN KEY (agent_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE ticket ADD CONSTRAINT FK_97A0ADA3F675F31B FOREIGN KEY (author_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE ticket_history DROP FOREIGN KEY `FK_2B762919A76ED395`');
        $this->addSql('ALTER TABLE ticket_history ADD CONSTRAINT FK_2B762919A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE work_log DROP FOREIGN KEY FK_F5513F59700047D2');
        $this->addSql('ALTER TABLE work_log DROP FOREIGN KEY FK_F5513F593414710B');
        $this->addSql('DROP TABLE work_log');
        $this->addSql('ALTER TABLE comment DROP FOREIGN KEY FK_9474526CF675F31B');
        $this->addSql('ALTER TABLE comment CHANGE author_id author_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT `FK_9474526CF675F31B` FOREIGN KEY (author_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE SET NULL');
        $this->addSql('ALTER TABLE ticket DROP FOREIGN KEY FK_97A0ADA3F675F31B');
        $this->addSql('ALTER TABLE ticket DROP FOREIGN KEY FK_97A0ADA33414710B');
        $this->addSql('ALTER TABLE ticket ADD agent_name_fallback VARCHAR(255) DEFAULT NULL, CHANGE author_id author_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE ticket ADD CONSTRAINT `FK_97A0ADA3F675F31B` FOREIGN KEY (author_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE SET NULL');
        $this->addSql('ALTER TABLE ticket ADD CONSTRAINT `FK_97A0ADA33414710B` FOREIGN KEY (agent_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE SET NULL');
        $this->addSql('ALTER TABLE ticket_history DROP FOREIGN KEY FK_2B762919A76ED395');
        $this->addSql('ALTER TABLE ticket_history ADD CONSTRAINT `FK_2B762919A76ED395` FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE SET NULL');
    }
}
