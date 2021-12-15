import set from "./SET";

class SetAPI {
  /*auth = (env: "test" | "prod", certificado: any, passphase: string) => {
    return set.auth(env, certificado, passphase);
  };*/
  consulta = (id: number, cdc: string, env: "test" | "prod", cert: any, key: string): Promise<any> => {
    return set.consulta(id, cdc, env, cert, key);
  };
  consultaRUC = (id: number, ruc: string, env: "test" | "prod", cert: any, key: string): Promise<any> => {
    return set.consultaRUC(id, ruc, env, cert, key);
  };
  consultaLote = (id: number, numeroLote: number, env: "test" | "prod", cert: any, key: string): Promise<any> => {
    return set.consultaLote(id, numeroLote, env, cert, key);
  };
  recibe = (id: number, xml: string, env: "test" | "prod", cert: any, key: string): Promise<any> => {
    return set.recibe(id, xml, env, cert, key);
  };
  recibeLote = (id: number, xml: string[], env: "test" | "prod", cert: any, key: string): Promise<any> => {
    return set.recibeLote(id, xml, env, cert, key);
  };
  evento = (id: number, xml: string, env: "test" | "prod", cert: any, key: string): Promise<any> => {
    return set.evento(id, xml, env, cert, key);
  };
}

export default new SetAPI();
