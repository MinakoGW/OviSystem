<?php

namespace Source\Models;

use PDO;
use PDOException;
use Source\Core\Connect;
use Source\Core\Model;

/**
 * Metadados das imagens vinculadas a uma ovelha.
 * A tabela guarda o caminho do arquivo, não o conteúdo binário da imagem.
 */
class SheepImage extends Model
{
    private ?int $id;
    private ?int $sheepsId;
    private ?string $imagePath;
    private ?string $altText;
    private ?int $position;

    public function __construct(
        ?int $id = null,
        ?int $sheepsId = null,
        ?string $imagePath = null,
        ?string $altText = null,
        ?int $position = null
    ) {
        $this->id = $id;
        $this->sheepsId = $sheepsId;
        $this->imagePath = $imagePath;
        $this->altText = $altText;
        $this->position = $position;

        $this->table = 'sheep_images';
        $this->primaryKey = 'id';
        $this->fillable = ['sheepsId', 'imagePath', 'altText', 'position'];
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId($id): void
    {
        $this->id = $id === null ? null : (int) $id;
    }

    public function getSheepsId(): ?int
    {
        return $this->sheepsId;
    }

    public function setSheepsId($sheepsId): void
    {
        $this->sheepsId = $sheepsId === null ? null : (int) $sheepsId;
    }

    public function getImagePath(): ?string
    {
        return $this->imagePath;
    }

    public function setImagePath(?string $imagePath): void
    {
        $this->imagePath = $imagePath;
    }

    public function getAltText(): ?string
    {
        return $this->altText;
    }

    public function setAltText(?string $altText): void
    {
        $this->altText = $altText;
    }

    public function getPosition(): ?int
    {
        return $this->position;
    }

    public function setPosition($position): void
    {
        $this->position = $position === null ? null : (int) $position;
    }

    /** Retorna as imagens da ovelha na ordem definida para o carrossel. */
    public function selectBySheep(int $sheepId): array
    {
        try {
            $sql = "SELECT id, sheeps_id, image_path, alt_text, position
                    FROM {$this->table}
                    WHERE sheeps_id = :sheeps_id
                    ORDER BY position ASC, id ASC";

            $stmt = Connect::getInstance()->prepare($sql);
            $stmt->bindValue(':sheeps_id', $sheepId, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $exception) {
            $this->errorMessage = $exception->getMessage();
            return [];
        }
    }

    /** Carrega uma imagem somente se ela pertencer à ovelha informada. */
    public function selectByIdAndSheep(int $imageId, int $sheepId): bool
    {
        try {
            $sql = "SELECT id, sheeps_id, image_path, alt_text, position
                    FROM {$this->table}
                    WHERE id = :id AND sheeps_id = :sheeps_id
                    LIMIT 1";

            $stmt = Connect::getInstance()->prepare($sql);
            $stmt->bindValue(':id', $imageId, PDO::PARAM_INT);
            $stmt->bindValue(':sheeps_id', $sheepId, PDO::PARAM_INT);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                $this->errorMessage = 'Imagem não encontrada.';
                return false;
            }

            $this->setId((int) $row['id']);
            $this->setSheepsId((int) $row['sheeps_id']);
            $this->setImagePath($row['image_path']);
            $this->setAltText($row['alt_text']);
            $this->setPosition((int) $row['position']);

            return true;
        } catch (PDOException $exception) {
            $this->errorMessage = $exception->getMessage();
            return false;
        }
    }

    /** Exclui somente o registro que corresponde à imagem e à ovelha. */
    public function deleteByIdAndSheep(int $imageId, int $sheepId): bool
    {
        try {
            $sql = "DELETE FROM {$this->table}
                    WHERE id = :id AND sheeps_id = :sheeps_id";

            $stmt = Connect::getInstance()->prepare($sql);
            $stmt->bindValue(':id', $imageId, PDO::PARAM_INT);
            $stmt->bindValue(':sheeps_id', $sheepId, PDO::PARAM_INT);
            $stmt->execute();

            if ($stmt->rowCount() !== 1) {
                $this->errorMessage = 'Imagem não encontrada ou já removida.';
                return false;
            }

            return true;
        } catch (PDOException $exception) {
            $this->errorMessage = $exception->getMessage();
            return false;
        }
    }
}
