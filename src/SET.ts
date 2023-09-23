import JSZip from "jszip";
import pkcs12 from "./PKCS12";
import xml2js from "xml2js";
import fs from "fs";
import { SetApiConfig } from "./type.interface.";
import { Worker } from 'worker_threads';
import { getXmlSoapInput, normalizeXML } from "./utils/xmlUtils"

import { API_PATH } from './config/apiPath'
import { SET_API_HEADER, SET_API_TIMEOUT, SET_API_DEBUG } from "./config/config";
const https = require("https");
const axios = require("axios");

class SET {
  private cert: any;
  private key: any;

  /**
   * Crea los certificados para authenticarse a la SET.
   * @param certificado
   * @param passphase
   * /
  /*auth(env: "test" | "prod", certificado: any, passphase: string) {
    pkcs12.openFile(certificado, passphase);
    this.env = env;
    this.cert = pkcs12.getCertificate();
    this.key = pkcs12.getPrivateKey();
  }
  */

  abrir(certificado: any, passphase: string) {
    pkcs12.openFile(certificado, passphase);
    this.cert = pkcs12.getCertificate();
    this.key = pkcs12.getPrivateKey();
  }

  
   private getHttpAgent(){
      return new https.Agent({
         cert: Buffer.from(this.cert, "utf8"),
         key: Buffer.from(this.key, "utf8"),
      });
   }


  /**
   * Open certified with his passphrase and get the url of operation
   * 
   * @todo create a strategy of saveRequestFile get a .env of config and 
   * pass another functions like consulta or other
   * 
   * @param operation 
   * @param certificado 
   * @param passphase 
   * @param soapXMLData 
   * @param config 
   * @param saveRequestFile {boolean|string} is equal to path of save file
   * @returns 
   */
  private generateUrlOfOperation(
      operation: string, 
      certificado: any,
      passphase: any,
      soapXMLData: string,
      saveRequestFile: string|boolean = false
   ){
      try {
         if (!this.cert || !this.key)
            throw "Antes debe Autenticarse";

         this.abrir(certificado, passphase);

         if (SET_API_DEBUG)
            console.log("soapXMLData", soapXMLData);

         if (typeof saveRequestFile === 'string')
            fs.writeFileSync( saveRequestFile, soapXMLData );

         // url to connect a webservice, the env is defined in config
         const url = API_PATH[operation];
         return url;
         
      } catch (error) {
         console.error('generateUrlOfOperation:', error)
         throw error
      }
  }

