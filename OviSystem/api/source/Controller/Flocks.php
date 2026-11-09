<?php

namespace Source\Controller;

use Source\Controller\Api;
use Source\Models\Flock;

class Flocks extends Api
{
    public function insert (array $data): void
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

        if(!$this->validate($data)){
            $this->call(
                400,
                "bad_request",
                "O campo nome é obrigatório",
                "error"
            )->back();
            return;
        }

        $flock = new Flock(
            null,
            $data["users_id"],
            $data["name"]
        );

        if(!$flock->insert()){
            $this->call(500, "internal_server_error", $flock->getErrorMessage(), "error")->back();
            return;
        }
        $response = [
            "id" => $flock->getId(),
            "users_id" => $flock->getUsersId(),
            "name" => $flock->getName(),
            "active" => $flock->getActive()
        ];

        $this->call(201,"success","Lote inserido com sucesso","success")->back($response);

    }

    public function validate (array $data): bool
    {
        if(!isset($data["name"]) || empty($data["name"])) {
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

        if(!filter_var($data["flockId"], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID do usuário é obrigatório e deve ser um número inteiro",
                "error"
            )->back();
            return;
        }

        if(!$this->validate($data)){
            $this->call(
                400,
                "bad_request",
                "O campo Name é obrigatório...",
                "error"
            )->back();
            return;
        }

        $flock = new Flock(
            null,
            $data["users_id"],
            $data["name"]
        );
      

        if(!$flock->updateById($data["flockId"])){
            $this->call(500, "internal_server_error", $flock->getErrorMessage(), "error")->back();
            return;
        }
        $response = [
            "id" => $flock->getId(),
            "users_id" => $flock->getUsersId(),
            "name" => $flock->getName(),
            "active" => $flock->getActive()
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

        $flock = new Flock();
        $this->call(200,"success","Lista de lotes","success")->back($flock->selectAll(["active = 1"]));
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

        if(!isset($data["flockId"]) || empty($data["flockId"]) || !filter_var($data["flockId"], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID do lote é obrigatório e deve ser um número inteiro",
                "error"
            )->back(null);
            return;
        }

        $flock = new Flock();
        if(!$flock->selectById($data["flockId"])) {
            $this->call(
                404,
                "not_found",
                "Lote não encontrado",
                "error"
            )->back(null);
            return;
        }

        $response = [
            "id" => $flock->getId(),
            "users_id" => $flock->getUsersId(),
            "name" => $flock->getName(),
            "active" => $flock->getActive()
        ];

        $this->call(200,"success","Lote encontrado","success")->back($response);
    }
    
    public function delete(array $data): void
    {
        if(!$this->authToken (2)){
            $this->call(
                401,
                "unauthorized",
                "Usuário não está autenticado (sem token ou token inválido).",
                "error")->back();
            return;
        }

        if (!isset($data["flockId"]) || !filter_var($data["flockId"], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID inválido",
                "error"
            )->back();
            return;
        }

        $flock = new Flock();

        if (!$flock->softDeleteById((int) $data["flockId"])) {
            $this->call(
                404,
                "not_found",
                $flock->getErrorMessage(),
                "error"
            )->back();
            return;
        }

        $this->call(
            200,
            "success",
            "Lote desativado com sucesso",
            "success"
        )->back();
    }
}