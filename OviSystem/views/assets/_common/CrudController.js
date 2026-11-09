export const CrudControllerProto = {

    init(service, entityFactory) {
        this.service = service;
        this.entityFactory = entityFactory;
        this.items = [];

        return this;
    },

    async list() {
        this.items = await this.service.list();
        return this.items;
    },

    async create(data) {
        const entity = this.entityFactory(data);

        const response = await this.service.create(entity);

        await this.list();

        return response;
    },

    async update(id, data) {
        const entity = this.entityFactory(data);

        const response = await this.service.update(id, entity);

        await this.list();

        return response;
    }
};

export function createCrudController(service, entityFactory) {
    return Object.create(CrudControllerProto).init(
        service,
        entityFactory
    );
}