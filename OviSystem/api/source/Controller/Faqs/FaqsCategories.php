<?php

namespace source\Controller\Faqs;

use Source\Controller\Api;
use Source\Models\Faq\FaqCategory;

class FaqsCategories extends Api
{

    public function listAll (array $data): void
    {
        $faqCategory = new FaqCategory();
        $this->call(200,"success","Lista de categorias de FAQ","success")->back($faqCategory->selectAll());
    }

    public function listById(array $data): void
    {

        if(!isset($data["categoryId"]) || empty($data["categoryId"]) || !filter_var($data["categoryId"], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID da categoria é obrigatório e deve ser um número inteiro",
                "error"
            )->back(null);
            return;
        }

        $faqCategory = new FaqCategory();
        if(!$faqCategory->selectById($data["categoryId"])) {
            $this->call(
                404,
                "not_found",
                "Categoria não encontrada",
                "error"
            )->back(null);
            return;
        }

        $response = [
            "id" => $faqCategory->getId(),
            "name" => $faqCategory->getName(),
            "active" => $faqCategory->getActive()
        ];

        $this->call(200,"success","Categoria encontrada","success")->back($response);
    }

    public function insert (array $data): void
    {
        if(!$this->validate($data)){
            $this->call(
                400,
                "bad_request",
                "O campo name é obrigatório",
                "error"
            )->back();
            return;
        }

        $faqCategory = new FaqCategory(
            null,
            $data["name"]
        );

        if(!$faqCategory->insert()){
            $this->call(500, "internal_server_error", $faqCategory->getErrorMessage(), "error")->back();
            return;
        }
        $response = [
            "id" => $faqCategory->getId(),
            "name" => $faqCategory->getName()
        ];

        $this->call(201,"success","FAQ inserido com sucesso","success")->back($response);

    }

    public function validate (array $data): bool
    {
        if(!isset($data["name"])  ||
            empty($data["name"])) 
        {
            return false;
        }
        return true;
    }

    public function update (array $data): void
    {

    $json = json_decode(file_get_contents("php://input"), true);
    $data = array_merge($data, $json ?? []);

        if(!filter_var($data["categoryId"], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID da categoria é obrigatório e deve ser um número inteiro",
                "error"
            )->back();
            return;
        }

        if(!$this->validate($data)){
            $this->call(
                400,
                "bad_request",
                "Os campos name são obrigatórios",
                "error"
            )->back();
            return;
        }

        $faqsCategory = new FaqCategory(
            null,
            $data["name"]
        );
      

        if(!$faqsCategory->updateById($data["categoryId"])){
            $this->call(500, "internal_server_error", $faqsCategory->getErrorMessage(), "error")->back();
            return;
        }
        $response = [
            "id" => $faqsCategory->getId(),
            "name" => $faqsCategory->getName(),
            "active" => $faqsCategory->getActive()
        ];

        $this->call(200,"success","Categoria de FAQ atualizada com sucesso","success")->back($response);
    }

    public function delete(array $data): void
    {
    
        $json = json_decode(file_get_contents("php://input"), true);
        $data = array_merge($data, $json ?? []);

    
        if (!isset($data["faqId"]) || !filter_var($data["faqId"], FILTER_VALIDATE_INT)) 
            {
            $this->call(
                400,
                "bad_request",
                "ID inválido",
                "error"
            )->back();
            return;
            }

        $faqCategory = new FaqCategory();

        if (!$faqCategory->softDeleteById($data["faqId"])) {
            $this->call(
                404,
                "not_found",
                $faqCategory->getErrorMessage(),
                "error"
            )->back();
            return;
        }

        $this->call(
            200,
            "success",
            "FAQ desativada com sucesso",
            "success"
        )->back();
}

}