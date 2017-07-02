//this handles the session
import * as crypto from 'crypto';
import * as util from 'errisy-util';
import * as http from 'http';
import * as cookie from 'cookie';
import * as rpc from 'errisy-rpc';

import { ISession } from './session';
import { IPromisedMiddleware } from './promisedmiddleware';
/**
 * this is the algorithm to encrypt and decrypt session data for client side session;
 */
const algorithm = 'aes-256-gcm';

/**
 * this cookie session middleware will save all the session data in encrypted cookie of the client.
 * it will increase http transfer size since the data are in the headers
 */
export class CookieSessionMiddleware implements IPromisedMiddleware {
    /**
     * 
     * @param secret secret is the standard aes 256 secret for the session encrption
     * @param expiryPeroid by default, expiryPeroid is 30min
     * @param shuffle when shuffle is set true, the algorithm will make sure there is no similarity in every time's session data
     */
    public constructor(public encryptionKey: string, public expiryPeroid?: number, public shuffle?: boolean) {
        if (typeof this.expiryPeroid != 'number' || Number.isNaN(this.expiryPeroid)) this.expiryPeroid = 30 * 60 * 1000;
    }

    /**
     * encrypt string value for client side
     * @param value
     */
    public encrypt(value: string): string {

        if (this.shuffle) {
            let code = util.randomstring(32);

            let mixer = crypto.createCipher(algorithm, code);
            let encrypted = mixer.update(value, 'utf8', 'hex');
            encrypted += mixer.final('hex');
            encrypted = `${mixer.getAuthTag().toString('hex')}+${encrypted}`;

            let encryptor = crypto.createCipher(algorithm, this.encryptionKey);
            let secret = encryptor.update(code, 'utf8', 'hex');
            secret += encryptor.final('hex');
            secret = `${encryptor.getAuthTag().toString('hex')}+${secret}`;

            return `${encrypted}+${secret}`;
        }
        else {
            let encryptor = crypto.createCipher(algorithm, this.encryptionKey);
            let secret = encryptor.update(value, 'utf8', 'hex');
            secret += encryptor.final('hex');
            secret = `${encryptor.getAuthTag().toString('hex')}+${secret}`;

            return `${secret}`;
        }

    }
    /**
     * decrypt string value from client side
     * @param value
     */
    public decrypt(value: string): string {
        if (this.shuffle) {
            let arr = value.split('+');

            let decryptor = crypto.createDecipher(algorithm, this.encryptionKey);
            decryptor.setAuthTag(new Buffer(arr[2], 'hex'));
            let code = decryptor.update(arr[3], 'hex', 'utf8');
            code += decryptor.final('utf8');

            let mixer = crypto.createDecipher(algorithm, code);
            mixer.setAuthTag(new Buffer(arr[0], 'hex'));
            let decrypted = mixer.update(arr[1], 'hex', 'utf8');
            decrypted += mixer.final('utf8');

            return decrypted;
        }
        else {
            let arr = value.split('+');
            let mixer = crypto.createDecipher(algorithm, this.encryptionKey);
            mixer.setAuthTag(new Buffer(arr[0], 'hex'));
            let decrypted = mixer.update(arr[1], 'hex', 'utf8');
            decrypted += mixer.final('utf8');

            return decrypted;
        }
    }

    handler = async (request: http.ServerRequest, response: http.ServerResponse): Promise<boolean> => {
        new CookieSession(request, response, this);
        return true;
    }
}

export interface ISessionData {
    value: string;
    flash?: boolean;
    expiryTime?: number;
    reflash?: boolean;
}
export class CookieSession implements ISession {
    public constructor(public request: http.ServerRequest, public response: http.ServerResponse, public middleware: CookieSessionMiddleware) {
        request['session'] = this;
        response['session'] = this;
        let value = request.headers['cookie'];
        if (value && typeof value == 'string') {
            let SessionString = cookie.parse(value)['session'];
            //console.log('SessionString:', SessionString);
            try {
                this.DataObject = JSON.parse(this.middleware.decrypt(SessionString));
                //console.log('Sesssion DataObject:', this.DataObject);
            }
            catch (ex) {
                this.DataObject = {};
                //console.log('Sesssion DataObject Failed:', ex);
            }
        }
    }
    private DataObject: { [key: string]: ISessionData } = {};
    public save() {
        let Obj: { [key: string]: ISessionData } = {};
        for (let key in this.DataObject) {
            if (!this.DataObject[key].flash) {
                Obj[key] = { value: this.DataObject[key].value };
                if (typeof this.DataObject[key].expiryTime == 'number') Obj[key].expiryTime = this.DataObject[key].expiryTime;
                if (this.DataObject[key].reflash) Obj[key].flash = true;
            }
        }
        //console.log('Save Session:', this.middleware.encrypt(JSON.stringify(Obj)));
        this.response.setHeader('Set-Cookie',
            cookie.serialize(
                'session',
                this.middleware.encrypt(JSON.stringify(Obj)),
                { maxAge: this.middleware.expiryPeroid, httpOnly: true }
            ));
    }
    public async put(key: string, value: string, expiryTime?: number): Promise<void> {
        this.DataObject[key] = { value: value };
        if (typeof expiryTime == 'number') {
            this.DataObject[key]['expiryTime'] = expiryTime;
        }
        this.save();
    }
    public async get(key: string): Promise<string> {
        return this.DataObject[key].value;
    }
    public async delete(key: string): Promise<void> {
        delete this.DataObject[key];
        this.save();
    }
    public async flush(): Promise<void> {
        this.DataObject = {};
        this.save();
    }
    public async flash(key: string, value: string, expiryTime?: number): Promise<void> {
        this.DataObject[key] = { value: value, reflash: true };
        if (typeof expiryTime == 'number') {
            this.DataObject[key]['expiryTime'] = expiryTime;
        }
        this.save();
    }
    public async reflash(): Promise<void> {
        for (let key in this.DataObject) {
            if (this.DataObject[key].flash) this.DataObject[key].reflash = true;
        }
        this.save();
    }
}