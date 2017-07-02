import * as http from 'http';

export interface IPromisedMiddleware {
    //return true if should try next one;
    handler: (request: http.ServerRequest, response: http.ServerResponse) => Promise<boolean>;
}