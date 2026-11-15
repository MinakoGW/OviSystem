import HttpClientBase from "./HttpClientBase.js";

export default class SheepImageService extends HttpClientBase {

    constructor() {
        super();

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Token de autenticação não encontrado.");
        }

        this.setAuthToken(token);
    }

    // Lista as imagens já persistidas da ovelha
    async list(sheepId) {
        const response = await this.get(`/Sheeps/${sheepId}/images`);

        if (response?.type !== "success") {
            throw new Error(response?.message || "Não foi possível listar as imagens.");
        }

        // A API omite "data" quando a lista está vazia
        return Array.isArray(response.data) ? response.data : [];
    }

    // Envia uma ou mais imagens (FormData, campo images[]).
    // O Content-Type NÃO é definido aqui: o HttpClientBase remove o header
    // quando o corpo é FormData, e o navegador gera o boundary.
    async upload(sheepId, files, altText = "") {
        const formData = new FormData();

        for (const file of files) {
            formData.append("images[]", file);
        }

        if (altText) {
            formData.append("alt_text", altText);
        }

        const response = await this.post(`/Sheeps/${sheepId}/images`, formData);

        if (response?.type !== "success") {
            throw new Error(response?.message || "Erro ao enviar imagens.");
        }

        return response.data;
    }

    // Remove uma imagem específica, sem afetar as demais
    async remove(sheepId, imageId) {
        const response = await this.delete(`/Sheeps/${sheepId}/images/${imageId}`);

        if (response?.type !== "success") {
            throw new Error(response?.message || "Erro ao remover imagem.");
        }

        return response;
    }
}