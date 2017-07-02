import * as session from 'node-session'; 
import * as http from 'http';
import * as fs from 'fs';
import { ISession } from './session'

/** an interface to make errisy-task compatible to standard Promise */
export interface Task<T> extends PromiseLike<T> {
    children?: Task<any>[];
    parent?: Task<any>;
    cancel?: () => void;
    clear?: () => void;
    result?: T;
    reason?: any;
    cancelled?: boolean;
    status?: string;
    all?: (...tasks: Task<any>[]) => Task<any[]>;
}
/**
 * RPCError can be sent to the client even in production mode
 */
export class RPCError {
    constructor(public reason: string) {
    }
}
/**
 * data entity index declarations
 * the index in mongoDB helps improve query performance
 */
export module index {
    /**
     * ascending index: 1
     * @param target
     * @param propertyKey
     */
    export function ascending(
        target: Object,
        propertyKey: string
    ): void { };
    /**
     * descending index: -1
     * @param target
     * @param propertyKey
     */
    export function descending(
        target: Object,
        propertyKey: string
    ): void { };
    /**
     * geo index: "2d"
     * @param target
     * @param propertyKey
     */
    export function geo2d(
        target: Object,
        propertyKey: string
    ): void { };
    /**
     * geo index: "2dsphere"
     * @param target
     * @param propertyKey
     */
    export function geo2dsphere(
        target: Object,
        propertyKey: string
    ): void { };
    /**
     * text index: "text"
     * @param target
     * @param propertyKey
     */
    export function text(
        target: Object,
        propertyKey: string
    ): void { };
    /**
     * hash index: "hash"
     * @param target
     * @param propertyKey
     */
    export function hash(
        target: Object,
        propertyKey: string
    ): void { };
}
/**
 * base class for remote procedure call service
 */
export class RPCService {
    public constructor(public $request: http.ServerRequest, public $response: http.ServerResponse, public $session: ISession, public $rootDir: string ){

    }
}
/**
 * dummy return value for service calls that has processed the $response in the function
 */
export class RawResponse {

}
/**interface return by trylogin from server. it may return the user even failed to login.*/
export interface ILogin {
    username: string;
    success: boolean;
}
/**
 * poly fill types for form post uploads
 */
export module Polyfill {
    export class Blob {
        domain: string | null;
        _events: any;
        _eventCount: number;
        size: number;
        path: string; 
        type: string;
        hash: string | null;
        lastModifiedDate: Date;
        _writeStream: fs.WriteStream;
    }
    export class File extends Blob {
        name: string;
    }
}
export interface IPortalClient {
    Entities(): Promise<EntityDefinition[]>;
    list(entity: EntityDefinition, start?: number, limit?: number, suffix?: string): Promise<any[]>;
    update(entity: EntityDefinition, data: any, suffix?: string): Promise<boolean>;
    delete(entity: EntityDefinition, data: any, suffix?: string): Promise<boolean>;
    insert(entity: EntityDefinition, data: any, suffix?: string): Promise<any>;
    count(entity: EntityDefinition, suffix?: string): Promise<number>;
}
/**
 * Register a member in a rpcService to work as cgi method;
 * This function must be async and return a Promise
 * @param target
 * @param propertyKey
 */
export function member(
    target: Object, // The prototype of the class
    propertyKey: string//,  The name of the method
    //descriptor: TypedPropertyDescriptor<any>
): void {
    //console.log("MethodDecorator called on: ", target, propertyKey);
    //return descriptor;
    target['@RPC.Service'] = target['@RPC.Service'] || {};
    target['@RPC.Service'][propertyKey] = true;
}
/**
 * Register a class as rpcService so it will be converted to .service.ts and .cgi.ts by rpc service compiler;
 * the .cgi.ts will wrap the service to process http requests;
 * @param target
 */
export function service(target: Object) {
    //doing nothing here;
    target['@RPC.Service'] = {};
}

export function field(target: Function) {
    return (
        target: Object, // The prototype of the class
        propertyKey: string//,  The name of the method
        //descriptor: TypedPropertyDescriptor<any>
    ): void => {
        //console.log("MethodDecorator called on: ", target, propertyKey);
        //return descriptor;
    }
}
/**
 * mark the class as an entity for mongodb, the code for its collection will be generated.
 * @param target
 */
export function entity(target: Object) {
    //doing nothing here;
}
/**
 * mark the class as an structure for mongodb, there will be no collection code for it.
 * @param target
 */
export function struct(target: Object) {

}
/**provides an interface for remote procedure call to return error*/
export interface RPCResult {
    value: any;
    error: any;
    success: boolean;
}
export interface IClientFormItem {
    name: string;
    value: any;
    blobname?: string;
    type: 'blob'|'json';
}

export function buildClientData(...items: any[]): any[]|FormData {

    //console.log('contains File or Blob:', items.some(item => item instanceof File || item instanceof Blob));

    if (items.some(item => item instanceof File || item instanceof Blob)) {
        let form = new FormData();
        let index: number = 0;
        items.forEach(item => {
            if (item instanceof File) {
                let file: File = item;
                form.append(`_${index}`, item, file.name);
                index += 1;
            } else if (item instanceof Blob) {
                form.append(`_${index}`, item);
                index += 1;
            } else {
                form.append(`_${index}`, JSON.stringify(item));
                index += 1;
            }
        });
        return form;
    }
    else {
        return items;
    }
}

/**
 * Definition of Entity
 */
export class EntityDefinition {
    public constructor(
        public Name: string,
        public Fields: FieldDefinition[]
    ) { }
    /**the names for suffix entiteis*/
    public Extensions: string[];
}
/**
 * Definition of Field
 */
export class FieldDefinition {
    public constructor(
        public Name: string,
        public Type: string
    ){ }
}

export class DataSourceQuery {
    method: 'list' | 'update' | 'delete' | 'insert' | 'count';
    filter: any;
    value: any;
    skip?: number;
    limit?: number;
}

export class errors {
    static login_failure():IRPCError {
        return {
            Code: error.login_failure, Reason: 'Wrong Username-Password Combination.'
        }
    }
}
export interface IRPCError {
    Code: number;
    Reason: string;
}
export enum error {
    none,
    login_failure
}