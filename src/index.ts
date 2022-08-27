import set from "./SET";
import { SetApiConfig } from "./type.interface.";

class SetAPI {
  consulta = (
    id: number,
    cdc: string,
    env: "test" | "prod",
    cert: any,
    key: string,
    config?: SetApiConfig 
  ): Promise<any> => {
    return set.consulta(id, cdc, env, cert, key, config);
  };
  consultaRUC = (
    id: number,
    ruc: string,
    env: "test" | "prod",
    cert: any,
    key: string,
    config?: SetApiConfig 
  ): Promise<any> => {
    return set.consultaRUC(id, ruc, env, cert, key, config);
  };
  consultaLote = (
    id: number,
    numeroLote: number,
    env: "test" | "prod",
    cert: any,
    key: string,
    config?: SetApiConfig 
  ): Promise<any> => {
    return set.consultaLote(id, numeroLote, env, cert, key, config);
  };
  recibe = (
    id: number,
    xml: string,
    env: "test" | "prod",
    cert: any,
    key: string,
    config?: SetApiConfig 
  ): Promise<any> => {
    return set.recibe(id, xml, env, cert, key, config);
  };
  recibeLote = (
    id: number,
    xml: string[],
    env: "test" | "prod",
    cert: any,
    key: string,
    config?: SetApiConfig 
  ): Promise<any> => {
    return set.recibeLote(id, xml, env, cert, key, config);
  };
  evento = (
    id: number,
    xml: string,
    env: "test" | "prod",
    cert: any,
    key: string,
    config?: SetApiConfig 
  ): Promise<any> => {
    return set.evento(id, xml, env, cert, key, config);
  };
}

export default new SetAPI();
