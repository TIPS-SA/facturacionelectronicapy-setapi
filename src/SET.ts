//const soap = require('soap');
//import soap from 'soap';
import JSZip from "jszip";
import pkcs12 from "./PKCS12";
import fs from 'fs'; 
import xml2js from 'xml2js'; 

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
    recibeLote(id: number, env: "test" | "prod", xmls: string[]) : Promise<any>{

        return new Promise( async (resolve, reject) => {
            try {
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
        
                let rLoteDEXml = `<rLoteDE>\n`;
                for (let i = 0; i < xmls.length; i++) {
                    const xml = xmls[i].split('\n').slice(1).join('\n');    //Retirar xml
                    
                    rLoteDEXml += `${xml}\n`;
                }
                rLoteDEXml += `</rLoteDE>`;
                //console.log("Enviar: " + rLoteDEXml);
        
                zip.file(`xml_file.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n${rLoteDEXml}`);
                
                const zipAsBase64 = await zip.generateAsync({ type: "base64" });
                //fs.writeFileSync(__dirname + '/zipped.zip', zipAsBase64);
        
                const httpsAgent = new https.Agent({
                    cert: Buffer.from(this.cert, 'utf8'),
                    key: Buffer.from(this.key, 'utf8')
                });
        
                //axios.get(`${url}`, { httpsAgent }).then((respuesta: any) => {
                    //console.log("respuesta", respuesta.data);
        
        
                let xmlData=`<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">\n\
                            <soap:Header/>\n\
                            <soap:Body>\n\
                                <rEnvioLote xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                                    <dId>${id}</dId>\n\
                                    <xDE>${zipAsBase64}</xDE>\n\
                                </rEnvioLote>\n\
                                ${rLoteDEXml}
                            </soap:Body>\n\
                        </soap:Envelope>\n`;
                //console.log(xmlData);
                axios.post(`${url}`, xmlData, {headers:
                    {'Content-Type': 'text/xml'}, 
                    httpsAgent 
                }).then((respuestaSuccess: any) => {
        
                    console.log(respuestaSuccess.data);
                }).catch((err:any) => {
                    if (err && err.response && err.response.data) {
                        var xmlResponse = err.response.data;
                        var parser = new xml2js.Parser({explicitArray: false});
        
                        parser.parseStringPromise(xmlResponse).then(function (result) {
                            resolve(result['env:Envelope']['env:Body']['ns2:rRetEnviDe']['ns2:rProtDe']);
                        })
                        .catch(function (err) {
                            throw err;
                        });
                    } else {
                        throw err;
                    }
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default new SET();

