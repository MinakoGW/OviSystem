export default class Vaccines{

    #id;
    #sheepsId;
    #name;
    #aplicationDate;
    #dose;
    #aplicator;
    #observation;
    #active;

    constructor({ id = null , sheepsId = null, name = '', aplicationDate = '', dose = '', aplicator = '' , observation = '', active = 1} = {})
    {
        this.id = id;
        this.sheepsId = sheepsId;
        this.name = name;
        this.aplicationDate = aplicationDate;
        this.dose = dose;
        this.aplicator = aplicator;
        this.observation = observation;

    }

    get id(){
        return this.#id;
    }
    
    set id(value)
    {
        this.#id = value === null ? null : Number(value)
    }

    get sheepsId(){
        return this.#sheepsId;
    }
    
    set sheepsId(value)
    {
        this.#sheepsId = value === null ? null : Number(value)
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

    get aplicationDate() {
        return this.#aplicationDate;
    }

    set aplicationDate(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("A data de aplicação é obrigatória");
        }
        this.#aplicationDate = value.trim();
    }

    get dose() {
        return this.#dose;
    }

    set dose(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("A dosagem é obrigatória");
        }
        this.#dose = value.trim();
    }

    get aplicator() {
        return this.#aplicator;
    }

    set aplicator(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("O nome do aplicador é obrigatório");
        }
        this.#aplicator = value.trim();
    }

    get observation() {
        return this.#observation;
    }

    set observation(value) {
        this.#observation = value.trim();
    }


    toJSON() {
        return { id: this.id, sheepsId: this.sheepsId, name: this.name, aplicationDate: this.aplicationDate, dose: this.dose , aplicator: this.aplicator, observation: this.observation, active: this.active };
    }
}
