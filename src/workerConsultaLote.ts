import xml2js from "xml2js";
import pkcs12 from "./PKCS12";
const https = require("https");
const axios = require("axios");
const { workerData, parentPort } = require("worker_threads");

//this.abrir(workerData.certificado, workerData.passphase);

pkcs12.openFile(workerData.certificado, workerData.passphase);
const cert = pkcs12.getCertificate();
const key = pkcs12.getPrivateKey();

if (!cert) {
  throw new Error("Antes debe Autenticarse");
}

if (!key) {
  throw new Error("Antes debe autenticarse");
}

const httpsAgent = new https.Agent({
  cert: Buffer.from(cert, "utf8"),
  key: Buffer.from(key, "utf8"),
});

axios
  .post(`${workerData.url}`, workerData.soapXMLData, {
    headers: {
      "User-Agent": "facturaSend",
      "Content-Type": "application/xml; charset=utf-8",
    },
    httpsAgent,
    timeout: workerData.timeout,
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
            resultData.id = workerData.id;

            parentPort.postMessage(resultData);
          });
      } else {
        if ((respuestaSuccess.data + "").startsWith("<html>")) {
          throw new Error("Error SIFEN BIG-IP logout page");
        } else {
          throw new Error(respuestaSuccess.data + "");
        }
      }
    } else {
      throw new Error("Error de conexión con SIFEN");
    }
  })
  .catch((err: any) => {
    console.log("CAtch en error 1111", err);
    if (err && err.response && err.response.data) {
      var xmlResponse = err.response.data;
      var parser = new xml2js.Parser({ explicitArray: false });

      parser
        .parseStringPromise(xmlResponse)
        .then(function (resultData) {
          parentPort.postMessage(resultData);
        })
        .catch(function (err) {
          throw err;
        });
    } else {
      throw err;
    }
  });
