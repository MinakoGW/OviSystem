export default class Treatments{

    #id;
    #sheepsId;
    #type;
    #startDate;
    #endDate;
    #medications;
    #doseFrequency;
    #veterinarian;
    #observation;
    #active;

    constructor({ id = null , sheepsId = null, type = '', startDate = '', endDate = '', medications = '' , doseFrequency = '', observation = '', active = 1} = {})
    {
        this.id = id;
        this.sheepsId = sheepsId;
        this.type = type;
        this.startDate = startDate;
        this.endDate = endDate;
        this.medications = medications;
        this.doseFrequency = doseFrequency;
        this.veterinarian = veterinarian;
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

    get type() {
        return this.#type;
    }

    set type(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("O nome é obrigatório");
        }
        this.#type = value.trim();
    }

    get startDate() {
        return this.#startDate;
    }

    set startDate(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("A data de aplicação é obrigatória");
        }
        this.#startDate = value.trim();
    }

    get endDate() {
         return this.#endDate;
    }

    set endDate(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("A dosagem é obrigatória");
        }
        this.#endDate = value.trim();
    }

    get medications() {
        return this.#medications;
    }

    set medications(value) {
        if (typeof value !== "string" || value.trim() === "") {
            throw new TypeError("O nome do aplicador é obrigatório");
        }
        this.#medications = value.trim();
    }

    get observation() {
        return this.#observation;
    }

    set observation(value) {
        this.#observation = value.trim();
    }


    toJSON() {
        return { id: this.id, sheepsId: this.sheepsId, type: this.type, startDate: this.startDate, endDate: this.endDate , medications: this.medications, observation: this.observation };
    }
}
