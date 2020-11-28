'use strict';

const forge = require('node-forge');

const debug = require('debug')('blockbrain:ca');
const fs = require('fs');

const log = global.log;

class Ca {
    constructor() {
        this.isEnabled = false;

        this.privateKey = null;
        this.cert = "";
        this.tmpDir = "/tmp";
        this.opt = null;

        this.cn = '';
        this.c = '';
        this.st = '';
        this.l = '';
        this.o = '';
        this.ou = '';

    }

    init(config) {
        config = config.config.ca || {};
        this.opt = { dir: this.tmpDir };

        this.cn = config.cn || '';
        this.c = config.c || '';
        this.st = config.st || '';
        this.l = config.l || '';
        this.o = config.o || '';
        this.ou = config.ou || '';

        if(!config.rootKey || !config.rootCert) {
            log.f("CA configuration required. CA will not work correctly");
            log.i("CA minimal params: rootKey & rootCert");
            return false;
        }

        let filesOk = true;

        if(!fs.existsSync(config.rootKey)) {
            log.e(`CA key file not found in ${config.rootKey}!`);
            filesOk = false;
        }

        if(!fs.existsSync(config.rootCert)) {
            log.e(`CA certificate file not found in ${config.rootCert}!`);
            filesOk = false;
        }

        if(!filesOk) {
            if(config.autoGenerate) {
                log.i("Generating CA certificate and key files");

                var keys = this.generateCa();

                var cert = this.generateCertificate({
                    ca: true, 
                    publicKey: keys.publicKey, 
                    privateKey: keys.privateKey, 

                    cn: this.cn, 
                    c: this.c, 
                    st: this.st, 
                    l: this.l, 
                    o: this.o, 
                    ou: this.ou
                });

                this.cert = cert.certificate;

                fs.writeFile(config.rootKey, keys.privateKey, (err) => {
                    if(!err) log.i("Private key saved successfully");
                    else log.f("Could not save private key to " + config.rootKey);
                });
                fs.writeFile(config.rootCert, this.cert, (err) => {
                    if(!err) log.i("Root certificate saved successfully");
                    else log.f("Could not save root certificate to " + config.rootCert);
                });
            } else {
                // !autoGenerate
                log.f("CA files must exist (autoGenerate==false). CA will not work correctly");
                return false;
            }
        } else {
            this.privateKey = fs.readFileSync(config.rootKey, (err) => {
                if(!err) log.d(`CA root key file ${config.rootKey} loaded`);
                else {
                    log.f("Could not load ca key file " + config.rootKey);
                    this.isEnabled = false;
                }
            });

            this.cert = fs.readFileSync(config.rootCert, (err) => {
                if(!err) log.d(`CA root cert file ${config.rootCert} loaded`);
                else {
                    log.f("Could not load ca cert file " + config.rootCert);
                    this.isEnabled = false;
                }
            });
        }

        this.isEnabled = true;

        return true;
    }

    toPositiveHex(hexString) {
        var mostSiginficativeHexAsInt = parseInt(hexString[0], 16);
        if (mostSiginficativeHexAsInt < 8) {
            return hexString;
        }
        
        mostSiginficativeHexAsInt -= 8;
        return mostSiginficativeHexAsInt.toString() + hexString.substring(1);
    }

    caAttrs() {
        return [{
            name: 'commonName',
            value: this.cn
        }, {
            name: 'countryName',
            value: this.c || ''
        }, {
            shortName: 'ST',
            value: this.st || ''
        }, {
            name: 'localityName',
            value: this.l || ''
        }, {
            name: 'organizationName',
            value: this.o || ''
        }, {
            shortName: 'OU',
            value: this.ou || ''
        }];
    }

    generateCa() {
        var keyPair = forge.pki.rsa.generateKeyPair({
            bits: 4096
        });

        var pem = {
            privateKey: forge.pki.privateKeyToPem(keyPair.privateKey),
            publicKey: forge.pki.publicKeyToPem(keyPair.publicKey),
        };
        
        this.privateKey = pem.privateKey; // Save root priv key!

        return pem;
    }
      
