<?php

error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
// timezone para São Paulo América
date_default_timezone_set('America/Sao_Paulo');

ob_start();

require  __DIR__ . "/vendor/autoload.php";

// os headers abaixo são necessários para permitir o acesso a API por clientes externos ao domínio
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header('Access-Control-Allow-Credentials: true'); // Permitir credenciais

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

use CoffeeCode\Router\Router;
// localhost/acme-3am/api
$route = new Router(url("api"),":");

$route->namespace("Source\Controller");
// localhost/acme-3am/api/hello
$route->get("/hello", "Api:hello");

$route->group("/users");
$route->post("/register","Users:register"); // Registrar usuário comum
$route->post("/login","Users:auth"); // login de usuário comum
$route->put("/update","Users:update"); // update de usuário comum
$route->post("/register-admin","Users:registerAdmin"); // Registrar usuário admin NÃO IMPLEMENTADO
$route->post("/login-admin","Users:authAdmin"); // login de usuário admin
$route->put("/update-admin","Users:updateAdmin");
$route->post("/photo","Users:uploadPhoto");
$route->group(null);

$route->group("/faqs");
$route->get("/list", "faqs\Faqs:listAll");
$route->get("/list/{faqId}", "faqs\Faqs:listById");
$route->get("/category/{categoryId}","faqs\Faqs:listByCategory");
$route->post("/", "faqs\Faqs:insert");
$route->put("/{faqId}", "faqs\Faqs:update");
$route->delete("/delete/{faqId}", "faqs\Faqs:delete");
$route->group(null);

$route->group("/faqs-categories");
$route->get("/list", "faqs\FaqsCategories:listAll");
$route->get("/list/{categoryId}", "faqs\FaqsCategories:listById");
$route->post("/", "faqs\FaqsCategories:insert");
$route->put("/{categoryId}", "faqs\FaqsCategories:update");
$route->delete("/delete/{faqId}", "faqs\FaqsCategories:delete");
$route->group(null);

$route->group("/Flocks");
$route->post("/", "Flocks:insert");
$route->get("/", "Flocks:listAll");
$route->get("/{flockId}", "Flocks:listById");
$route->put("/{flockId}", "Flocks:update");
$route->delete("/delete/{flockId}", "Flocks:delete");
$route->group(null);

$route->group("/Sheeps");
$route->post("/", "Sheeps:insert");
$route->get("/", "Sheeps:listAll");
$route->get("/{sheepId}", "Sheeps:listById");
$route->put("/{sheepId}", "Sheeps:update");
$route->group(null);

$route->group("/Vaccines");
$route->post("/", "Vaccines:insert");
$route->group(null);

$route->group("/Dewormings");
$route->post("/", "Dewormings:insert");
$route->group(null);

$route->group("/Diseases");
$route->post("/", "Diseases:insert");
$route->get("/", "Diseases:listAll");
$route->put("/{diseaseId}", "Diseases:update");
$route->group(null);

$route->group("/Treatments");
$route->post("/", "Treatments:insert");
$route->get("/", "Treatments:listAll");
$route->group(null);

$route->dispatch();

/** ERROR REDIRECT */
if ($route->error()) {
    header('Content-Type: application/json; charset=UTF-8');
    //http_response_code(404);

    echo json_encode([
        "code" => 404,
        "status" => "not_found",
        "message" => "URL não encontrada"
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

}

ob_end_flush();