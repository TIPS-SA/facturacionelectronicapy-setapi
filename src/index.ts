import set from './SET';

class SetAPI {
    recibe = (env: "test" | "prod", xml: string) : Promise<any> => {
        return set.recibe(env, xml);
    }
    recibeLote = (id: number, env: "test" | "prod", xml: string[]) : Promise<any> => {
        return set.recibeLote(id, env, xml);
    }
}

export default new SetAPI();
