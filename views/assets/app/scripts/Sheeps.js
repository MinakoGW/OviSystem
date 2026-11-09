import HttpClientBase from "../../_common/HttpClientBase.js";

export default class Sheeps extends HttpClientBase {
    async listAll() {
        return this.get("/sheeps");
    }

    async listById(id) {
        return this.get("/sheeps/:sheepId", { id });
    }

    async insert(data) {
        return this.post("/sheeps", data);
    }

    async update(id, data) {
        return this.put("/sheeps/:sheepId", data, { id });
    }

    async remove(id) {
        return this.delete("/sheeps/:sheepId", { id });
    }
}