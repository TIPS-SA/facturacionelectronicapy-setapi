export type XmlInput = {
   id: number,
   cdc?: string,
   numeroProtocolo?: number
   ruc?: string,
   xml?: string
   zipAsBase64?: string
}


export type XmlOperation = {
   [index: string]: string,
   consulta: string,
   consultaLote: string,
   consultaRUC: string,
   recibe: string,
   recibeLote: string
}