  /**
   * Parse Envolepe Body Xml to JSON
   * @param xmlData 
   * @returns 
   */
   private async parseEnvelopeBodyToJson(xmlData: string){
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData)
      const parseResult = JSON.parse(
         JSON.stringify(result["env:Envelope"]["env:Body"])
      );
      return parseResult;
   }


  /**
   * Submit a http response
   * @param url 
   * @param soapXMLData 
   * @returns 
   */
  private async basicSubmitHttpRequest(id: number, url: string, soapXMLData : string){
      let data = null

      try {
         const response = await axios.post(url, soapXMLData, {
            headers: SET_API_HEADER,
            httpsAgent : this.getHttpAgent(),
            timeout: SET_API_TIMEOUT,
         })   

         const { status } = response;
         data = response.data

         if (status != 200)
            throw `status error - code: ${status}`

         if ((data + '').startsWith("<html>"))
            throw "Error de la SET BIG-IP logout page"

         if (!(data + '').startsWith("<?xml"))
            throw "Data is not start with <?xml"

      } catch (err) {
          = err.response;
      } finally {
         const resultData = await this.parseEnvelopeBodyToJson(data);
         return { ...resultData, id };
      }
  }


  /**
   * Consulta un Documento Electronico por CDC
   *
   * @param cdc
   * @returns
   */
  async consulta(
    id: number,
    cdc: string,
    env: "test" | "prod",
    certificado: any,
    passphase: any,
    config?: SetApiConfig
  ): Promise<any> {
      try {
        
        const soapXMLData = getXmlSoapInput({id, cdc}, 'consulta')
        const url = this.generateUrlOfOperation(
            'consulta', 
            certificado, 
            passphase, 
            soapXMLData
         )
         return await this.basicSubmitHttpRequest(id, url, soapXMLData)

      } catch (error) {
        throw error
      }
   }

  /**
   * Consulta un lote en la SET
   * @param id
   * @param numeroProtocolo
   * @returns
   */
  consultaLote2222(
    id: number,
    numeroProtocolo: number,
    env: "test" | "prod",
    certificado: any,
    passphase: any,
    config?: SetApiConfig
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let defaultConfig: SetApiConfig = {
          debug: false,
          timeout: 90000,
        };

        //console.log("El config del params viene ", config);

        defaultConfig = Object.assign(defaultConfig, config);

        
        let url = "https://sifen.set.gov.py/de/ws/consultas/consulta-lote.wsdl";
        if (env == "test") {
          url =
            "https://sifen-test.set.gov.py/de/ws/consultas/consulta-lote.wsdl";
        }

        /*this.abrir(certificado, passphase);

        if (!this.cert) {
          reject("Antes debe Autenticarse");
        }

        if (!this.key) {
          reject("Antes debe autenticarse");
        }*/

        /*const httpsAgent = new https.Agent({
          cert: Buffer.from(this.cert, "utf8"),
          key: Buffer.from(this.key, "utf8"),
        });*/

        let soapXMLData = `<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">\n\
                            <env:Header/>\n\
                            <env:Body>\n\
                                <rEnviConsLoteDe xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                                    <dId>${id}</dId>\n\
                                    <dProtConsLote>${numeroProtocolo}</dProtConsLote>\n\
                                </rEnviConsLoteDe>\n\
                            </env:Body>\n\
                        </env:Envelope>\n`;

        soapXMLData = normalizeXML(soapXMLData);

        if (defaultConfig.debug === true) {
          console.log("soapXMLData", soapXMLData);
        }

        if (defaultConfig.saveRequestFile) {
          const json = fs.writeFileSync(
            defaultConfig.saveRequestFile,
            soapXMLData
          );
        }

        console.log("soapXMLData", { 
          url, 
          soapXMLData,
          id,
          certificado, 
          passphase,
          timeout: defaultConfig.timeout,

          path: './workerConsultaSET.ts'
        });


        const runService = (WorkerData: any) => {
        
            return new Promise((resolve, reject) => {
        
              const worker = new Worker('./workerConsultaLote', { workerData : { 
                  url, 
                  soapXMLData,
                  certificado, 
                  passphase,        
                  id,
                  timeout: defaultConfig.timeout,

                  path: './workerConsultaLote.ts'
                }
              });
        
                worker.on('message', resolve);
        
                worker.on('error', reject);
        
                worker.on('exit', (code) => {
        
                    if (code !== 0)
        
                        reject(new Error(`stopped with  ${code} exit code`));
        
                })
        
            })
        
        }
        
        const run = async () => {
        
            const result = await runService('hello node.js')
        
            console.log(result);
        
        }
        
        run().catch(err => console.error(err))        


      /*
        axios
          .post(`${url}`, soapXMLData, {
            headers: {
              "User-Agent": "facturaSend",
              "Content-Type": "application/xml; charset=utf-8",
            },
            httpsAgent,
            timeout: defaultConfig.timeout,
          })
          .then((respuestaSuccess: any) => {
            var parser = new xml2js.Parser({ explicitArray: false });

            if (respuestaSuccess.status == 200) {
              if ((respuestaSuccess.data + "").startsWith("<?xml")) {
                parser
                  .parseStringPromise(respuestaSuccess.data)
                  .then(function (result) {
                    const resultData = JSON.parse(
                      JSON.stringify(result["env:Envelope"]["env:Body"])
                    );
                    resultData.id = id;

                    resolve(resultData);
                  });
              } else {
                if ((respuestaSuccess.data + "").startsWith("<html>")) {
                  reject(new Error("Error de la SET BIG-IP logout page"));
                } else {
                  reject(new Error(respuestaSuccess.data + ""));
                }
              }
            } else {
              reject(new Error("Error de conexión con la SET"));
            }
          })
          .catch((err: any) => {
            console.log("CAtch en error 1111", err);
            if (err && err.response && err.response.data) {
              var xmlResponse = err.response.data;
              var parser = new xml2js.Parser({ explicitArray: false });

              parser
                .parseStringPromise(xmlResponse)
                .then(function (result) {
                  resolve(result["env:Envelope"]["env:Body"]);
                })
                .catch(function (err) {
                  reject(err);
                });
            } else {
              reject(err);
            }
          });


          */
      } catch (error) {
        console.log("CAtch en error 2222", error);
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
  consultaLote(
    id: number,
    numeroProtocolo: number,
    env: "test" | "prod",
    certificado: any,
    passphase: any,
    config?: SetApiConfig
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let defaultConfig: SetApiConfig = {
          debug: false,
          timeout: 90000,
        };

        //console.log("El config del params viene ", config);

        defaultConfig = Object.assign(defaultConfig, config);

        this.abrir(certificado, passphase);

        let url = "https://sifen.set.gov.py/de/ws/consultas/consulta-lote.wsdl";
        if (env == "test") {
          url =
            "https://sifen-test.set.gov.py/de/ws/consultas/consulta-lote.wsdl";
        }

        if (!this.cert) {
          reject("Antes debe Autenticarse");
        }

        if (!this.key) {
          reject("Antes debe autenticarse");
        }

        const httpsAgent = new https.Agent({
          cert: Buffer.from(this.cert, "utf8"),
          key: Buffer.from(this.key, "utf8"),
        });

        
        const soapXMLData = getXmlSoapInput({id, numeroProtocolo}, 'consultaLote');

        if (defaultConfig.debug === true) {
          console.log("soapXMLData", soapXMLData);
        }

        if (defaultConfig.saveRequestFile) {
          const json = fs.writeFileSync(
            defaultConfig.saveRequestFile,
            soapXMLData
          );
        }

        axios
          .post(`${url}`, soapXMLData, {
            headers: {
              "User-Agent": "facturaSend",
              "Content-Type": "application/xml; charset=utf-8",
            },
            httpsAgent,
            timeout: defaultConfig.timeout,
          })
          .then((respuestaSuccess: any) => {
            var parser = new xml2js.Parser({ explicitArray: false });

            if (respuestaSuccess.status == 200) {
              if ((respuestaSuccess.data + "").startsWith("<?xml")) {
                parser
                  .parseStringPromise(respuestaSuccess.data)
                  .then(function (result) {
                    const resultData = JSON.parse(
                      JSON.stringify(result["env:Envelope"]["env:Body"])
                    );
                    resultData.id = id;

                    resolve(resultData);
                  });
              } else {
                if ((respuestaSuccess.data + "").startsWith("<html>")) {
                  reject(new Error("Error de la SET BIG-IP logout page"));
                } else {
                  reject(new Error(respuestaSuccess.data + ""));
                }
              }
            } else {
              reject(new Error("Error de conexión con la SET"));
            }
          })
          .catch((err: any) => {
            console.log("CAtch en error 1111", err);
            if (err && err.response && err.response.data) {
              var xmlResponse = err.response.data;
              var parser = new xml2js.Parser({ explicitArray: false });

              parser
                .parseStringPromise(xmlResponse)
                .then(function (result) {
                  resolve(result["env:Envelope"]["env:Body"]);
                })
                .catch(function (err) {
                  reject(err);
                });
            } else {
              reject(err);
            }
          });
      } catch (error) {
        console.log("CAtch en error 2222", error);
        reject(error);
      }
    });
  }
  
  /**
   *
   * @param xml
   * @returns
   */
  consultaRUC(
    id: number,
    ruc: string,
    env: "test" | "prod",
    certificado: any,
    passphase: any,
    config?: SetApiConfig
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let defaultConfig: SetApiConfig = {
          debug: false,
          timeout: 90000,
        };

        defaultConfig = Object.assign(defaultConfig, config);

        this.abrir(certificado, passphase);

        let url = "https://sifen.set.gov.py/de/ws/consultas/consulta-ruc.wsdl";
        if (env == "test") {
          url =
            "https://sifen-test.set.gov.py/de/ws/consultas/consulta-ruc.wsdl";
        }

        if (!this.cert) {
          reject("Antes debe Autenticarse");
        }

        if (!this.key) {
          reject("Antes debe autenticarse");
        }

        const httpsAgent = new https.Agent({
          cert: Buffer.from(this.cert, "utf8"),
          key: Buffer.from(this.key, "utf8"),
          /*maxVersion: "TLSv1.2",
                    minVersion: "TLSv1.2",
                    secureOptions : constants.SSL_OP_NO_SSLv2 | constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1*/
        });

        const soapXMLData = getXmlSoapInput({id, ruc}, 'consultaRUC');

        if (defaultConfig.debug === true) {
          console.log("soapXMLData", soapXMLData);
        }

        if (defaultConfig.saveRequestFile) {
          const json = fs.writeFileSync(
            defaultConfig.saveRequestFile,
            soapXMLData
          );
        }

        axios
          .post(`${url}`, soapXMLData, {
            headers: {
              "User-Agent": "facturaSend",
              "Content-Type": "application/xml; charset=utf-8",
            },
            httpsAgent,
            timeout: defaultConfig.timeout,
          })
          .then((respuestaSuccess: any) => {
            var parser = new xml2js.Parser({ explicitArray: false });

            //console.log("respuestaSuccess.data", respuestaSuccess.data);
            //console.log("statuscode", respuestaSuccess.status);
            ////console.log(respuestaSuccess.statusCode);

            if (respuestaSuccess.status == 200) {
              if ((respuestaSuccess.data + "").startsWith("<?xml")) {
                parser
                  .parseStringPromise(respuestaSuccess.data)
                  .then(function (result) {
                    const resultData = result["env:Envelope"]["env:Body"];
                    resultData.id = id;
                    resolve(resultData);
                  });
              } else {
                if ((respuestaSuccess.data + "").startsWith("<html>")) {
                  reject(new Error("Error de la SET BIG-IP logout page"));
                } else {
                  reject(new Error(respuestaSuccess.data + ""));
                }
              }
            } else {
              //reject(new Error("Error en la respuesta de comunicación con la SET " + respuestaSuccess.data));
              reject(new Error("Error de conexión con la SET"));
            }
          })
          .catch((err: any) => {
            if (err && err.response && err.response.data) {
              var xmlResponse = err.response.data;
              var parser = new xml2js.Parser({ explicitArray: false });

              parser
                .parseStringPromise(xmlResponse)
                .then(function (result) {
                  const resultData = result["env:Envelope"]["env:Body"];
                  resultData.id = id;
                  resolve(resultData);
                })
                .catch(function (err) {
                  reject(err);
                });
            } else {
              reject(err);
            }
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
  recibe(
    id: number,
    xml: string,
    env: "test" | "prod",
    certificado: any,
    passphase: any,
    config?: SetApiConfig
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let defaultConfig: SetApiConfig = {
          debug: false,
          timeout: 90000,
        };

        defaultConfig = Object.assign(defaultConfig, config);

        this.abrir(certificado, passphase);

        let url = "https://sifen.set.gov.py/de/ws/sync/recibe.wsdl";
        if (env == "test") {
          url = "https://sifen-test.set.gov.py/de/ws/sync/recibe.wsdl";
        }

        if (!this.cert) {
          reject("Antes debe Autenticarse");
        }

        if (!this.key) {
          reject("Antes debe autenticarse");
        }

        const httpsAgent = new https.Agent({
          cert: Buffer.from(this.cert, "utf8"),
          key: Buffer.from(this.key, "utf8"),
        });

        xml = xml.split("\n").slice(1).join("\n"); //Retirar <xml>

        const soapXMLData = getXmlSoapInput({id, xml}, 'recibe')

        if (defaultConfig.debug === true) {
          console.log("soapXMLData", soapXMLData);
        }
        if (defaultConfig.saveRequestFile) {
          const json = fs.writeFileSync(
            defaultConfig.saveRequestFile,
            soapXMLData
          );
        }

        axios
          .post(`${url}`, soapXMLData, {
            headers: {
              "User-Agent": "facturaSend",
              "Content-Type": "application/xml; charset=utf-8",
            },
            httpsAgent,
            timeout: defaultConfig.timeout,
          })
          .then((respuestaSuccess: any) => {
            var parser = new xml2js.Parser({ explicitArray: false });

            if (respuestaSuccess.status == 200) {
              if ((respuestaSuccess.data + "").startsWith("<?xml")) {
                parser
                  .parseStringPromise(respuestaSuccess.data)
                  .then(function (result) {
                    //resolve(result['env:Envelope']['env:Body']);
                    const resultData =
                      //result["env:Envelope"]["env:Body"]["ns2:rRetEnviDe"];
                      result["env:Envelope"]["env:Body"];
                    //delete resultData.$;
                    resultData["id"] = id;
                    resolve(resultData);
                  });
              } else {
                if ((respuestaSuccess.data + "").startsWith("<html>")) {
                  //console.log("setApi - recibe " + respuestaSuccess.data);
                  reject(new Error("Error de la SET BIG-IP logout page"));
                } else {
                  reject(new Error(respuestaSuccess.data + ""));
                }
              }
            } else {
              //reject(new Error("Error en la respuesta de comunicación con la SET " + respuestaSuccess.data));
              reject(new Error("Error de conexión con la SET"));
            }
          })
          .catch((err: any) => {
            if (err && err.response && err.response.data) {
              var xmlResponse = err.response.data;
              var parser = new xml2js.Parser({ explicitArray: false });

              parser
                .parseStringPromise(xmlResponse)
                .then(function (result) {
                  const resultData = result["env:Envelope"]["env:Body"];
                  resultData["id"] = id;
                  resolve(resultData);
                })
                .catch(function (err) {
                  reject(err);
                });
            } else {
              reject(err);
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
  recibeLote(
    id: number,
    xmls: string[],
    env: "test" | "prod",
    certificado: any,
    passphase: any,
    config?: SetApiConfig
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let defaultConfig: SetApiConfig = {
          debug: false,
          timeout: 90000,
        };

        defaultConfig = Object.assign(defaultConfig, config);

        this.abrir(certificado, passphase);

        if (xmls.length == 0) {
          reject(
            "No se envió datos en el array de Documentos electrónicos XMLs"
          );
        }
        if (xmls.length > 50) {
          reject(
            "Sólo se permiten un máximo de 50 Documentos electrónicos XML por lote"
          );
        }

        let url = "https://sifen.set.gov.py/de/ws/async/recibe-lote.wsdl";
        if (env == "test") {
          url = "https://sifen-test.set.gov.py/de/ws/async/recibe-lote.wsdl";
        }

        if (!this.cert) {
          reject("Antes debe Autenticarse");
        }

        if (!this.key) {
          reject("Antes debe autenticarse");
        }

        const zip = new JSZip();

        let rLoteDEXml = `<rLoteDE>\n`;
        for (let i = 0; i < xmls.length; i++) {
          //const xml = xmls[i];
          const xml = xmls[i].split("\n").slice(1).join("\n"); //Retirar xml

          rLoteDEXml += `${xml}\n`;
        }
        rLoteDEXml += `</rLoteDE>`;
        rLoteDEXml = normalizeXML(rLoteDEXml);

        zip.file(
          `xml_file.xml`,
          `<?xml version="1.0" encoding="UTF-8"?>${rLoteDEXml}`
        );

        const zipAsBase64 = await zip.generateAsync({ type: "base64" });
        //fs.writeFileSync(__dirname + '/zipped.zip', zipAsBase64);

        const httpsAgent = new https.Agent({
          cert: Buffer.from(this.cert, "utf8"),
          key: Buffer.from(this.key, "utf8"),
          //rejectUnauthorized: false,
          //minVersion: "TLSv1",
        });

        const soapXMLData = getXmlSoapInput({id, zipAsBase64}, 'recibeLote')

        if (defaultConfig.debug === true) {
          console.log("soapXMLData", soapXMLData);
        }

        if (defaultConfig.saveRequestFile) {
          const json = fs.writeFileSync(
            defaultConfig.saveRequestFile,
            soapXMLData
          );
        }

        axios
          .post(`${url}`, soapXMLData, {
            headers: {
              "User-Agent": "facturaSend",
              "Content-Type": "application/xml; charset=utf-8",
            },
            httpsAgent,
            timeout: defaultConfig.timeout,
          })
          .then((respuestaSuccess: any) => {
            var parser = new xml2js.Parser({ explicitArray: false });

            if (respuestaSuccess.status == 200) {
              if ((respuestaSuccess.data + "").startsWith("<?xml")) {
                parser
                  .parseStringPromise(respuestaSuccess.data)
                  .then(function (result) {
                    //resolve(result['env:Envelope']['env:Body']['ns2:rResEnviLoteDe']);
                    const resultData =
                      //result["env:Envelope"]["env:Body"]["ns2:rResEnviLoteDe"];
                      result["env:Envelope"]["env:Body"];
                    resultData["id"] = id;
                    //result['env:Envelope']['env:Body']['ns2:rResEnviLoteDe']['id'] = id;
                    //const resultData = result['env:Envelope']['env:Body'];
                    delete resultData.$;
                    resolve(resultData);
                  });
              } else {
                if ((respuestaSuccess.data + "").startsWith("<html>")) {
                  //console.log("setApi - recibe " + respuestaSuccess.data);
                  reject(new Error("Error de la SET BIG-IP logout page"));
                } else {
                  reject(new Error(respuestaSuccess.data + ""));
                }
              }
            } else {
              reject(new Error("Error de conexión con la SET"));
            }
          })
          .catch((err: any) => {
            if (err && err.response && err.response.data) {
              var xmlResponse = err.response.data;
              var parser = new xml2js.Parser({ explicitArray: false });

              parser
                .parseStringPromise(xmlResponse)
                .then(function (result) {
                  const resultData =
                    /*result["env:Envelope"]["env:Body"]["ns2:rRetEnviDe"][
                    "ns2:rProtDe"
                  ];*/
                    result["env:Envelope"]["env:Body"];
                  resultData["id"] = id;
                  resolve(resultData);
                })
                .catch(function (err) {
                  reject(err);
                });
            } else {
              reject(err);
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
  async evento(
    id: number,
    xml: string,
    env: "test" | "prod",
    certificado: any,
    passphase: any,
    config?: SetApiConfig
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let defaultConfig: SetApiConfig = {
          debug: false,
          timeout: 90000,
        };

        defaultConfig = Object.assign(defaultConfig, config);

        this.abrir(certificado, passphase);

        let url = "https://sifen.set.gov.py/de/ws/eventos/evento.wsdl";
        if (env == "test") {
          url = "https://sifen-test.set.gov.py/de/ws/eventos/evento.wsdl";
        }

        if (!this.cert) {
          reject("Antes debe Autenticarse");
        }

        if (!this.key) {
          reject("Antes debe autenticarse");
        }

        const httpsAgent = new https.Agent({
          cert: Buffer.from(this.cert, "utf8"),
          key: Buffer.from(this.key, "utf8"),
        });

        let soapXMLData = normalizeXML(xml); //Para el evento, el xml ya viene con SoapData

        if (defaultConfig.debug === true) {
          console.log("soapXMLData", soapXMLData);
        }

        if (defaultConfig.saveRequestFile) {
          const json = fs.writeFileSync(
            defaultConfig.saveRequestFile,
            soapXMLData
          );
        }

        axios
          .post(`${url}`, soapXMLData, {
            headers: {
              "User-Agent": "facturaSend",
              "Content-Type": "application/xml; charset=utf-8",
            },
            httpsAgent,
            timeout: defaultConfig.timeout,
          })
          .then((respuestaSuccess: any) => {
            var parser = new xml2js.Parser({ explicitArray: false });

            if (respuestaSuccess.status == 200) {
              if ((respuestaSuccess.data + "").startsWith("<?xml")) {
                parser
                  .parseStringPromise(respuestaSuccess.data)
                  .then(function (result) {
                    ///resolve(result['env:Envelope']['env:Body']);
                    const resultData = result["env:Envelope"]["env:Body"];
                    resultData.id = id;
                    //delete resultData.$;
                    resolve(resultData);
                  });
              } else {
                if ((respuestaSuccess.data + "").startsWith("<html>")) {
                  //console.log("setApi - recibe " + respuestaSuccess.data);
                  reject(new Error("Error de la SET BIG-IP logout page"));
                } else {
                  reject(new Error(respuestaSuccess.data + ""));
                }
              }
            } else {
              reject(new Error("Error de conexión con la SET"));
            }
          })
          .catch((err: any) => {
            if (err && err.response && err.response.data) {
              var xmlResponse = err.response.data;
              var parser = new xml2js.Parser({ explicitArray: false });

              parser
                .parseStringPromise(xmlResponse)
                .then(function (result) {
                  const resultData = result["env:Envelope"]["env:Body"];
                  resultData.id = id;
                  resolve(resultData);
                })
                .catch(function (err) {
                  reject(err);
                });
            } else {
              reject(err);
            }
          });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new SET();
