# Facturación Electrónica - Api SET
API de comunicación con la SET - Subsecretaría de estado de Tributación, para envío de los documentos electrónicos y consultas de datos de Facturas electrónicas.

## Instalación

```
$ npm install facturacionelectronicapy-setapi
```

## Generación del código QR

TypeScript:
```typescript
import qrgen from 'facturacionelectronicapy-qrgen';

qrgen
.generateQR(xmlSigned)
.then(xml => console.log("XML con QR", xml));

```

Para saber como generar el Archivo XML visita éste proyecto de Git: 
https://github.com/marcosjara/facturacionelectronicapy-xmlgen
