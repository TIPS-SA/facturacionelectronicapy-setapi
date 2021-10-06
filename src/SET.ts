import soap from 'soap';
import JSZip from "jszip";

class SET {

    /**
     * Envia el Documento electronico a la SET
     * https://sifen.set.gov.py/de/ws/sync/recibe.wsdl?wsdl
     * @param xml 
     * @returns 
     */
    recibe(env: "test" | "prod", xml: string) : Promise<any>{
        return new Promise(e=>{});
    }
    /**
     * Envia el Documento electronico por lote a la SET
     * https://sifen.set.gov.py/de/ws/async/recibe-lote.wsdl?wsdl
     * @param xmls 
     * @returns 
     */
    async recibeLote(id: number, env: "test" | "prod", xmls: string[]) : Promise<any>{
        if (xmls.length == 0) {
            throw new Error("No se envió datos en el array de Documentos electrónicos XMLs");   
        }
        if (xmls.length > 50) {
            throw new Error("Sólo se permiten un máximo de 50 Documentos electrónicos XML por lote");
        }

        let url = 'https://sifen.set.gov.py/de/ws/async/recibe-lote.wsdl?wsdl';
        if (env == "test") {
            url = 'https://sifen-test.set.gov.py/de/ws/async/recibe-lote.wsdl?wsdl';
        }


        const zip = new JSZip();

        for (let i = 0; i < xmls.length; i++) {
            const element = xmls[i];
            zip.file(
                element
            );
        }
        
        const zipAsBase64 = await zip.generateAsync({ type: "base64" });

        var args = { rEnvioLote: {
            dId : id,
            xDE : zipAsBase64
        }};
        /*var args = { _xml: "<ns1:MyRootElement xmlns:ns1="http://www.example.com/v1/ns1">
                        <ChildElement>elementvalue</ChildElement>
                     </ns1:MyRootElement>"
            };*/

        console.log("dato a enviar...", args);

        console.log("soap", soap);
        return soap.createClient(url, function(err, client) {
            console.log("client", client);
            client.rEnvioLote(args, function(err: any, result: any) {
                
                return new Promise(e=>result);
            });
            
        });
        
    }
}

export default new SET();

