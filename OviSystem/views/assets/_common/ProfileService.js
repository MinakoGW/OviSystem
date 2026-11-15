import HttpClientBase from "./HttpClientBase.js";

// Mesma base usada pelo HttpClientBase por padrão
const API_BASE = "http://localhost/OviSystem/api";

export default class ProfileService extends HttpClientBase {

    constructor() {
        super(API_BASE);

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Token de autenticação não encontrado.");
        }

        this.setAuthToken(token);
    }

    // Envia a foto do usuário autenticado. O campo multipart se chama "photo"
    // (contrato do Users::uploadPhoto). O Content-Type é definido pelo navegador.
    // Devolve a URL pública da nova foto.
    async uploadPhoto(file) {
        const formData = new FormData();
        formData.append("photo", file);

        const response = await this.post("/users/photo", formData);

        if (response?.type !== "success" || !response.data?.photo) {
            throw new Error(response?.message || "Erro ao enviar a foto.");
        }

        return response.data.photo;
    }

    // Dados do usuário autenticado (GET /users/me)
    async getMe() {
        const response = await this.get("/users/me");

        if (response?.type !== "success" || !response.data) {
            throw new Error(response?.message || "Não foi possível carregar o perfil.");
        }

        return response.data;
    }

    // Atualiza nome, e-mail e fazenda (PUT /users/update, JSON).
    // A API devolve um token novo (o e-mail faz parte do token): já o guarda.
    async updateData({ name, email, farm }) {
        return this.#update({ name, email, farm });
    }

    // Troca a senha (exige a senha atual)
    async changePassword(currentPassword, newPassword) {
        return this.#update({ current_password: currentPassword, new_password: newPassword });
    }

    async #update(payload) {
        const response = await this.put("/users/update", payload);

        if (response?.type !== "success") {
            throw new Error(response?.message || "Não foi possível atualizar o perfil.");
        }

        if (response.data?.token) {
            localStorage.setItem("token", response.data.token);
            this.setAuthToken(response.data.token);
        }

        return response.data;
    }

    // Converte o caminho salvo no banco (ex.: uploads/users/abc.jpg) em URL pública.
    // Se já for uma URL completa, devolve como está.
    static resolvePublicUrl(path) {
        if (typeof path !== "string" || !path.trim()) return null;
        if (/^https?:\/\//i.test(path)) return path;

        return new URL(`../${path.replace(/^\/+/, "")}`, `${API_BASE}/`).href;
    }
}