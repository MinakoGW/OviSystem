<?php

namespace Source\Controller;

use Source\Controller\Api;
use Source\Models\Sheep;

class Sheeps extends Api
{
    public function insert (array $data): void
    {
        if(!$this->authToken (2)){
            $this->call(
                401,
                "unauthorized",
                "Usuário não está autenticado (sem token ou token inválido).",
                "error")->back();
            return;
        }

        if(!$this->validateNumber($data)){
            $this->call(
                400,
                "bad_request",
                "O campo number é obrigatório e deve ser um número inteiro",
                "error"
            )->back();
            return;
        }

        $sheep = new Sheep(
            null,
            $data["flocks_id"],
            $data["number"]
        );

        if(!$sheep->insert()){
            $this->call(500, "internal_server_error", $sheep->getErrorMessage(), "error")->back();
            return;
        }
        $response = [
            "id" => $sheep->getId(),
            "flocks_id" =>$sheep->getFlocksId(),
            "number" => $sheep->getNumber(),
            "active" => $sheep->getActive()
        ];

        $this->call(201,"success","Lote inserido com sucesso","success")->back($response);

    }

    public function validateNumber (array $data): bool
    {
        if(!isset($data["number"]) || empty($data["number"]) || !filter_var($data["number"], FILTER_VALIDATE_INT)) {
            return false;
        }
        return true;
    }

    public function update (array $data): void
    {
       $json = json_decode(file_get_contents("php://input"), true);
       $data = array_merge($data, $json ?? []);

        if(!$this->authToken (2)){
            $this->call(
                401,
                "unauthorized",
                "Usuário não está autenticado (sem token ou token inválido).",
                "error")->back();
            return;
        }

        if(!$this->validateNumber($data)){
            $this->call(
                400,
                "bad_request",
                "O campo number é obrigatório e deve ser um inteiro",
                "error"
            )->back();
            return;
        }

        $sheep = new Sheep(
            null,
            $data["flocks_id"],
            $data["number"]
        );
      

        if(!$sheep->updateById($data["sheepId"])){
            $this->call(500, "internal_server_error", $sheep->getErrorMessage(), "error")->back();
            return;
        }
        $response = [
            "id" => $sheep->getId(),
            "flocks_id" => $sheep->getFlocksId(),
            "number" => $sheep->getNumber(),
            "active" => $sheep->getActive()
        ];

        $this->call(200,"success","Lote atualizado com sucesso","success")->back($response);
    }

    public function listAll (array $data): void
    {
        if(!$this->authToken (2)){
            $this->call(
                401,
                "unauthorized",
                "Usuário não está autenticado (sem token ou token inválido).",
                "error")->back();
            return;
        }

        $sheep = new sheep();
        $this->call(200,"success","Lista de lotes","success")->back($sheep->selectAll());
    }

     public function listById(array $data): void
    {

        if(!$this->authToken (2)){
            $this->call(
                401,
                "unauthorized",
                "Usuário não está autenticado (sem token ou token inválido).",
                "error")->back();
            return;
        }

        if(!isset($data["sheepId"]) || empty($data["sheepId"]) || !filter_var($data["sheepId"], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID da ovelha é obrigatório e deve ser um número inteiro",
                "error"
            )->back(null);
            return;
        }

        $sheep = new Sheep();
        if(!$sheep->selectById($data["sheepId"])) {
            $this->call(
                404,
                "not_found",
                "Ovelha não encontrada",
                "error"
            )->back(null);
            return;
        }

        $response = [
            "id" => $sheep->getId(),
            "flocks_id" => $sheep->getFlocksId(),
            "number" => $sheep->getNumber(),
            "active" => $sheep->getActive()
        ];

        $this->call(200,"success","Ovelha encontrada","success")->back($response);
    }
}