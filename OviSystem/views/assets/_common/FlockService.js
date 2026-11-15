import HttpClientBase from "./HttpClientBase.js";
import Flock from "../_common/classes/Flock.js";

export default class FlockService extends HttpClientBase {

    constructor() {
        super();

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Token de autenticação não encontrado.");
        }

        this.setAuthToken(token);
    }

    // Lotes do usuário autenticado: o backend filtra pelo token (GET /Flocks/)
    async list() {
        const response = await this.get("/Flocks/");

        if (response?.type !== "success") {
            throw new Error(response?.message || "Não foi possível listar os lotes.");
        }

        // A API omite "data" quando o usuário ainda não tem lotes
        const lista = Array.isArray(response.data) ? response.data : [];

        return lista.map(data => Flock.fromJSON(data));
    }

    async find(id) {
        const response = await this.get(`/Flocks/${id}`);

        if (!response.data) {
            throw new Error("Lote não encontrado.");
        }

        return Flock.fromJSON(response.data);
    }

    create(flock) {
        return this.post("/Flocks/", flock.toJSON());
    }

    update(id, flock) {
        return this.put(`/Flocks/${id}`, flock.toJSON());
    }

    // Renomeia o lote: só o nome é enviado (o dono vem do token no backend)
    async rename(id, name) {
        const response = await this.put(`/Flocks/${id}`, { name });

        if (response?.type !== "success") {
            throw new Error(response?.message || "Erro ao renomear lote.");
        }

        return response.data;
    }

    // O ID já vai na URL; o DELETE não envia body
    remove(id) {
        return this.delete(`/Flocks/delete/${id}`);
    }
}