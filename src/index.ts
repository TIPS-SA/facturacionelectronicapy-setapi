import set from "./SET";

class SetAPI {
  auth = (env: "test" | "prod", certificado: any, passphase: string) => {
    return set.auth(env, certificado, passphase);
  };
  consulta = (id: number, cdc: string): Promise<any> => {
    return set.consulta(id, cdc);
  };
  consultaRUC = (id: number, ruc: string): Promise<any> => {
    return set.consultaRUC(id, ruc);
  };
  consultaLote = (id: number, numeroLote: number): Promise<any> => {
    return set.consultaLote(id, numeroLote);
  };
  recibe = (id: number, xml: string): Promise<any> => {
    return set.recibe(id, xml);
  };
  recibeLote = (id: number, xml: string[]): Promise<any> => {
    return set.recibeLote(id, xml);
  };
  evento = (id: number, xml: string): Promise<any> => {
    return set.evento(id, xml);
  };
}

export default new SetAPI();
