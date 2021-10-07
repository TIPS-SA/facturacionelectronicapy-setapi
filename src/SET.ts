const soap = require('soap');
//import soap from 'soap';
import JSZip from "jszip";
import pkcs12 from "./PKCS12";
import fs from 'fs'; 
import uri2path from 'file-uri-to-path';

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

        //console.log("certificado", pkcs12.getCertificate());
        //console.log("key", pkcs12.getPrivateKey());
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

        //console.log("dato a enviar...", url, args);

        console.log("entro hasta aqui");
        const oThis = this;
        const wsdlPath = uri2path("file://localhost/" + __dirname + "/wsdl/recibe_lote.wsdl?wsdl");
        console.log(wsdlPath);
        return soap.createClient(wsdlPath, function(err: any, client: any) {
            if (err) {
                throw err;
            }
            //console.log("client", client);
            
            var certFName = __dirname + '/cert_' + oThis.generateRandom(1, 999999);
            fs.writeFileSync(certFName, oThis.cert);

            var keyFName = __dirname + '/key_' + oThis.generateRandom(1, 999999);
            fs.writeFileSync(keyFName, oThis.key);

            console.log(certFName, keyFName);
            client.setSecurity(new soap.ClientSSLSecurity(
                keyFName,
                certFName,
                //'/path/to/ca-cert',  /*or an array of buffer: [fs.readFileSync('/path/to/ca-cert/1', 'utf8'),
                //'fs.readFileSync('/path/to/ca-cert/2', 'utf8')], */
                {   /*default request options like */
                    // strictSSL: true,
                    // rejectUnauthorized: false,
                    // hostname: 'some-hostname'
                    //secureOptions: constants.SSL_OP_NO_TLSv1_2,
                    // forever: true,
                },
            ));
            fs.rm(certFName, function(e){});
            fs.rm(keyFName, function(e){});

            console.log("client");
            console.log("client", client);
            client.rEnvioLote(args, function(err: any, result: any) {
                
                return new Promise(e=>result);
            });
            
        });
        
    }
    private generateRandom(min: number, max: number) {  
        return Math.floor(
          Math.random() * (max - min) + min
        );
    }
}

export default new SET();

