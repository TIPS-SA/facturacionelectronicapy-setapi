import JSZip from "jszip";
import pkcs12 from "./PKCS12";
import xml2js from 'xml2js'; 

const https = require('https');
const axios = require('axios');

class SET {
    private env: any; 
    private cert: any; 
    private key: any;

    /**
     * Crea los certificados para authenticarse a la SET.
     * @param certificado 
     * @param passphase 
     */
    auth(env: "test" | "prod", certificado: any, passphase: string){
        pkcs12.openFile(certificado, passphase);
        this.env = env;
        this.cert = pkcs12.getCertificate();
        this.key = pkcs12.getPrivateKey();
    }

    /**
     * 
     * @param xml 
     * @returns 
     */
    consulta(id: number, xml: string) : Promise<any>{
        return new Promise( async (resolve, reject) => {
            try {
                let url = 'https://sifen.set.gov.py/de/ws/async/consulta.wsdl';
                if (this.env == "test") {
                    url = 'https://sifen-test.set.gov.py/de/ws/async/consulta.wsdl';
                }
        
                if (!this.cert) {
                    throw new Error("Antes debe Autenticarse");
                }
        
                if (!this.key) {
                    throw new Error("Antes debe autenticarse");
                }
        
                const httpsAgent = new https.Agent({
                    cert: Buffer.from(this.cert, 'utf8'),
                    key: Buffer.from(this.key, 'utf8')
                });
                
                xml = xml.split('\n').slice(1).join('\n');    //Retirar <xml>

                let soapXMLData=`<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">\n\
                            <env:Header/>\n\
                            <env:Body>\n\
                                <rEnviDe xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                                    <dId>${id}</dId>\n\
                                    <xDe>${xml}</xDe>\n\
                                </rEnviDe>\n\
                            </env:Body>\n\
                        </env:Envelope>\n`;
                //console.log(soapXMLData);
                soapXMLData = this.normalizeXML(soapXMLData);

                //console.log(soapXMLData);
                axios.post(`${url}`, soapXMLData, {
                    headers: {
                        'User-Agent' : 'tipsCloudFAC',
                        'Content-Type' : 'application/xml; charset=utf-8'
                    }, 
                    httpsAgent 
                }).then((respuestaSuccess: any) => {
        
                    console.log(respuestaSuccess.data);
                    var parser = new xml2js.Parser({explicitArray: false});
        
                    parser.parseStringPromise(respuestaSuccess.data).then(function (result) {
                        const resultData = result['env:Envelope']['env:Body'];
                        //delete resultData.$;
                        resolve(resultData);
                    })

                }).catch((err:any) => {
                    if (err && err.response && err.response.data) {
                        var xmlResponse = err.response.data;
                        var parser = new xml2js.Parser({explicitArray: false});
        
                        parser.parseStringPromise(xmlResponse).then(function (result) {
                            const resultData = result['env:Envelope']['env:Body']['ns2:rRetEnviDe']['ns2:rProtDe'];
                            delete resultData.$;
                            resolve(resultData);
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
    
    /**
     * Consulta un lote en la SET
     * @param id 
     * @param numeroProtocolo 
     * @returns 
     */
    consultaLote(id: number, numeroProtocolo: number) : Promise<any>{
        return new Promise( async (resolve, reject) => {
            try {
                let url = 'https://sifen.set.gov.py/de/ws/consltas/consulta-lote.wsdl';
                if (this.env == "test") {
                    url = 'https://sifen-test.set.gov.py/de/ws/consultas/consulta-lote.wsdl';
                }
        
                if (!this.cert) {
                    throw new Error("Antes debe Autenticarse");
                }
        
                if (!this.key) {
                    throw new Error("Antes debe autenticarse");
                }
        
                const httpsAgent = new https.Agent({
                    cert: Buffer.from(this.cert, 'utf8'),
                    key: Buffer.from(this.key, 'utf8')
                });
                
                let soapXMLData=`<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">\n\
                            <env:Header/>\n\
                            <env:Body>\n\
                                <rEnviConsLoteDe  xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                                    <dId>${id}</dId>\n\
                                    <dProtConsLote>${numeroProtocolo}</dProtConsLote>\n\
                                </rEnviConsLoteDe>\n\
                            </env:Body>\n\
                        </env:Envelope>\n`;
                //console.log(soapXMLData);
                soapXMLData = this.normalizeXML(soapXMLData);

                console.log(soapXMLData);
                axios.post(`${url}`, soapXMLData, {
                    headers : {
                        'User-Agent': 'tipsCloudFAC',
                        'Content-Type' : 'application/xml; charset=utf-8'
                    }, 
                    httpsAgent 
                }).then((respuestaSuccess: any) => {
        
                    console.log(respuestaSuccess.data);
                    var parser = new xml2js.Parser({explicitArray: false});
        
                    parser.parseStringPromise(respuestaSuccess.data).then(function (result) {
                        const resultData = JSON.parse(JSON.stringify(result['env:Envelope']['env:Body']['ns2:rResEnviConsLoteDe']));
                        delete resultData.$;
                        resolve(resultData);
                    })

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

    /**
     * 
     * @param xml 
     * @returns 
     */
     consultaRUC(id: number, ruc: string) : Promise<any>{
        return new Promise( async (resolve, reject) => {
            try {
                let url = 'https://sifen.set.gov.py/de/ws/consultas/consulta-ruc.wsdl';
                if (this.env == "test") {
                    url = 'https://sifen-test.set.gov.py/de/ws/consultas/consulta-ruc.wsdl';
                }
        
                if (!this.cert) {
                    throw new Error("Antes debe Autenticarse");
                }
        
                if (!this.key) {
                    throw new Error("Antes debe autenticarse");
                }
        
                const httpsAgent = new https.Agent({
                    cert: Buffer.from(this.cert, 'utf8'),
                    key: Buffer.from(this.key, 'utf8'),
                    /*maxVersion: "TLSv1.2",
                    minVersion: "TLSv1.2",
                    secureOptions : constants.SSL_OP_NO_SSLv2 | constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1*/
                });
                
                let soapXMLData=`<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">\n\
                            <env:Header/>\n\
                            <env:Body>\n\
                                <rEnviConsRUC xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                                    <dId>${id}</dId>\n\
                                    <dRUCCons>${ruc}</dRUCCons>\n\
                                </rEnviConsRUC>\n\
                            </env:Body>\n\
                        </env:Envelope>\n`;
                //console.log(soapXMLData);
                soapXMLData = this.normalizeXML(soapXMLData);

//                console.log(soapXMLData);

                axios.post(`${url}`, /*'<?xml version="1.0" encoding="UTF-8" ?>' +*/ soapXMLData, {
                    headers : {
                        'User-Agent': 'tipsCloudFAC', 
                        'Content-Type' : 'application/xml; charset=utf-8',
                    },
                    httpsAgent 
                }).then((respuestaSuccess: any) => {
        
                    //console.log(respuestaSuccess.data);
                    var parser = new xml2js.Parser({explicitArray: false});
        
                    parser.parseStringPromise(respuestaSuccess.data).then(function (result) {
                        const resultData = result['env:Envelope']['env:Body']['ns2:rResEnviConsRUC'];
                        delete resultData.$;
                        resolve(resultData);
                    });
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
                    console.log(err);
                    console.log(err.toJSON());
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Envia el Documento electronico a la SET
     * https://sifen.set.gov.py/de/ws/sync/recibe.wsdl
     * @param xml 
     * @returns 
     */
    recibe(id: number, xml: string) : Promise<any>{
        return new Promise( async (resolve, reject) => {
            try {
                let url = 'https://sifen.set.gov.py/de/ws/async/recibe.wsdl';
                if (this.env == "test") {
                    url = 'https://sifen-test.set.gov.py/de/ws/async/recibe.wsdl';
                }
        
                if (!this.cert) {
                    throw new Error("Antes debe Autenticarse");
                }
        
                if (!this.key) {
                    throw new Error("Antes debe autenticarse");
                }
        
                const httpsAgent = new https.Agent({
                    cert: Buffer.from(this.cert, 'utf8'),
                    key: Buffer.from(this.key, 'utf8')
                });
                
                xml = xml.split('\n').slice(1).join('\n');    //Retirar <xml>

                let soapXMLData=`<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">\n\
                            <env:Header/>\n\
                            <env:Body>\n\
                                <rEnviDe xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                                    <dId>${id}</dId>\n\
                                    <xDe>${xml}</xDe>\n\
                                </rEnviDe>\n\
                            </env:Body>\n\
                        </env:Envelope>\n`;
                //console.log(soapXMLData);
                soapXMLData = this.normalizeXML(soapXMLData);

                console.log(soapXMLData);
                axios.post(`${url}`, soapXMLData, {
                    headers : {
                        'User-Agent' : 'tipsCloudFAC',
                        'Content-Type' : 'application/xml; charset=utf-8'
                    }, 
                    httpsAgent 
                }).then((respuestaSuccess: any) => {
        
                    console.log(respuestaSuccess.data);
                    var parser = new xml2js.Parser({explicitArray: false});
        
                    parser.parseStringPromise(respuestaSuccess.data).then(function (result) {
                        //resolve(result['env:Envelope']['env:Body']);
                        const resultData = result['env:Envelope']['env:Body'];
                        //delete resultData.$;
                        resolve(resultData);
                    })

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
    /**
     * Envia el Documento electronico por lote a la SET
     * https://sifen.set.gov.py/de/ws/async/recibe-lote.wsdl
     * @param xmls 
     * @returns 
     */
    recibeLote(id: number, xmls: string[]) : Promise<any>{

        return new Promise( async (resolve, reject) => {
            try {
                if (xmls.length == 0) {
                    throw new Error("No se envió datos en el array de Documentos electrónicos XMLs");   
                }
                if (xmls.length > 50) {
                    throw new Error("Sólo se permiten un máximo de 50 Documentos electrónicos XML por lote");
                }
        
                let url = 'https://sifen.set.gov.py/de/ws/async/recibe-lote.wsdl';
                if (this.env == "test") {
                    url = 'https://sifen-test.set.gov.py/de/ws/async/recibe-lote.wsdl';
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
                rLoteDEXml = this.normalizeXML(rLoteDEXml);

                //console.log("Enviar: " + rLoteDEXml);
        
                zip.file(`xml_file.xml`, `<?xml version="1.0" encoding="UTF-8"?>${rLoteDEXml}`);
                
                const zipAsBase64 = await zip.generateAsync({ type: "base64" });
                //fs.writeFileSync(__dirname + '/zipped.zip', zipAsBase64);
        
                const httpsAgent = new https.Agent({
                    cert: Buffer.from(this.cert, 'utf8'),
                    key: Buffer.from(this.key, 'utf8')
                });
        
                //axios.get(`${url}`, { httpsAgent }).then((respuesta: any) => {
                    //console.log("respuesta", respuesta.data);
        
        
                let soapXMLData=`<?xml version="1.0" encoding="UTF-8"?>\n\
                        <env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">\n\
                            <env:Header/>\n\
                            <env:Body>\n\
                                <rEnvioLote xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                                    <dId>${id}</dId>\n\
                                    <xDE>${zipAsBase64}</xDE>\n\
                                </rEnvioLote>\n\
                            </env:Body>\n\
                        </env:Envelope>\n`;
                //console.log(xmlData);
                soapXMLData = this.normalizeXML(soapXMLData);
                
                //console.log(soapXMLData);
                axios.post(`${url}`, soapXMLData, {
                    headers : { 
                        'User-Agent' : 'tipsCloudFAC', 
                        'Content-Type' : 'application/xml; charset=utf-8'
                    }, 
                    httpsAgent 
                }).then((respuestaSuccess: any) => {
        
                    console.log(respuestaSuccess.data);
                    var parser = new xml2js.Parser({explicitArray: false});
        
                    parser.parseStringPromise(respuestaSuccess.data).then(function (result) {
                        //resolve(result['env:Envelope']['env:Body']['ns2:rResEnviLoteDe']);
                        const resultData = result['env:Envelope']['env:Body']['ns2:rResEnviLoteDe'];
                        delete resultData.$;
                        resolve(resultData);
                    })

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

    /**
     * 
     * @param xml 
     * @returns 
     */
    evento(id: number, xml: string) : Promise<any>{
        return new Promise( async (resolve, reject) => {
            try {
                let url = 'https://sifen.set.gov.py/de/ws/async/consulta.wsdl';
                if (this.env == "test") {
                    url = 'https://sifen-test.set.gov.py/de/ws/async/consulta.wsdl';
                }
        
                if (!this.cert) {
                    throw new Error("Antes debe Autenticarse");
                }
        
                if (!this.key) {
                    throw new Error("Antes debe autenticarse");
                }
        
                const httpsAgent = new https.Agent({
                    cert: Buffer.from(this.cert, 'utf8'),
                    key: Buffer.from(this.key, 'utf8')
                });
                
                xml = xml.split('\n').slice(1).join('\n');    //Retirar <xml>

                let soapXMLData=`<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">\n\
                            <env:Header/>\n\
                            <env:Body>\n\
                                <rEnviDe xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                                    <dId>${id}</dId>\n\
                                    <xDe>${xml}</xDe>\n\
                                </rEnviDe>\n\
                            </env:Body>\n\
                        </env:Envelope>\n`;
                //console.log(soapXMLData);
                soapXMLData = this.normalizeXML(soapXMLData);

                //console.log(soapXMLData);
                axios.post(`${url}`, soapXMLData, {
                    headers: {
                        'User-Agent' : 'tipsCloudFAC',
                        'Content-Type' : 'application/xml; charset=utf-8'
                    }, 
                    httpsAgent 
                }).then((respuestaSuccess: any) => {
        
                    console.log(respuestaSuccess.data);
                    var parser = new xml2js.Parser({explicitArray: false});
        
                    parser.parseStringPromise(respuestaSuccess.data).then(function (result) {
                        ///resolve(result['env:Envelope']['env:Body']);
                        const resultData = result['env:Envelope']['env:Body'];
                        //delete resultData.$;
                        resolve(resultData);
                    })

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

    private normalizeXML(xml: string) {
        xml = xml.split('\r\n').join('');
                xml = xml.split('\n').join('');
                xml = xml.split('\t').join('');
                xml = xml.split('    ').join('');
                xml = xml.split('>    <').join('><');
                xml = xml.split('>  <').join('><');
                xml = xml.replace(/\r?\n|\r/g, '');
        return xml;
    }
}

export default new SET();

