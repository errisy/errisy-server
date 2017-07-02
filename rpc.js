"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * RPCError can be sent to the client even in production mode
 */
var RPCError = (function () {
    function RPCError(reason) {
        this.reason = reason;
    }
    return RPCError;
}());
exports.RPCError = RPCError;
/**
 * data entity index declarations
 * the index in mongoDB helps improve query performance
 */
var index;
(function (index) {
    /**
     * ascending index: 1
     * @param target
     * @param propertyKey
     */
    function ascending(target, propertyKey) { }
    index.ascending = ascending;
    ;
    /**
     * descending index: -1
     * @param target
     * @param propertyKey
     */
    function descending(target, propertyKey) { }
    index.descending = descending;
    ;
    /**
     * geo index: "2d"
     * @param target
     * @param propertyKey
     */
    function geo2d(target, propertyKey) { }
    index.geo2d = geo2d;
    ;
    /**
     * geo index: "2dsphere"
     * @param target
     * @param propertyKey
     */
    function geo2dsphere(target, propertyKey) { }
    index.geo2dsphere = geo2dsphere;
    ;
    /**
     * text index: "text"
     * @param target
     * @param propertyKey
     */
    function text(target, propertyKey) { }
    index.text = text;
    ;
    /**
     * hash index: "hash"
     * @param target
     * @param propertyKey
     */
    function hash(target, propertyKey) { }
    index.hash = hash;
    ;
})(index = exports.index || (exports.index = {}));
/**
 * base class for remote procedure call service
 */
var RPCService = (function () {
    function RPCService($request, $response, $session, $rootDir) {
        this.$request = $request;
        this.$response = $response;
        this.$session = $session;
        this.$rootDir = $rootDir;
    }
    return RPCService;
}());
exports.RPCService = RPCService;
/**
 * dummy return value for service calls that has processed the $response in the function
 */
var RawResponse = (function () {
    function RawResponse() {
    }
    return RawResponse;
}());
exports.RawResponse = RawResponse;
/**
 * poly fill types for form post uploads
 */
var Polyfill;
(function (Polyfill) {
    var Blob = (function () {
        function Blob() {
        }
        return Blob;
    }());
    Polyfill.Blob = Blob;
    var File = (function (_super) {
        __extends(File, _super);
        function File() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return File;
    }(Blob));
    Polyfill.File = File;
})(Polyfill = exports.Polyfill || (exports.Polyfill = {}));
/**
 * Register a member in a rpcService to work as cgi method;
 * This function must be async and return a Promise
 * @param target
 * @param propertyKey
 */
function member(target, // The prototype of the class
    propertyKey //,  The name of the method
    //descriptor: TypedPropertyDescriptor<any>
) {
    //console.log("MethodDecorator called on: ", target, propertyKey);
    //return descriptor;
    target['@RPC.Service'] = target['@RPC.Service'] || {};
    target['@RPC.Service'][propertyKey] = true;
}
exports.member = member;
/**
 * Register a class as rpcService so it will be converted to .service.ts and .cgi.ts by rpc service compiler;
 * the .cgi.ts will wrap the service to process http requests;
 * @param target
 */
function service(target) {
    //doing nothing here;
    target['@RPC.Service'] = {};
}
exports.service = service;
function field(target) {
    return function (target, // The prototype of the class
        propertyKey //,  The name of the method
        //descriptor: TypedPropertyDescriptor<any>
    ) {
        //console.log("MethodDecorator called on: ", target, propertyKey);
        //return descriptor;
    };
}
exports.field = field;
/**
 * mark the class as an entity for mongodb, the code for its collection will be generated.
 * @param target
 */
function entity(target) {
    //doing nothing here;
}
exports.entity = entity;
/**
 * mark the class as an structure for mongodb, there will be no collection code for it.
 * @param target
 */
function struct(target) {
}
exports.struct = struct;
function buildClientData() {
    //console.log('contains File or Blob:', items.some(item => item instanceof File || item instanceof Blob));
    var items = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        items[_i] = arguments[_i];
    }
    if (items.some(function (item) { return item instanceof File || item instanceof Blob; })) {
        var form_1 = new FormData();
        var index_1 = 0;
        items.forEach(function (item) {
            if (item instanceof File) {
                var file = item;
                form_1.append("_" + index_1, item, file.name);
                index_1 += 1;
            }
            else if (item instanceof Blob) {
                form_1.append("_" + index_1, item);
                index_1 += 1;
            }
            else {
                form_1.append("_" + index_1, JSON.stringify(item));
                index_1 += 1;
            }
        });
        return form_1;
    }
    else {
        return items;
    }
}
exports.buildClientData = buildClientData;
/**
 * Definition of Entity
 */
var EntityDefinition = (function () {
    function EntityDefinition(Name, Fields) {
        this.Name = Name;
        this.Fields = Fields;
    }
    return EntityDefinition;
}());
exports.EntityDefinition = EntityDefinition;
/**
 * Definition of Field
 */
var FieldDefinition = (function () {
    function FieldDefinition(Name, Type) {
        this.Name = Name;
        this.Type = Type;
    }
    return FieldDefinition;
}());
exports.FieldDefinition = FieldDefinition;
var DataSourceQuery = (function () {
    function DataSourceQuery() {
    }
    return DataSourceQuery;
}());
exports.DataSourceQuery = DataSourceQuery;
var errors = (function () {
    function errors() {
    }
    errors.login_failure = function () {
        return {
            Code: error.login_failure, Reason: 'Wrong Username-Password Combination.'
        };
    };
    return errors;
}());
exports.errors = errors;
var error;
(function (error) {
    error[error["none"] = 0] = "none";
    error[error["login_failure"] = 1] = "login_failure";
})(error = exports.error || (exports.error = {}));
//# sourceMappingURL=rpc.js.map