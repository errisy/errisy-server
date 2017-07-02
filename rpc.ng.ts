// this file is specific for Angular2/4 response conversion to Promise
import { RPCResult } from './rpc';
import { Response } from '@angular/http';

export class Converter {
    /**
     * Convert string to string;
     * @param res
     */
    static convertStringResponse(res: Response): string {
        //console.log('rpc Converter StringResponse: ', res.text());
        let result: RPCResult = JSON.parse(res.text());
        if (result.success) {
            return result.value;
        }
        else {
            console.warn('Remote Procedure Call Error:\n', result.error);
            throw result.error;
        }
    }
    /**
     * Convert response to json;
     * @param res
     */
    static convertJsonResponse(res: Response): any {
        //console.log('rpc Converter JsonResponse: ', res.text());
        let result: RPCResult = JSON.parse(res.text());
        if (result.success) {
            return result.value;
        }
        else {
            console.warn('Remote Procedure Call Error:\n', result.error);
            throw result.error;
        }
    }
    /**
     * Convert response from text to number value;
     * @param res
     */
    static convertNumberResponse(res: Response): number {
        //console.log('rpc Converter NumberResponse: ', res.text());
        let result: RPCResult = JSON.parse(res.text());
        if (result.success) {
            return result.value;
        }
        else {
            console.warn('Remote Procedure Call Error:\n', result.error);
            throw result.error;
        }
    }
    /**
     * Convert response from text to boolean value;
     * @param res
     */
    static convertBooleanResponse(res: Response): boolean {
        let result: RPCResult = JSON.parse(res.text());
        if (result.success) {
            return (result.value) ? true : false;
        }
        else {
            console.warn('Remote Procedure Call Error:\n', result.error);
            throw result.error;
        }
    }
}