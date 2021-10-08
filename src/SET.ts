//const soap = require('soap');
//import soap from 'soap';
import JSZip from "jszip";
import pkcs12 from "./PKCS12";
import fs from 'fs'; 

const https = require('https');
const axios = require('axios');

class SET {
    private cert: any; 
    private key: any;

    /**
     * Crea los certificados para authenticarse a la SET.
     * @param certificado 
     * @param passphase 
     */
    auth(certificado: any, passphase: string){
        pkcs12.openFile(certificado, passphase);

        this.cert = pkcs12.getCertificate();
        this.key = pkcs12.getPrivateKey();
    }

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

        if (!this.cert) {
            throw new Error("Antes debe Autenticarse");
        }

        if (!this.key) {
            throw new Error("Antes debe autenticarse");
        }

        const zip = new JSZip();

        for (let i = 0; i < xmls.length; i++) {
            const xml = xmls[i];
            zip.file(`xml_${i+1}`, xml);
        }
        
        const zipAsBase64 = await zip.generateAsync({ type: "base64" });
        //fs.writeFileSync(__dirname + '/zipped.zip', zipAsBase64);

        const httpsAgent = new https.Agent({
            cert: Buffer.from(this.cert, 'utf8'),
            key: Buffer.from(this.key, 'utf8')
        });

        axios.get(`${url}`, { httpsAgent }).then((respuesta: any) => {
            //console.log("respuesta", respuesta.data);


            let xmls=`<soapenv:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">\n\
                        <soapenv:Header/>\n\
                        <soapenv:Body>\n\
                            <rEnvioLote xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                                <dId>${id}</dId>\n\
                                <xDE>${zipAsBase64}</xDE>\n\
                            </rEnvioLote>\n\
                        </soapenv:Body>\n\
                    </soapenv:Envelope>`;
            console.log(xmls);
            axios.post(`${url}`, xmls, { 
                httpsAgent 
            }).then((respuesta2: any) => {

                console.log(respuesta2.data);
            });
        });

        
        return new Promise(e=>{});
        
    }
    private generateRandom(min: number, max: number) {  
        return Math.floor(
          Math.random() * (max - min) + min
        );
    }
}

export default new SET();

