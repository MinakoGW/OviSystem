export default class Sheep
{
    #id;
    #flocksId;
    #motherId;
    #fatherId;
    #number;
    #eartagColors =["Amarelo", "Azul", "Branco", "Laranja", "Rosa", "Roxo", "Verde", "Vermelho"];
    #eartag;
    #sex;
    #pregnancy;
    #birthDate;
    #breed;
    #active;

    constructor({id = null, flocksId = null, motherId = null, fatherId = null, number = null, eartag = null, sex = null, pregnancy = null, birthDate = null, breed = null, active = 1} = {})
    {
        this.id = id;
        this.flocksId = flocksId;
        this.motherId = motherId;
        this.fatherId = fatherId;
        this.number = number;
        this.eartag = eartag;
        this.sex = sex;
        this.pregnancy = pregnancy;
        this.birthDate = birthDate;
        this.breed = breed;
        this.active = active;
    }

    get id ()
    {
        return this.#id;
    }

    set id (value)
    {
        this.#id = value === null ? null : Number(value);
    }

    get flocksId ()
    {
        return this.#flocksId;
    }

    set flocksId (value)
    {
        this.#flocksId = value === null ? null : Number(value);
    }

    get motherId ()
    {
        return this.#motherId;
    }

    set motherId (value)
    {
        this.#motherId = value === null ? null : Number(value);
    }

    get fatherId ()
    {
        return this.#fatherId;
    }

    set fatherId(value)
    {
        this.#id = value === null ? null : Number(value);
    }

    get number ()
    {
        return this.#number;
    }

    set number (value)
    {
        const number = Number(value);
        if (!Number.isFinite(number) || number < 0) {
            throw new RangeError("O número da ovelha deve ser um número não negativo");
        }
        this.#number = number;
    }

    get eartagColors ()
    {
        return this.#eartagColors;
    }

    get eartag ()
    {
        return this.#eartag;
    }

    set eartag (value)
    {
        if (this.#eartagColors.includes(value)) 
        {
            this.#eartag = value;
        } 
        else 
        {
            this.#eartag = null;
        }
    }

    get sex ()
    {
        return this.#sex;
    }

    set sex (value)
    {
        if(value !== 1 && value !== 0)
        {
            throw new RangeError("Sexo inválido para a ovelha")
        }
        if(value === 0)
        {
            this.#sex = "Macho";
        }
        else
        {
            this.#sex = "Fêmea";
        }
    }

    get pregnancy ()
    {
        return this.#pregnancy;
    }

    set pregnancy(value) {
        if (value !== 0 && value !== 1) {
            throw new RangeError("Valor de gravidez inválido");
        }

        if (value === 1 && this.#sex !== 2) {
            throw new RangeError("Apenas ovelhas fêmeas podem estar grávidas");
        }

        this.#pregnancy = value;
    }


    get birthDate ()
    {
        return this.#birthDate;
    }

    set birthDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) 
        {
            throw new TypeError("Data deve estar no formato AAAA-MM-DD");
        }

        const date = new Date(`${value}T00:00:00`);

        if (isNaN(date.getTime())) 
        {
            throw new TypeError("Data de nascimento inválida");
        }

        if (date > new Date()) 
        {
            throw new RangeError("A data de nascimento não pode ser futura");
        }

    this.#birthDate = value;
}

    get breed ()
    {
        return this.#breed;
    }

    set breed (value)
    {
        if (typeof value !== "string" || value.trim() === "") 
        {
            throw new TypeError("O nome é obrigatório");
        }
        this.#breed = value.trim();
    }

    get active ()
    {
        return this.#active;
    }

    toJSON() 
    {
        return { id: this.id, flocksId: this.flocksId, motherId: this.motherId, fatherId: this.fatherId, number: this.number, eartag: this.eartag, sex: this.sex, pregnancy: this.pregnancy, birthDate: this.birthDate, breed: this.breed, active: this.active };
    }
}