import { SET_API_OPERATIONS } from '../config/config';
import { XmlInput, XmlOperation } from '../types/generics'

/**
 * Normilize an xml
 * @param xml 
 * @returns 
 */
export const normalizeXML = (xml: string) : string =>  {
   xml = xml.split("\r\n").join("");
   xml = xml.split("\n").join("");
   xml = xml.split("\t").join("");
   xml = xml.split("    ").join("");
   xml = xml.split(">    <").join("><");
   xml = xml.split(">  <").join("><");
   xml = xml.replace(/\r?\n|\r/g, "");
   return xml;
}

/**
 * Prepare the xml for soap api
 * @todo create an exception in case operation is not exist
 * 
 * @param data 
 * @param operation 
 * @returns 
 */
export const prepareXmlSoap = (data: XmlInput, operation: string) : string => {
   try {

      if (SET_API_OPERATIONS.indexOf(operation) < 0) 
         throw "Operation is not defined"

      const consulta = `<rEnviConsDeRequest xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                           <dId>${data.id}</dId>\n\
                           <dCDC>${data.cdc}</dCDC>\n\
                        </rEnviConsDeRequest>\n`

      const consultaLote = `<rEnviConsLoteDe xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                              <dId>${data.id}</dId>\n\
                              <dProtConsLote>${data.numeroProtocolo}</dProtConsLote>\n\
                           </rEnviConsLoteDe>`;

      const consultaRUC = `<rEnviConsRUC xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                              <dId>${data.id}</dId>\n\
                              <dRUCCons>${data.ruc}</dRUCCons>\n\
                           </rEnviConsRUC>\n`;


      const recibe = `<rEnviDe xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                        <dId>${data.id}</dId>\n\
                        <xDE>${data.xml}</xDE>\n\
                     </rEnviDe>\n`;


      const recibeLote = `<rEnvioLote xmlns="http://ekuatia.set.gov.py/sifen/xsd">\n\
                              <dId>${data.id}</dId>\n\
                              <xDE>${data.zipAsBase64}</xDE>\n\
                           </rEnvioLote>\n`;

      const _body: XmlOperation = {
         consulta,
         consultaLote,
         consultaRUC,
         recibe,
         recibeLote
      }


      let xmlResult = `<?xml version="1.0" encoding="UTF-8"?>\n\
                        <env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">\n\
                              <env:Header/>\n\
                              <env:Body>\n\
                                 ${_body['']}
                              </env:Body>\n\
                        </env:Envelope>\n`
      
      return xmlResult     
   } catch (error) {
      throw error
   }  
}

/**
 * Get the xml soap and normalize it
 * @param xml : XmlInput
 * @param operation : string
 * @returns 
 */
export const getXmlSoapInput = (xml: XmlInput, operation: string) : string => {
   const xmlResult = prepareXmlSoap(xml, operation)
   return normalizeXML(xmlResult);
}