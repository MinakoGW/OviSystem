export default class Flocks{

    #id;
    #userId;
    #name;
    #active;

    constructor({ id = null , userId = null, name = '', active = 1} = {})
    {
        this.id = id;
        this.userId = userId;
        this.name = name;
    }

    get id(){
        return this.#id;
    }
    
    set id(value)
    {
        this.#id = value === null ? null : Number(value)
    }

    get userId(){
        return this.#userId;
    }
    
    set userId(value)
    {
        this.#userId = value === null ? null : Number(value)
    }

    get name() {
        return this.#name;
    }

    set name(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("O nome é obrigatório");
        }
        this.#name = value.trim();
    }


    toJSON() {
        return { id: this.id, userId: this.userId, name: this.name, active: this.active};
    }
}