    generateCertificate(params = {}) {
        var publicKey, privateKey;

        if(!params.publicKey && !params.privateKey) {
            // New random cert keys
            var newKeys = forge.pki.rsa.generateKeyPair(4096);
            publicKey = newKeys.publicKey;
            privateKey = newKeys.privateKey;
        } else {
            // Probably self-signed XD
            var publicKey = forge.pki.publicKeyFromPem(params.publicKey);
            var privateKey = forge.pki.privateKeyFromPem(params.privateKey);
        }

        var cert = forge.pki.createCertificate();
        cert.serialNumber = this.toPositiveHex(forge.util.bytesToHex(forge.random.getBytesSync(9))); // the serial number can be decimal or hex (if preceded by 0x)
        
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setDate(cert.validity.notBefore.getFullYear() + 10);
        
        var cns = [ ];
        
        if(Array.isArray(params.cn)) cns = [...params.cn];
        else cns = [ this.cn ];

        cns.filter(function(elem, pos) {
            return cns.indexOf(elem) == pos;
        });

        let cn = cns.shift();

        var attrs = [{
            name: 'commonName',
            value: cn
        }, {
            name: 'countryName',
            value: params.c || ''
        }, {
            shortName: 'ST',
            value: params.st || ''
        }, {
            name: 'localityName',
            value: params.l || ''
        }, {
            name: 'organizationName',
            value: params.o || ''
        }, {
            shortName: 'OU',
            value: params.ou || ''
        }];

        cert.setSubject(attrs);
        cert.setIssuer(this.caAttrs());
        
        cert.publicKey = publicKey;
        
        var altNames = [];
        


        if(cns.length > 0) {
            for(let n = 0; n < cns.length; n++) {
                if(cns[n].match('^[0-9]+\\.[0-9]+\\.[0-9]+\\.[0-9]+$')) {
                    altNames.push({
                        type: 7, // IP
                        ip: cns[n]
                    });
                } else if(cns[n].match(/:?([0-9a-fA-F]{1,4}::?)+([0-9a-fA-F]{1,4})+/)) {
                    altNames.push({
                        type: 7, // IPv6
                        ip: cns[n]
                    });
                } else {
                    altNames.push({
                        type: 2, // DNS
                        value: cns[n]
                    });
                }
            }
        }

        var ext = [
        {
            name: 'basicConstraints',
            cA: params.ca || false
        }, 
        {
            name: 'keyUsage',
            keyCertSign: true,
            digitalSignature: true,
            nonRepudiation: false,
            keyEncipherment: false,
            dataEncipherment: false
        }];

        if(altNames.length > 0)
        {
            ext.push(
            {
                name: 'subjectAltName',
                altNames: altNames
            });
        }

        cert.setExtensions(ext);
        
        // root CA signing
        cert.sign(forge.pki.privateKeyFromPem(this.privateKey), forge.md.sha256.create());
        
        return {
            certificate: forge.pki.certificateToPem(cert), 
            privateKey: forge.pki.privateKeyToPem(privateKey)
        }
    }

    generateClientCertificate(params = {}) {
        var privateKey = forge.pki.privateKeyFromPem(this.privateKey);
      
        var clientKeys = forge.pki.rsa.generateKeyPair(4096);
        var clientCert = forge.pki.createCertificate();
      
        clientCert.serialNumber = this.toPositiveHex(forge.util.bytesToHex(forge.random.getBytesSync(9)));
        clientCert.validity.notBefore = new Date();
        clientCert.validity.notAfter = new Date();
        clientCert.validity.notAfter.setFullYear(clientCert.validity.notBefore.getFullYear() + 10);
        
        var clientAttrs = [{
            name: 'commonName',
            value: params.cn
        }, {
            name: 'countryName',
            value: params.c || ''
        }, {
            shortName: 'ST',
            value: params.st || ''
        }, {
            name: 'localityName',
            value: params.l || ''
        }, {
            name: 'organizationName',
            value: params.o || ''
        }, {
            shortName: 'OU',
            value: params.ou || ''
        }];

        clientCert.setSubject(clientAttrs);
        
        // Set the issuer to the parent key
        clientCert.setIssuer(this.caAttrs());
        
        clientCert.publicKey = clientKeys.publicKey;
        
        // Sign client cert with root cert
        clientCert.sign(privateKey, forge.md.sha256.create());
        
        return {
            privateKey: forge.pki.privateKeyToPem(clientKeys.privateKey), 
            publicKey: forge.pki.publicKeyToPem(clientKeys.publicKey), 
            certificate: forge.pki.certificateToPem(clientCert)
        }
    }
}

module.exports = new Ca();
