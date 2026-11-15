<?php

namespace source\Controller\Faqs;

use Source\Controller\Api;
use Source\Models\Faq\Faq;

class Faqs extends Api
{

    public function listAll (array $data): void
    {
        $faq = new Faq();
        $this->call(200,"success","Lista de FAQs","success")->back($faq->selectAll());
    }

   public function listById(array $data): void
    {

        if(!isset($data["faqId"]) || empty($data["faqId"]) || !filter_var($data["faqId"], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID da FAQ é obrigatório e deve ser um número inteiro",
                "error"
            )->back(null);
            return;
        }

        $faq = new Faq();
        if(!$faq->selectById($data["faqId"])) {
            $this->call(
                404,
                "not_found",
                "FAQ não encontrada",
                "error"
            )->back(null);
            return;
        }

        $response = [
            "id" => $faq->getId(),
            "faqs_category_id" => $faq->getFaqsCategoryId(),
            "question" => $faq->getQuestion(),
            "answer" => $faq->getAnswer(),
            "active" => $faq->getActive()
        ];

        $this->call(200,"success","FAQ encontrada","success")->back($response);
    }

    public function listByCategory(array $data): void
    {
        if (!isset($data["categoryId"]) || empty($data["categoryId"]) || !filter_var($data["categoryId"], FILTER_VALIDATE_INT)) {
            $this->call(400, "bad_request", "ID da categoria é obrigatório e deve ser um número inteiro", "error")->back();
            return;
        }

        $faq = new Faq();
        $categoryId = (int)$data["categoryId"];

        $this->call(200, "success", "Lista de FAQs por categoria", "success")
            ->back($faq->selectAll(["active = 1", "faqs_categories_id = {$categoryId}"]));
    }

    public function insert (array $data): void
    {
        if(!$this->validate($data)){
            $this->call(
                400,
                "bad_request",
                "Os campos question, answer e faqs_category_id são obrigatórios",
                "error"
            )->back();
            return;
        }

        $faq = new Faq(
            null,
            $data["faqs_category_id"],
            $data["question"],
            $data["answer"]
        );

        if(!$faq->insert()){
            $this->call(500, "internal_server_error", $faq->getErrorMessage(), "error")->back();
            return;
        }
        $response = [
            "id" => $faq->getId(),
            "faqs_category_id" => $faq->getFaqsCategoryId(),
            "question" => $faq->getQuestion(),
            "answer" => $faq->getAnswer(),
            "active" => $faq->getActive()
        ];

        $this->call(201,"success","FAQ inserido com sucesso","success")->back($response);

    }

    public function update (array $data): void
    {
       $json = json_decode(file_get_contents("php://input"), true);
       $data = array_merge($data, $json ?? []);

        if(!filter_var($data["faqId"], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID da FAQ é obrigatório e deve ser um número inteiro",
                "error"
            )->back();
            return;
        }

        if(!$this->validate($data)){
            $this->call(
                400,
                "bad_request",
                "Os campos question, answer e faqs_category_id são obrigatórios",
                "error"
            )->back();
            return;
        }

        $faq = new Faq(
            null,
            $data["faqs_category_id"],
            $data["question"],
            $data["answer"]
        );
      

        if(!$faq->updateById($data["faqId"])){
            $this->call(500, "internal_server_error", $faq->getErrorMessage(), "error")->back();
            return;
        }
        $response = [
            "id" => $faq->getId(),
            "faqsCategoryId" => $faq->getFaqsCategoryId(),
            "question" => $faq->getQuestion(),
            "answer" => $faq->getAnswer(),
            "active" => $faq->getActive()
        ];

        $this->call(200,"success","FAQ atualizada com sucesso","success")->back($response);
    }

    public function validate (array $data): bool
    {
        if(!isset($data["faqs_category_id"]) || !isset($data["question"]) || !isset($data["answer"]) ||
            empty($data["faqs_category_id"]) || empty($data["question"]) || empty($data["answer"]) ||
           !filter_var($data["faqs_category_id"], FILTER_VALIDATE_INT)) {
            return false;
        }
        return true;
    }

    public function delete(array $data): void
    {
    
        $json = json_decode(file_get_contents("php://input"), true);
        $data = array_merge($data, $json ?? []);

    
        if (!isset($data["faqId"]) || !filter_var($data["faqId"], FILTER_VALIDATE_INT)) {
            $this->call(
                400,
                "bad_request",
                "ID inválido",
                "error"
            )->back();
            return;
        }

        $faq = new Faq();

    
        if (!$faq->softDeleteById($data["faqId"])) {
            $this->call(
                404,
                "not_found",
                $faq->getErrorMessage(),
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