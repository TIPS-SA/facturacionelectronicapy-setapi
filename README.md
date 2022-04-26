# Facturación Electrónica - Api SET
API de comunicación con la SET - Subsecretaría de estado de Tributación, para envío de los documentos electrónicos y consultas de datos de Facturas electrónicas.

## Instalación

```
$ npm install facturacionelectronicapy-setapi
```

## Envio de Documento de forma Síncrona

TypeScript:
```typescript
import setApi from 'facturacionelectronicapy-setapi';

setApi
.recibe(id, xmlSigned, env = "test" | "prod", cert_path, key)
.then(xml => console.log("XML con QR", xml));

```

## Envio de Documento de forma Asíncrona, por lotes

TypeScript:
```typescript
import setApi from 'facturacionelectronicapy-setapi';

setApi
.recibeLote(id, xmlSigned[], env = "test" | "prod", cert_path, key)
.then(xml => console.log("XML con QR", xml));

```
## Envio de evento a la SET

TypeScript:
```typescript
import setApi from 'facturacionelectronicapy-setapi';

setApi
.evento(id, xmlSigned, env = "test" | "prod", cert_path, key)
.then(xml => console.log("XML con QR", xml));

```
## Consulta de Documentos electrónicos desde la SET

TypeScript:
```typescript
import setApi from 'facturacionelectronicapy-setapi';

setApi
.consulta(id, cdc, env = "test" | "prod", cert_path, key)
.then(xml => console.log("XML con QR", xml));

```
## Consulta de RUC

TypeScript:
```typescript
import setApi from 'facturacionelectronicapy-setapi';

setApi
.consultaRuc(id, ruc, env = "test" | "prod", cert_path, key)
.then(xml => console.log("XML con QR", xml));

```
## Consulta de Lote

TypeScript:
```typescript
import setApi from 'facturacionelectronicapy-setapi';

setApi
.consultaLote(id, numeroLote, env = "test" | "prod", cert_path, key)
.then(xml => console.log("XML con QR", xml));

```

Para saber como generar el Archivo XML visita éste proyecto de Git visitar: 
https://github.com/marcosjara/facturacionelectronicapy-xmlgen


## Todos los proyectos
[Generación de XML](https://www.npmjs.com/package/facturacionelectronicapy-xmlgen)<br/>
[Firma de XML](https://www.npmjs.com/package/facturacionelectronicapy-xmlsign)<br/>
[Generación de QR](https://www.npmjs.com/package/facturacionelectronicapy-qrgen)<br/>
[API de la SET](https://www.npmjs.com/package/facturacionelectronicapy-setapi)<br/>
[Generación KUDE](https://www.npmjs.com/package/facturacionelectronicapy-kude)<br/>


## Empresas que utilizan éstos proyectos
[JHF Ingeniería Informática](https://jhf.com.py/)<br/>
[JR Ingeniería y Servicios](https://jringenieriayservicios.com/)<br/>
[FacturaSend](https://www.facturasend.com/)<br/>