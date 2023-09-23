import { XmlOperation } from '../types/generics'
import { SET_ENV, SET_API_BASE_URL } from './config'

export const API_BASE_URL = SET_API_BASE_URL[SET_ENV]

export const API_PATH : XmlOperation  = {
   consulta: `${API_BASE_URL}/de/ws/consultas/consulta.wsdl`,
   consultaLote: `${API_BASE_URL}/de/ws/consultas/consulta-lote.wsdl`,
   consultaRUC: `${API_BASE_URL}/de/ws/consultas/consulta-ruc.wsdl`,
   recibe: `${API_BASE_URL}/de/ws/sync/recibe.wsdl`,
   recibeLote : `${API_BASE_URL}/de/ws/async/recibe-lote.wsdl`, 
}
