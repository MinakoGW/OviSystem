<?php

namespace Source\Controller;

use Source\Core\Connect;
use Source\Models\Flock;
use Source\Models\Sheep;
use Source\Models\SheepImage;
use Source\Support\Upload;

class SheepImages extends Api
{
    private const MAX_FILES = 10;
    private const PUBLIC_PATH = "uploads/sheeps/";

    /**
     * POST /Sheeps/{sheepId}/images  (multipart: images[] ou image, alt_text opcional)
     * Tudo ou nada: se qualquer arquivo for rejeitado ou o banco falhar,
     * nenhum arquivo novo fica em disco e nenhum registro é criado.
     */
    public function insert(array $data): void
    {
        if (!$this->authToken(2)) {
            $this->unauthorized();
            return;
        }

        $sheepId = $this->validId($data["sheepId"] ?? null);
        if ($sheepId === null) {
            $this->call(400, "bad_request", "ID da ovelha inválido.", "error")->back();
            return;
        }

        if (!$this->authorizeSheep($sheepId)) {
            return;
        }

        $files = $this->normalizeFiles();
        if (empty($files)) {
            // post_max_size excedido: o PHP descarta $_FILES e $_POST por completo
            $message = (empty($_FILES) && (int) ($_SERVER["CONTENT_LENGTH"] ?? 0) > 0)
                ? "O envio excede o limite de tamanho do servidor."
                : "Selecione ao menos uma imagem para enviar.";
            $this->call(400, "bad_request", $message, "error")->back();
            return;
        }

        if (count($files) > self::MAX_FILES) {
            $this->call(400, "bad_request", "Envie no máximo " . self::MAX_FILES . " imagens por vez.", "error")->back();
            return;
        }

        // 1) Grava os arquivos (a validação real é feita pela classe Upload)
        $uploadDirectory = $this->uploadDirectory();
        $uploader = new Upload($uploadDirectory);
        $saved = [];

        foreach ($files as $file) {
            try {
                $saved[] = $uploader->image($file);
            } catch (\RuntimeException $exception) {
                $this->removeFiles($saved, $uploadDirectory);
                $this->call(400, "bad_request", $exception->getMessage(), "error")->back();
                return;
            }
        }

        // 2) Persiste os metadados em transação
        $altText = $this->cleanAltText($_POST["alt_text"] ?? null);
        $basePosition = count((new SheepImage())->selectBySheep($sheepId));
        $pdo = Connect::getInstance();
        $created = [];

        try {
            $pdo->beginTransaction();

            foreach ($saved as $index => $filename) {
                $image = new SheepImage(
                    null,
                    $sheepId,
                    self::PUBLIC_PATH . $filename,
                    $altText,
                    $basePosition + $index
                );

                if (!$image->insert()) {
                    throw new \RuntimeException($image->getErrorMessage() ?? "Falha ao salvar a imagem.");
                }

                $created[] = $this->present([
                    "id" => $image->getId(),
                    "sheeps_id" => $image->getSheepsId(),
                    "image_path" => $image->getImagePath(),
                    "alt_text" => $image->getAltText(),
                    "position" => $image->getPosition(),
                ]);
            }

            $pdo->commit();
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $this->removeFiles($saved, $uploadDirectory);
            error_log("Falha ao salvar imagens da ovelha: " . $exception->getMessage());
            $this->call(500, "internal_server_error", "Não foi possível salvar as imagens.", "error")->back();
            return;
        }

        $this->call(201, "success", "Imagens enviadas com sucesso.", "success")->back($created);
    }

    /**
     * GET /Sheeps/{sheepId}/images
     */
    public function listBySheep(array $data): void
    {
        if (!$this->authToken(2)) {
            $this->unauthorized();
            return;
        }

        $sheepId = $this->validId($data["sheepId"] ?? null);
        if ($sheepId === null) {
            $this->call(400, "bad_request", "ID da ovelha inválido.", "error")->back();
            return;
        }

        if (!$this->authorizeSheep($sheepId)) {
            return;
        }

        $rows = (new SheepImage())->selectBySheep($sheepId);

        $this->call(200, "success", "Imagens da ovelha", "success")
            ->back(array_map(fn(array $row) => $this->present($row), $rows));
    }

