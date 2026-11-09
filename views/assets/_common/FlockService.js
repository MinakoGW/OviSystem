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

    async list() {
        const response = await this.get("/Flocks/");

        if (!Array.isArray(response.data)) {
            throw new Error("A API não retornou uma lista de lotes válida.");
        }

        return response.data.map(data => Flock.fromJSON(data));
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

    // O ID já vai na URL; o DELETE não envia body
    remove(id) {
        return this.delete(`/Flocks/delete/${id}`);
    }
}