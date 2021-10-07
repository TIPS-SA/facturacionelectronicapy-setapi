import fs from 'fs';
import forge from 'node-forge';

class PKCS12 {
    private p12Asn1: any;
    private p12: any;

    openCertificate(file: string) {
        const pkcs12 = fs.readFileSync(file);
        this.p12Asn1 = forge.asn1.fromDer(pkcs12.toString('binary'));
    }

    openFile(file: string, passphase: string) {
        this.openCertificate(file);

        this.p12 = forge.pkcs12.pkcs12FromAsn1(this.p12Asn1, false, passphase);
    }

    clean() {
        this.p12 = undefined;
    }

    getPrivateKey() {
        for (let i = 0; i < this.p12.safeContents.length; i++) {
            if (this.p12.safeContents[i].safeBags[0].key) {
                return forge.pki.privateKeyToPem(this.p12.safeContents[i].safeBags[0].key);
            }
        }
        return null;
    }

    getCertificate() {
        for (let i = 0; i < this.p12.safeContents.length; i++) {
            if (this.p12.safeContents[i].safeBags[0].cert) {
                const b64 = forge.pki.certificateToPem(this.p12.safeContents[i].safeBags[0].cert);
                const l = b64.split('\n');
                l.pop();
                l.pop();
                l[0] = '';
                return l.join('\n');
            }
        }
        return null;
    }

    signature(xml: string, privateKey: any) {
        const md = forge.md.sha256.create();
        md.update(xml, 'utf8');
        var key = forge.pki.privateKeyFromPem(privateKey);
        return key.sign(md);
    }
}

export default new PKCS12();