    /**
     * DELETE /Sheeps/{sheepId}/images/{imageId}
     * Remove o registro primeiro e só então o arquivo.
     */
    public function delete(array $data): void
    {
        if (!$this->authToken(2)) {
            $this->unauthorized();
            return;
        }

        $sheepId = $this->validId($data["sheepId"] ?? null);
        $imageId = $this->validId($data["imageId"] ?? null);
        if ($sheepId === null || $imageId === null) {
            $this->call(400, "bad_request", "IDs inválidos.", "error")->back();
            return;
        }

        if (!$this->authorizeSheep($sheepId)) {
            return;
        }

        $image = new SheepImage();
        if (!$image->selectByIdAndSheep($imageId, $sheepId)) {
            $this->call(404, "not_found", "Imagem não encontrada para esta ovelha.", "error")->back();
            return;
        }

        $path = $image->getImagePath();

        if (!$image->deleteByIdAndSheep($imageId, $sheepId)) {
            $this->call(500, "internal_server_error", "Não foi possível remover a imagem.", "error")->back();
            return;
        }

        // Registro já removido; agora apaga o arquivo (basename evita path traversal)
        if ($path !== null && $path !== "") {
            $file = $this->uploadDirectory() . DIRECTORY_SEPARATOR . basename($path);
            if (is_file($file) && !unlink($file)) {
                error_log("Não foi possível remover o arquivo da imagem {$imageId}.");
            }
        }

        $this->call(200, "success", "Imagem removida com sucesso.", "success")->back();
    }

    // ------------------------------------------------------------------
    // Auxiliares
    // ------------------------------------------------------------------

    /**
     * A ovelha precisa existir, estar ativa e pertencer a um lote do usuário autenticado
     * (ovelha -> lote -> users_id). Responde 404/403 e devolve false se não passar.
     */
    private function authorizeSheep(int $sheepId): bool
    {
        $sheep = new Sheep();
        if (!$sheep->selectById($sheepId) || (int) $sheep->getActive() === 0) {
            $this->call(404, "not_found", "Ovelha não encontrada.", "error")->back();
            return false;
        }

        $flock = new Flock();
        if (!$flock->selectById((int) $sheep->getFlocksId())
            || (int) $flock->getUsersId() !== (int) $this->userAuthId) {
            $this->call(403, "forbidden", "Você não tem permissão para acessar esta ovelha.", "error")->back();
            return false;
        }

        return true;
    }

    private function unauthorized(): void
    {
        $this->call(
            401,
            "unauthorized",
            "Usuário não está autenticado (sem token ou token inválido).",
            "error"
        )->back();
    }

    private function validId($value): ?int
    {
        $id = filter_var($value, FILTER_VALIDATE_INT);
        return ($id !== false && $id > 0) ? $id : null;
    }

    private function uploadDirectory(): string
    {
        return dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . "uploads" . DIRECTORY_SEPARATOR . "sheeps";
    }

    /**
     * Converte $_FILES["images"] (formato aninhado do PHP) em uma lista de arquivos
     * individuais, aceitando também o campo único "image".
     */
    private function normalizeFiles(): array
    {
        $files = [];

        foreach (["images", "image"] as $field) {
            if (!isset($_FILES[$field]) || !is_array($_FILES[$field])) {
                continue;
            }

            $input = $_FILES[$field];

            if (is_array($input["name"])) {
                foreach ($input["name"] as $i => $name) {
                    if (($input["error"][$i] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
                        continue;
                    }
                    $files[] = [
                        "name" => $name,
                        "type" => $input["type"][$i] ?? "",
                        "tmp_name" => $input["tmp_name"][$i] ?? "",
                        "error" => $input["error"][$i],
                        "size" => $input["size"][$i] ?? 0,
                    ];
                }
            } elseif (($input["error"] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
                $files[] = $input;
            }
        }

        return $files;
    }

    private function cleanAltText($value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);
        return $value === "" ? null : mb_substr($value, 0, 255);
    }

    private function removeFiles(array $filenames, string $directory): void
    {
        foreach ($filenames as $filename) {
            $file = $directory . DIRECTORY_SEPARATOR . basename($filename);
            if (is_file($file) && !unlink($file)) {
                error_log("Não foi possível remover o arquivo temporário {$filename}.");
            }
        }
    }

    private function present(array $row): array
    {
        return [
            "id" => (int) $row["id"],
            "sheeps_id" => (int) $row["sheeps_id"],
            "image_path" => $row["image_path"],
            "url" => url(ltrim((string) $row["image_path"], "/")),
            "alt_text" => $row["alt_text"],
            "position" => (int) $row["position"],
        ];
    }
}