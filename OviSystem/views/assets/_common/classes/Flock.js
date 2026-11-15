export default class Flock {
    #id;
    #usersId;
    #name;
    #active;

    constructor({
        id = null,
        users_id = null,
        name = "",
        active = 1
    } = {}) {
        this.id = id;
        this.usersId = users_id;
        this.name = name;
        this.active = active;
    }

    get id() {
        return this.#id;
    }

    set id(value) {
        this.#id = value == null ? null : Number(value);
    }

    get usersId() {
        return this.#usersId;
    }

    set usersId(value) {
        this.#usersId = value == null ? null : Number(value);
    }

    get name() {
        return this.#name;
    }

    set name(value) {
        if (typeof value !== "string" || !value.trim()) {
            throw new TypeError("O nome do lote é obrigatório.");
        }

        this.#name = value.trim();
    }

    get active() {
        return this.#active;
    }

    set active(value) {
        this.#active = Number(value) === 0 ? 0 : 1;
    }

    toJSON() {
        return {
            name: this.name,
            users_id: this.usersId,
        };
    }

    static fromJSON(data) {
        return new Flock(data);
    }
}