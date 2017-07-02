"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Converter = (function () {
    function Converter() {
    }
    /**
     * Convert string to string;
     * @param res
     */
    Converter.convertStringResponse = function (res) {
        //console.log('rpc Converter StringResponse: ', res.text());
        var result = JSON.parse(res.text());
        if (result.success) {
            return result.value;
        }
        else {
            console.warn('Remote Procedure Call Error:\n', result.error);
            throw result.error;
        }
    };
    /**
     * Convert response to json;
     * @param res
     */
    Converter.convertJsonResponse = function (res) {
        //console.log('rpc Converter JsonResponse: ', res.text());
        var result = JSON.parse(res.text());
        if (result.success) {
            return result.value;
        }
        else {
            console.warn('Remote Procedure Call Error:\n', result.error);
            throw result.error;
        }
    };
    /**
     * Convert response from text to number value;
     * @param res
     */
    Converter.convertNumberResponse = function (res) {
        //console.log('rpc Converter NumberResponse: ', res.text());
        var result = JSON.parse(res.text());
        if (result.success) {
            return result.value;
        }
        else {
            console.warn('Remote Procedure Call Error:\n', result.error);
            throw result.error;
        }
    };
    /**
     * Convert response from text to boolean value;
     * @param res
     */
    Converter.convertBooleanResponse = function (res) {
        var result = JSON.parse(res.text());
        if (result.success) {
            return (result.value) ? true : false;
        }
        else {
            console.warn('Remote Procedure Call Error:\n', result.error);
            throw result.error;
        }
    };
    return Converter;
}());
exports.Converter = Converter;
//# sourceMappingURL=rpc.ng.js.map