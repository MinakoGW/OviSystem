<?php

namespace Source\Models;
use Source\Core\Model;
use Source\Core\Connect;

class Sheep extends Model
{
    private ?int $id;
    private ?int $flocksId;
    private ?int $motherId;
    private ?int $fatherId;
    private ?int $number;
    private ?string $eartag;
    private ?int $sex; //não esquecer de trocar de varchar para tinyInt o sex
    private ?int $pregnancy;
    private ?string $birthDate; // coluna do banco: birthdate (sem underscore)
    private ?string $breed;
    private ?int $active;

    public function __construct(?int $id = null, ?int $flocksId = null, ?int $motherId = null, ?int $fatherId = null, ?int $number = null, ?string $eartag = null, ?int $sex = null, ?int $pregnancy = null, ?string $birthDate = null, ?string $breed = null, ?int $active = 1)
    {
        $this->id = $id;
        $this->flocksId = $flocksId;
        $this->motherId = $motherId;
        $this->fatherId = $fatherId;
        $this->number = $number;
        $this->eartag = $eartag;
        $this->sex = $sex;
        $this->pregnancy = $pregnancy;
        $this->birthDate = $birthDate;
        $this->breed = $breed;
        $this->active = $active;

        $this->table = "sheeps";
        $this->primaryKey = "id";
        $this->fillable = ["flocksId", "motherId", "fatherId", "number", "eartag", "sex", "pregnancy", "birthDate", "breed", "active"];
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId($id): void
    {
        $this->id = $id;
    }

    public function getFlocksId(): ?int
    {
        return $this->flocksId;
    }

    public function setFlocksId($flocksId): void
    {
        $this->flocksId = $flocksId;
    }

    public function getMotherId(): ?int
    {
        return $this->motherId;
    }

    public function setMotherId($motherId): void
    {
        $this->motherId = $motherId;
    }

    public function getFatherId(): ?int
    {
        return $this->fatherId;
    }

    public function setFatherId($fatherId): void
    {
        $this->fatherId = $fatherId;
    }

    public function getNumber(): ?int
    {
        return $this->number;
    }

    public function setNumber($number): void
    {
        $this->number = $number;
    }

    public function getEartag(): ?string
    {
        return $this->eartag;
    }

    public function setEartag($eartag): void
    {
        $this->eartag = $eartag;
    }

    public function getSex(): ?int
    {
        return $this->sex;
    }

    public function setSex($sex): void
    {
        $this->sex = $sex;
    }

    public function getPregnancy(): ?int
    {
        return $this->pregnancy;
    }

    public function setPregnancy($pregnancy): void
    {
        $this->pregnancy = $pregnancy;
    }

    public function getBirthDate(): ?string
    {
        return $this->birthDate;
    }

    public function setBirthDate($birthDate): void
    {
        $this->birthDate = $birthDate;
    }

    public function getBreed(): ?string
    {
        return $this->breed;
    }

    public function setBreed($breed): void
    {
        $this->breed = $breed;
    }

    public function getActive(): ?int
    {
        return $this->active;
    }

    public function setActive($active): void
    {
        $this->active = $active;
    }

    /**
     * O banco utiliza a coluna "birthdate" (sem underscore), enquanto
     * o padrão camelCase -> snake_case do Model gera "birth_date".
     */
    protected function extractPayloadFromGetters(): array
    {
        $payload = parent::extractPayloadFromGetters();

        if (array_key_exists("birth_date", $payload)) {
            $payload["birthdate"] = $payload["birth_date"];
            unset($payload["birth_date"]);
        }

        return $payload;
    }
}