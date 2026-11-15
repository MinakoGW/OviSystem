import HttpClientBase from "./HttpClientBase.js";

export default class SheepsService extends HttpClientBase {

    constructor() {
        super();

        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Token de autenticação não encontrado.");
        }

        this.setAuthToken(token);
    }

    // Ovelhas ativas de um lote (GET /Sheeps/flock/{flockId})
    async listByFlock(flockId) {
        const response = await this.get(`/Sheeps/flock/${flockId}`);

        if (response?.type !== "success") {
            throw new Error(response?.message || "Não foi possível listar as ovelhas.");
        }

        // A API retorna a chave primária como "Id" (I maiúsculo),
        // enquanto o frontend utiliza "id". Normalizamos aqui para que
        // os cartões, a galeria e as demais telas usem sempre o mesmo campo.
        if (!Array.isArray(response.data)) return [];

        return response.data.map(ovelha => ({
            ...ovelha,
            id: Number(ovelha.id ?? ovelha.Id)
        }));
    }

    // Cadastra uma ovelha em um lote (POST /Sheeps/ com JSON)
    // `dados` aceita: flocks_id, number, sex, pregnancy, eartag, breed, birth_date, mother_id, father_id
    async create(dados) {
        const response = await this.post("/Sheeps/", dados);

        if (response?.type !== "success") {
            throw new Error(response?.message || "Erro ao cadastrar ovelha.");
        }

        return response.data;
    }
}