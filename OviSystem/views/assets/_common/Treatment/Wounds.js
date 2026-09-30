export default class Vaccines{

    #id;
    #sheepsId;
    #description;
    #date;
    #location;
    #situation;
    #severity;
    #treatment;
    #observation;
    #active;

    constructor({ id = null , sheepsId = null, description = '', date = '', location = '', situation = '' , severity = '', treatment = '' , observation = '', active = 1} = {})
    {
        this.id = id;
        this.sheepsId = sheepsId;
        this.description = description;
        this.date = date;
        this.location = location;
        this.situation = situation;
        this.severity = severity;
        this.treatment = treatment;
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

    get description() {
        return this.#description;
    }

    set description(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("A descrição é obrigatória");
        }
        this.#description = value.trim();
    }

    get date() {
        return this.#date;
    }

    set date(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("A data é obrigatória");
        }
        this.#date = value.trim();
    }

    get location() {
        return this.#location;
    }

    set location(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("A localização é obrigatória");
        }
        this.#location = value.trim();
    }

    get situation() {
        return this.#situation;
    }

    set situation(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("A situação é obrigatória");
        }
        this.#situation = value.trim();
    }

    get severity() {
        return this.#severity;
    }

    set situation(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("A severidade é obrigatória");
        }
        this.#severity = value.trim();
    }
    
    get treatment() {
        return this.#treatment;
    }

    set treatment(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("O tratamento é obrigatório");
        }
        this.#treatment = value.trim();
    }
    

    get observation() {
        return this.#observation;
    }

    set observation(value) {
        this.#observation = value.trim();
    }


    toJSON() {
        return { id: this.id, sheepsId: this.sheepsId, description: this.description, date: this.date, location: this.location, situation: this.situation, severity: this.severity, treatment: this.treatment, observation: this.observation, active: this.active };
    }
}
