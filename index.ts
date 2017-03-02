//a simple node server
import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as fs from 'fs';
import * as vm from 'vm';
import * as net from 'net';
import * as nodepath from 'path';
import * as child_process from 'child_process';
import * as process from 'process';
import * as uuid from 'uuid';
import { mime } from './mime.sys';
import * as efs from 'errisy-fs';
import * as rpc from 'errisy-rpc';
import * as session from 'node-session'; 
import * as formidable from "formidable";

export interface IServerOptions {
    main: string;
    watches: string[];
    key: string;
    cert: string;
    session: string;
}

export class Util {
    static GenerateRandomKey(length?: number, chars?: string) {
        if (length == undefined || length == null) length = 32;
        if (!chars) chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let chrlen = chars.length;
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(chrlen * Math.random()))
        }
        return result;
    }
    
}

export class HttpServer {
    constructor(public port?: number) {
        if (typeof this.port != 'number') this.port = 80;
    }  
    public Middlewares: IPromisedMiddleware[] = []; 
    public handler = async (request: http.ServerRequest, response: http.ServerResponse) => {
        for (let i = 0; i < this.Middlewares.length; i++) {
            let middleware = this.Middlewares[i];
            try {
                if (! await middleware.handler(request, response)) return;
            }
            catch (ex) {
                console.log(ex);
                Response500(response, (request.headers['host'] ? request.headers['host'] : '') + request.url);
            }
        }
        Response404(response, request.url);
        return undefined;
    }
    private checkPort = (callback: () => void) => {
        let tester = net.createServer();
        let that = this;
        tester.once('error', (err: NodeJS.ErrnoException) => {
            if (err.code == 'EADDRINUSE') {
                //try later 
                console.log('Port ' + this.port + ' is not Free. Server will try again in 0.5 sec ...');
                setTimeout(()=>that.checkPort(callback), 500);
            }
        });
        tester.once('listening', () => {
            console.log('Port ' + this.port + ' is Free. Starting HTTP Server...');
            tester.close();
            callback();
        });
        tester.listen(this.port);
    }
    public start() {
        this.checkPort(this.startServer);
    }
    public server: http.Server | https.Server;
    protected startServer = () => {
        this.server = http.createServer(this.handler);
        this.server.listen(this.port);
    }
    public stop () {
        this.server.close();
    }
}
export class HttpsServer extends HttpServer {
    constructor(public port?: number, public options?: https.ServerOptions) {
        super(port);
    }  

    public PrivateKeyFile: string;
    public CertificateFile: string;

    protected startServer = () => {
        if (this.options) {
            this.server = https.createServer(this.options, this.handler);
        }
        else if (this.PrivateKeyFile && this.CertificateFile) {
            var privateKey = fs.readFileSync(this.PrivateKeyFile).toString();
            var certificate = fs.readFileSync(this.CertificateFile).toString();
            this.server = https.createServer({ cert: certificate, key: privateKey }, this.handler);
        }
        this.server.listen(this.port);
    }
}
export interface IPromisedMiddleware {
    //return true if should try next one;
    handler: (request: http.ServerRequest, response: http.ServerResponse)=>Promise<boolean>;
}
export class WrappedMiddleware implements IPromisedMiddleware {
    constructor(public CallbackMiddleware: (request: http.ServerRequest, response: http.ServerResponse, next: () => any)=> any){

    }
    public async handler(request: http.ServerRequest, response: http.ServerResponse): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let resolved: boolean = false;
            let next = () => {
                resolved = true;
                resolve(true);
            };
            let terminate = () => { if(!resolved) resolve(false) };
            this.CallbackMiddleware(request, response, next);
        })
    }
}
export interface IDomainSetup {
    domain?: string;//domain name
    options?: string;//Regex Options
    regex?: RegExp;
    root: string| (string[]);
    middlewares: IPromisedMiddleware[];
}
/**
 * domain middleware will handle the request with its own middlewares, it will terminate the middleware chain.
 */
export class DomainMiddleware implements IPromisedMiddleware {
    constructor(public domains?: IDomainSetup[]) {
        if (!Array.isArray(domains)) this.domains = [];
        this.domains = this.domains.map(dom => {
            // accepts multiple root and will work for the first existing one
            if (Array.isArray(dom.root)) {
                let found: string;
                for (let dir of dom.root) {
                    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
                        found = dir;
                        break;
                    }
                }
                if (found) {
                    dom.root = found;
                    console.log(`use dom root: ${found}`);
                }
            }
            if (dom.domain) dom.regex = new RegExp(dom.domain, dom.options ? dom.options : 'ig');
            return dom;
        }); 
    }
    private map: { [domain: string]: IDomainSetup } = {};
    async handler(request: http.ServerRequest, response: http.ServerResponse): Promise<boolean>  {
        let host = request.headers['host'];
        if (host) {
            for (let i = 0; i < this.domains.length; i++) {
                let domain = this.domains[i];
                domain.regex.lastIndex = undefined;
                domain.regex.lastIndex = undefined;
                if (domain.regex.test(host)) {
                    request['$DomainRootDir'] = domain.root;
                    for (let j = 0; j < domain.middlewares.length; j++) {
                        let middleware = domain.middlewares[j];
                        try {
                            if (! await middleware.handler(request, response)) return false;
                        }
                        catch (ex) {
                            console.log(ex);
                            Response500(response, (request.headers['host'] ? request.headers['host'] : '') + request.url);
                        }
                    }
                    Response404(response, request.url);
                    return false;
                }
            }
        }
        return true;//must return true to allow other domain middlewares to work
    }
}

export interface IHostRedirctEntry {
    domain?: string;
    options?: string;
    regex?: RegExp;
    host: string;
    protocal?: 'http'|'https';
}
/**
 * redirect to a different domain or protocal.
 * e.g. when you want user to access only https, you can set up http server to perform redirection to https://
 */
export class HostRedirctMiddleware implements IPromisedMiddleware {
    constructor(public entries?: IHostRedirctEntry[]) {
        if (!Array.isArray(this.entries)) this.entries = [];
        this.entries = this.entries.map(opt => {
            if (opt.domain) opt.regex = new RegExp(opt.domain, opt.options?opt.options:'ig');
            return opt;
        });
    }
    public async handler(request: http.ServerRequest, response: http.ServerResponse): Promise<boolean> {
        let host = request.headers['host'];
        if (host) {
            for (let i = 0; i < this.entries.length; i++) {
                let entry = this.entries[i];
                entry.regex.lastIndex = undefined;
                if (entry.regex.test(host)) {
                    //redirect to the specific protocal and host;
                    response.writeHead(302, {
                        Location: `${entry.protocal ? entry.protocal : 'http'}://${entry.host}${request.url}`
                    })
                    response.end();
                    return false;
                }
            }
        }
        return true;
    }
}
/**
 * enable node session on the request and response;
 * please make sure different cluster instances are using the same secret for session, otherwise, there may be conflicts.
 */
export class SessionMiddleware implements IPromisedMiddleware {
    public session: session;
    constructor(public secret?: string) {
        if (!this.secret) this.secret = Util.GenerateRandomKey();
        this.session = new session({ secret: this.secret });
    }
    async handler(request: http.ServerRequest, response: http.ServerResponse): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                this.session.startSession(request, response, () => {
                    resolve(true);
                })
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
}
/**
 * enable cors and set Access-Control-Allow-* for preflighted OPTIONS requests
 */
export class CORSMiddleware implements IPromisedMiddleware {
    async handler(request: http.ServerRequest, response: http.ServerResponse): Promise<boolean> {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET,POST');
        response.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Cookie, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
        if (request.method.toUpperCase() == 'OPTIONS') {
            response.writeHead(200);
            response.end();
            return false;
        }
        return true;
    }
}


export function Response404(response: http.ServerResponse, path: string) {
    response.writeHead(404, {
        "Content-Type": "text/plain"
    });
    response.end('File ' + path + ' can not be found on the server.');
}
export function Response500(response: http.ServerResponse, path: string) {
    response.writeHead(500, {
        "Content-Type": "text/plain"
    });
    response.end('File ' + path + ' encountered internal server errors.');
}

export interface IRouteRule {
    route: string;
    options: string;
    regex?: RegExp;
    /**access: true for accessible, false for 404 not found*/
    access: boolean;
}
/**
 * define routing rules for web app to block/enable paths;
 */
export class RouteMiddleware implements IPromisedMiddleware {
    constructor(public rules: IRouteRule[]) {
        this.rules = rules.map(rule => {
            if (rule.route) rule.regex = new RegExp(rule.route, rule.options ? rule.options : 'ig');
            return rule;
        }).filter(rule => rule.regex);
    }
    async handler(request: http.ServerRequest, response: http.ServerResponse): Promise<boolean> {
        let link = url.parse(decodeURI(request.url));
        for (let i = 0; i < this.rules.length; i++) {
            let rule = this.rules[i];
            rule.regex.lastIndex = undefined;
            if (rule.regex.test(link.pathname)) return rule.access;
        }
        return true;
    }
}

export class FileUtilities {
    static async PipeFile(request: http.ServerRequest, response: http.ServerResponse, filename: string) {
        let stats: fs.Stats;
        try {
            if (!await efs.exists(filename)) return true;
            stats = await efs.stat(filename);
            if (!stats.isFile()) return true;
        }
        catch (ex) {
            return true;
        }

        let mimes = mime.lookup(filename);
        let maxSize: number = (mimes[0] && mimes[0].isDefaultStream) ? 204800 : stats.size;

        if (stats.size <= 204800) {
            if (mimes.length > 0) {
                response.writeHead(200, {
                    "Content-Type": mimes[0].MIME,
                    "Content-Length": stats.size
                });
            }
            else {
                response.writeHead(200, {
                    "Content-Type": "application/octet-stream",
                    "Content-Length": stats.size
                });
            }
            let readStream = fs.createReadStream(filename);
            readStream.pipe(response);
        }
        else {
            //too big (> 200K) that could be stream, we need to send as 200KB block stream
            let range: string = request.headers['range'];
            let start: number, end: number;
            let total: number = stats.size;
            let chunksize: number;
            if (range) {
                let positions = range.replace(/bytes=/, "").split("-");
                start = parseInt(positions[0], 10);
                end = positions[1] ? parseInt(positions[1], 10) : start + 204799;
            }
            else {
                start = 0;
                end = start + maxSize - 1;
            }
            if (start > total - 1) start = total - 1;
            if (end > total - 1) end = total - 1;
            chunksize = (end - start) + 1;
            let statusCode = (chunksize == stats.size) ? 200 : 206;
            if (mimes.length > 0) {
                response.writeHead(statusCode, {
                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                    "Accept-Ranges": "bytes",
                    "Content-Length": chunksize,
                    "Content-Type": mimes[0].MIME
                });
            }
            else {
                response.writeHead(statusCode, {
                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                    "Accept-Ranges": "bytes",
                    "Content-Length": chunksize,
                    "Content-Type": "application/octet-stream"
                });
            }
            //console.log({ start: start, end: end });
            let readStream = fs.createReadStream(filename, { start: start, end: end });
            readStream.pipe(response);
            //console.log(request.url, maxSize, statusCode);
        }
    }
}

export class FileWhiteListMiddleware implements IPromisedMiddleware {
    /** This provides a default index for the file middleware.*/
    constructor(public whitelist: RegExp[], public defaultFile?: string) {
        if (!this.defaultFile) this.defaultFile = 'index.html';
    }
    async  handler(request: http.ServerRequest, response: http.ServerResponse) {
        //console.log('trying file middleware');
        let link = url.parse(decodeURI(request.url));
        let domainRootDir = request['$DomainRootDir'] ? request['$DomainRootDir'] : __dirname;
        let filename = domainRootDir + decodeURI(link.pathname);

        let relativePath: string = link.pathname;
        if (/\/$/.test(filename)) {
            filename += this.defaultFile;
            relativePath += this.defaultFile;
        }
        if (!Array.isArray(this.whitelist) || !this.whitelist.some(rgx => {
            rgx.lastIndex = undefined;
            return rgx.test(relativePath);
        })) {
            Response404(response, link.pathname);
            return false;
        }
        let stats: fs.Stats;
        try {
            if (!await efs.exists(filename)) return true;
            stats = await efs.stat(filename);
            if (!stats.isFile()) return true;
        }
        catch (ex) {
            return true;
        }

        let mimes = mime.lookup(filename);
        let maxSize: number = (mimes[0] && mimes[0].isDefaultStream) ? 204800 : stats.size;

        if (stats.size <= 204800) {
            if (mimes.length > 0) {
                response.writeHead(200, {
                    "Content-Type": mimes[0].MIME,
                    "Content-Length": stats.size
                });
            }
            else {
                response.writeHead(200, {
                    "Content-Type": "application/octet-stream",
                    "Content-Length": stats.size
                });
            }
            let readStream = fs.createReadStream(filename);
            readStream.pipe(response);
        }
        else {
            //too big (> 200K) that could be stream, we need to send as 200KB block stream
            let range: string = request.headers['range'];
            let start: number, end: number;
            let total: number = stats.size;
            let chunksize: number;
            if (range) {
                let positions = range.replace(/bytes=/, "").split("-");
                start = parseInt(positions[0], 10);
                end = positions[1] ? parseInt(positions[1], 10) : start + 204799;
            }
            else {
                start = 0;
                end = start + maxSize - 1;
            }
            if (start > total - 1) start = total - 1;
            if (end > total - 1) end = total - 1;
            chunksize = (end - start) + 1;
            let statusCode = (chunksize == stats.size) ? 200 : 206;
            if (mimes.length > 0) {
                response.writeHead(statusCode, {
                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                    "Accept-Ranges": "bytes",
                    "Content-Length": chunksize,
                    "Content-Type": mimes[0].MIME
                });
            }
            else {
                response.writeHead(statusCode, {
                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                    "Accept-Ranges": "bytes",
                    "Content-Length": chunksize,
                    "Content-Type": "application/octet-stream"
                });
            }
            //console.log({ start: start, end: end });
            let readStream = fs.createReadStream(filename, { start: start, end: end });
            readStream.pipe(response);
            //console.log(request.url, maxSize, statusCode);
        }
        //the file is processed here, stop passing to the next middleware
        return false;
    }
}
export class FrontEndRouterMiddleware implements IPromisedMiddleware {
    constructor(public routes: { patterns: RegExp[], file: string }[]) {}
    async handler(request: http.ServerRequest, response: http.ServerResponse) {
        let link = url.parse(decodeURI(request.url));
        let found = this.routes.find(route => Array.isArray(route.patterns) && route.patterns.length > 0 && route.patterns.some(ptn => ((ptn.lastIndex = undefined), ptn.test(link.pathname))));
        if (found) {
            let domainRootDir = request['$DomainRootDir'] ? request['$DomainRootDir'] : __dirname;
            let filename = nodepath.join(domainRootDir, decodeURI(found.file));
            return await FileUtilities.PipeFile(request, response, filename);
        }
        else {
            return true;
        }
    }
}
export class FileMiddleware implements IPromisedMiddleware {
    /** This provides a default index for the file middleware.*/
    constructor(public defaultFile?: string) {
        if (!this.defaultFile) this.defaultFile = 'index.html';
    }
    async handler (request: http.ServerRequest, response: http.ServerResponse)  {
        //console.log('trying file middleware');
        let link = url.parse(decodeURI(request.url));
        let domainRootDir = request['$DomainRootDir'] ? request['$DomainRootDir'] : __dirname;
        let filename = domainRootDir + decodeURI(link.pathname);
        if (/\/$/.test(filename)) filename += this.defaultFile;
        //console.log('filename', filename);
        let stats: fs.Stats;
        try {
            if (!await efs.exists(filename)) return true;
            stats = await efs.stat(filename);
            if (!stats.isFile()) return true;
        }
        catch (ex) {
            return true;
        }

        let mimes = mime.lookup(filename);
        let maxSize: number = (mimes[0] && mimes[0].isDefaultStream) ? 204800 : stats.size;

        if (stats.size <= 204800) {
            if (mimes.length > 0) {
                response.writeHead(200, {
                    "Content-Type": mimes[0].MIME,
                    "Content-Length": stats.size
                });
            }
            else {
                response.writeHead(200, {
                    "Content-Type": "application/octet-stream",
                    "Content-Length": stats.size
                });
            }
            let readStream = fs.createReadStream(filename);
            readStream.pipe(response);
        }
        else {
            //too big (> 200K) that could be stream, we need to send as 200KB block stream
            let range: string = request.headers['range'];
            let start: number, end: number;
            let total: number = stats.size;
            let chunksize: number;
            if (range) {
                let positions = range.replace(/bytes=/, "").split("-");
                start = parseInt(positions[0], 10);
                end = positions[1] ? parseInt(positions[1], 10) : start + 204799;
            }
            else {
                start = 0;
                end = start + maxSize - 1;
            }
            if (start > total - 1) start = total - 1;
            if (end > total - 1) end = total - 1;
            chunksize = (end - start) + 1;
            let statusCode = (chunksize == stats.size) ? 200 : 206;
            if (mimes.length > 0) {
                response.writeHead(statusCode, {
                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                    "Accept-Ranges": "bytes",
                    "Content-Length": chunksize,
                    "Content-Type": mimes[0].MIME
                });
            }
            else {
                response.writeHead(statusCode, {
                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                    "Accept-Ranges": "bytes",
                    "Content-Length": chunksize,
                    "Content-Type": "application/octet-stream"
                });
            }
            //console.log({ start: start, end: end });
            let readStream = fs.createReadStream(filename, { start: start, end: end });
            readStream.pipe(response);
            //console.log(request.url, maxSize, statusCode);
        }
        //the file is processed here, stop passing to the next middleware
        return false;
    }
}
export class DirectoryMiddleware implements IPromisedMiddleware {
    async handler    (request: http.ServerRequest, response: http.ServerResponse)   {
        //console.log('trying directory middleware');
        let link = url.parse(request.url);
        let domainRootDir = request['$DomainRootDir'] ? request['$DomainRootDir'] : __dirname;
        let filename = domainRootDir + decodeURI(link.pathname);
        //console.log('filename', filename);
        let stats: fs.Stats;
        try {
            if (!await efs.exists(filename)) return true;
            stats = await efs.stat(filename);
            if (!stats.isDirectory()) return true;
        }
        catch (ex) {
            return true;
        }
        response.writeHead(200, {
            "Content-Type": "text/html"
        });

        try {
            let files = await efs.readdir(filename);
            let pathname = pathreducer.toPathname(decodeURI(link.pathname));
            let result = '<html>\n\
<head>\n\
<title>Index of /</title>\n\
<meta charset="UTF-8">\
</head>\n\
<body>\n\
<h1>Index of '+ pathname + '</h1>\n\
<ul>\n' +
                files.map(file => '\t<li><a href="' + (pathname + file).replace(/\\/ig, '\\\\') + '">' + file + '</a></li>\n').join('') +
                '</ul>\n\
<div>Simple Node Service</div>\
</body></html>';
            response.end(result);

        }
        catch (ex) {
            return true;
        }
    }
}
export class pathreducer {
    static reduce(path: string) {
        return path.replace(/[^\\^\/^\:]+[\\\/]+\.\.[\\\/]+/ig, '').replace(/([^\:])[\\\/]{2,}/ig, (capture: string, ...args: string[]) => {
            return args[0] + '\/';
        }).replace(/\.[\\\/]+/ig, '');
    }
    static filename(path: string) {
        let index = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('\/'));
        if (index > -1) return path.substr(index + 1);
        return path;
    }
    static pathname(path: string) {
        let index: number = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('\/'));
        //console.log('[pathreducer]->pathaname: ', path, index, path.length);
        if (index == path.length -1) return path.substr(0, index + 1);
        return path;
    }
    static file2pathname(path: string) {
        let index: number = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('\/'));
        //console.log('[pathreducer]->pathaname: ', path, index, path.length);
        if (index > - 1) return path.substr(0, index + 1);
        return path;
    }
    static toPathname(path: string) {
        let index: number = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('\/'));
        if (index < path.length-1) return path + '/';
        return path;
    }
}
 

    /**
     * This is a task stack that accepts task request from request for high performance tasks running in child process.
     * You shall use task when *.cgi.js or *.rpc.js can not handle the request in synchronized manner (e.g. taking to long time to complete);
     */
export class TaskHost {
    private creationCount: number = 0;
    private tasksToRun: TaskInfo[] = [];
    private tasksRunning: TaskInfo[] = [];
    private tasksCompleted: TaskInfo[] = [];
    /** Create a task and return the task id.*/
    public createTask = (job: string, args: string[], obj: string): string => {
        //console.log('create task.');
        this.creationCount += 1;
        let info: TaskInfo = {
            id: this.creationCount.toString(),
            filename: job,
            args: args,
            status: 'Scheduled',
            obj: obj
        }
        this.tasksToRun.push(info);
        return info.id;
    }
    /** Cancel the task is scheduled or started*/
    public cancelTask = (id: string): void => {
        let available: TaskInfo[] = [];
        this.tasksToRun.forEach(task => available.push(task));
        this.tasksRunning.forEach(task => available.push(task));
        available.filter(task => task.id == id).forEach(task => {
            try {
                task.process.pid && task.process.kill && task.process.kill();
            }
            catch (ex) {

            }
        });
    }
    public start = () => {
        //console.log('task start.');
        while (this.tasksToRun.length > 0) {
            let task = this.tasksToRun.shift();
            task.starttime = Number(new Date());
            task.status = 'Running';
            this.tasksRunning.push(task);
            let that = this;
            //console.log('starting task');
            task.process = child_process.fork(task.filename + '.sys.js', task.args);
            task.process.on('message', (data: string) => {
                //console.log('Task ' + task.id + ' - progress :', data);
                task.progress = data;
            });
            //task.process.emit('message', task.obj);
            task.process.send(task.obj);
            task.process.on('error', () => {
                let errorTask = that.tasksRunning.splice(that.tasksRunning.indexOf(task), 1)[0];
                errorTask.status = 'Error';
                that.tasksCompleted.push(errorTask);
            });
            task.process.on('exit', () => {
                //console.log('Task ' + task.id + ' has completed.');
                let completedTask = that.tasksRunning.splice(that.tasksRunning.indexOf(task), 1)[0];
                completedTask.status = 'Completed';
                completedTask.endtime = Number(Date.now());
                that.tasksCompleted.push(completedTask);
            });
        }
    }
    private onStatusUpdate = () => {

    }
    public checkStatus = (id: string): TaskInfo => {
        let target: TaskInfo;
        if (this.tasksToRun.some(task => {
            if (task.id == id) {
                target = task;
                return true;
            }
        }) ||
            this.tasksRunning.some(task => {
                if (task.id == id) {
                    target = task;
                    return true;
                }
            }) ||
            this.tasksCompleted.some(task => {
                if (task.id == id) {
                    target = task;
                    return true;
                }
            })) {
            //only return part of the information;
            //process will not be exposed to the cgi;
            return {
                id: target.id,
                filename: target.filename,
                status: target.status,
                progress: target.progress,
                starttime: target.starttime,
                endtime: target.endtime
            };
        }
        else {
            return undefined;
        }
            
    }
}
export interface TaskInfo {
    id: string;
    filename: string;
    status?: 'Scheduled'|'Running'|'Error'|'Completed';
    progress?: string;
    /**start time in milliseconds from 1970-1-1 00:00:00*/
    starttime?: number;
    /**start time in milliseconds from 1970-1-1 00:00:00*/
    endtime?: number;
    process?: child_process.ChildProcess;
    args?: string[];
    obj?: any;
}

let ServerTaskHost = new TaskHost();

let ptnRPCMethod = /^\?([\w\.]+)([&@\-]?)(\w+)/; //[@: get &: set null:method]
let ptnRPCGETMethod = /^\?([\w\.]+)([&@\-]?)(\w+)&?/; //[@: get &: set null:method]
interface IRPCScript {
    (): { [id: string]: Function };
}
    // References is the dictionary that hold all loaded library;
    let References: { [id: string]: { [id: string]: ObjectConstructor } } = {};


/**
    * works out whether it is a multiple part form data;
    * @param headers
    */
function isContentTypeMultiplePartForm(headers: any) {
    for (let key in headers) {
        if (key.toLowerCase() == 'content-type') {
            return /^multipart\/form-data;/ig.test(headers[key]);
        }
    }
    return false;
}
/**
    * RPC middleware will capture pathname with *.rpc.js, and wrap *.rpc.js with a function so as to obtain the service $Object.
    * Then we will call $Object[memberName].apply($Object, parameters) to invoke the method to produce response objects for the request.
    * vm is used to invoke the code dynamically, any modification will be read by the server. The drawback is its relatively lower performance.
    * If the service is considered stable, the *.rpc.js should be converted to js file and loaded by 'require' for reuse;
    * There is a memory leak issue when codes are dynamically loaded
    */
export class RPCMiddleware implements IPromisedMiddleware {
    constructor(public dyanmic?: boolean, public useDeserialzer?: boolean) {

    }

    public modules: { [id: string]: any } = {};
    static ReceiveJsonAsync(request: http.ServerRequest, domainRootDir: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            switch (request.method.toUpperCase()) {
                case 'POST':
                    let body = "";
                    request.on('data', function (chunk: string) {
                        body += chunk;
                    });
                    request.on('end', function () {
                        try {
                            let obj = JSON.parse(body);
                            resolve(obj);
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    });
                    break;
                default:
                    resolve({});
                    break;
            }
        });
    }
    static ReceiveFormAsync(request: http.ServerRequest, domainRootDir: string): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            let form = new formidable.IncomingForm();
            let fields: { [key: string]: any } = {};
            let files: { [key: string]: any } = {};
            let names: string[] = [];
            form.on('fileBegin', function (name, file) {
                file.path = domainRootDir + '/upload/temp/' + uuid.v4();
                names.push(name);
            });
            form.on('file', function (name, file) {
                files[name] = file;
            });
            form.on('field', function (name, value) {
                fields[name] = RPCMiddleware.Deserialize(value, domainRootDir);
                names.push(name);
            });
            form.on('end', () => {
                let args: any[] = [];
                for (let i = 0; i < names.length; i++) {
                    //console.log(keys[i], fields[keys[i]], files[keys[i]]);
                    if (fields[names[i]]) {
                        args.push(fields[names[i]]);
                    }
                    else if (files[names[i]]) {
                        args.push(files[names[i]]);
                    }
                }
                resolve(args);
            });
            form.on('error', (err) => {
                reject(err);
            });
            form.parse(request);
        })
    }
    static Deserialize(jsonObject: any, domainRootDir: string): any {
        if (typeof jsonObject != 'object') return jsonObject;
        if (jsonObject == null) return null;
        if (jsonObject == undefined) return undefined;
        if (Array.isArray(jsonObject)) {
            //console.log('Deserialize Array: ', JSON.stringify(jsonObject));

            for (let i = 0; i < (<any[]>jsonObject).length; i++) {
                (<any[]>jsonObject)[i] = RPCMiddleware.Deserialize((<any[]>jsonObject)[i], domainRootDir);
            }
        }
        if (jsonObject['@Serializable.ModuleName'] && jsonObject['@Serializable.TypeName']) {
            //console.log('Deserialize Object: ', JSON.stringify(jsonObject));
            let moduleName: string = jsonObject['@Serializable.ModuleName'];
            let typeName: string = jsonObject['@Serializable.TypeName'];
            //load module to References
            if (moduleName.charAt(0) == '/') {
                //this is a relative file;
                // if the module was not loaded, load it from the module file;
                //console.log('__relativeRoot: ', __relativeRoot);
                if (!References[moduleName]) {
                    let $file = pathreducer.reduce(domainRootDir + moduleName + '.js');
                    //console.log('Deserialize->Load Type Def from: ', $file);
                    References[moduleName] = RPCMiddleware.DynamicRequire(domainRootDir, pathreducer.filename($file), pathreducer.file2pathname($file));
                }
            }
            else {
                //this is a type from module
                References[moduleName] = require(moduleName);
            }

            //how to obtain the module and type from it?
            let obj = new References[moduleName][typeName]();
            //console.log('obj built: ', moduleName, typeName, obj);
            for (let key in jsonObject) {
                if (key != '$$hashKey')
                    obj[key] = RPCMiddleware.Deserialize(jsonObject[key], domainRootDir);
            }
            return obj;
        }
        return jsonObject;
    }
    /**
    * Dynamically load and run a script in a try-catch block. This is great for debugging.
    * @param fileName The script file name with relative path. e.g. "../app/testModule". '.js' will be added to the end of the file name.
    * @param directoryName The directory where the script file is located. By default it is the root directory.
    */
    static DynamicRequire(domainRootDir: string, fileName: string, directoryName?: string) {
        try {
            if (!directoryName) directoryName = domainRootDir;
            //console.log('DynamicRequire: ', fileName, ' Base Path: ' + directoryName);
            let required: { [id: number]: any } = {};
            let requiredIndex: number = 0;
            let fullFilename: string = pathreducer.reduce(directoryName + '//' + fileName);
            if (fs.existsSync(fullFilename)) {
                if (fs.statSync(fullFilename).isFile()) {

                    let code =
                        `(function (){
    \ttry{
    \t\tlet exports = {};
    \t\tlet module = {};
    ${
                        fs.readFileSync(fullFilename).toString().replace(/require\s*\(\s*[\'"`](\.+[\/a-z_\-\s0-9\.]+)[\'"`]\s*\)/ig, (capture: string, ...args: any[]) => {
                            //let $file = pathreducer.reduce(directoryName + '//' + args[0] + '.js');
                            let $modulePath: string = args[0];
                            let $file: string;
                            //console.log('path capture:', capture, args[0]);
                            //console.log('module path: ', $modulePath, /^\.{1,2}/i.test($modulePath));
                            if (/^\.{1,2}/i.test($modulePath)) {
                                $file = pathreducer.reduce(directoryName + '//' + args[0] + '.js');
                            }
                            else {
                                $file = pathreducer.reduce(directoryName + '/node_modules/' + args[0] + '/index.js');
                            }
                            required[requiredIndex] = this.DynamicRequire(domainRootDir, pathreducer.filename($file), pathreducer.file2pathname($file));
                            let replacement = '$__required[' + requiredIndex + ']';
                            requiredIndex += 1;
                            return replacement;
                        })}
    \t\treturn exports;
    \t}
    \tcatch(ex){
    \tconsole.log('Error:', ex, '@${fullFilename.replace(/\\/ig, '\\\\')}');
    \treturn undefined;
    \t}
    })`;

                    let context = vm.createContext({
                        console: console,
                        require: require,
                        Buffer: Buffer,
                        __dirname: directoryName,
                        __filename: __filename,
                        process: process,
                        $__required: required
                    });
                    let _script = vm.createScript(code);
                    let fn: Function = _script.runInContext(context);
                    let exported: any = fn();
                    if (!exported) console.log('Exported is undefined: ', fullFilename);
                    if (exported['__relativeRoot']) exported['__relativeRoot'] = domainRootDir;
                    fn = undefined;
                    required = undefined;
                    context = undefined;
                    _script = undefined;
                    return exported;
                }
                else {
                    console.log('dynamicRequire Error: File not found - ' + fullFilename);
                }
            }
            else {
                console.log('dynamicRequire Error: File not found - ' + fullFilename);
            }
        }
        catch (ex) {
            console.log('dynamicRequire Error: ', ex);
        }
    }

    async getServiceClass(filename: string, className: string, link: url.Url, domainRootDir: string): Promise<any> {

        if (!this.dyanmic && this.modules[filename]) {
            let $module = this.modules[filename];
            return $module[className];
        }

            let data = await efs.readFile(filename);
            let precode = data.toString();
            //let varCGI: string;
            let scriptFile = pathreducer.reduce(domainRootDir + '\/' + link.pathname);
            let $directory = pathreducer.file2pathname(scriptFile);

            let required: { [id: number]: any } = {};
            let requiredIndex: number = 0;
            let argumentlist: { [id: string]: any } = {};

            let code =
                `(function (){
\ttry{
\t\tlet exports = {};
\t\tlet module = {};
${
                precode.replace(/require\s*\(\s*[\'"](\.+[\/a-z_\-\s0-9\.]+)[\'"]\s*\)/ig, (capture: string, ...args: any[]) => {
                    let $file = pathreducer.reduce($directory + '//' + args[0] + '.js');

                    required[requiredIndex] = RPCMiddleware.DynamicRequire(domainRootDir, pathreducer.filename($file), pathreducer.file2pathname($file));
                    let replacement = '$__required[' + requiredIndex + ']';
                    requiredIndex += 1;
                    return replacement;
                })}
\t\treturn exports;
\t}
\tcatch(ex){
\tconsole.log('Error:', ex, '@${scriptFile.replace(/\\/ig, '\\\\')}');
\treturn undefined;
\t}
})`;
            //console.log(code);
            let context = vm.createContext({
                console: console,
                require: require,
                Buffer: Buffer,
                __dirname: $directory,
                __filename: scriptFile,
                process: process,
                $__required: required,
                module: undefined
            });
            let _script = vm.createScript(code);
            code = undefined;
            let fn: IRPCScript = _script.runInContext(context);
            let $module = fn(); //the module is returned;

            if (!this.dyanmic) {
                this.modules[filename] = $module;
            }

            return $module[className]; //this is the class type

    }
    async handler(request: http.ServerRequest, response: http.ServerResponse) {
        let link = url.parse(decodeURI(request.url));
        if (!/\.rpc\.js$/ig.test(link.pathname)) return true;
        let domainRootDir = request['$DomainRootDir'] ? request['$DomainRootDir'] : __dirname;

        let filename = domainRootDir + link.pathname;
        let that = this;

        let stats: fs.Stats;

        try {
            if (!efs.exists) return Response404(response, link.path);
            stats = await efs.stat(filename);
            if (!stats.isFile()) return true;
        }
        catch (ex) {
            return Response404(response, link.path);
        }

        

        let rpcArgs: any[];

        let method = request.method.toUpperCase();
        switch (method) {
            case 'POST':
                if (isContentTypeMultiplePartForm(request.headers)) {
                    rpcArgs = await RPCMiddleware.ReceiveFormAsync(request, domainRootDir);
                }
                else {
                    rpcArgs = await RPCMiddleware.ReceiveJsonAsync(request, domainRootDir);
                }
                break;
            case 'GET'://add GET support for functions without parameters:
                {
                    ptnRPCGETMethod.lastIndex = undefined;
                    let matches = ptnRPCGETMethod.exec(link.search);
                    rpcArgs = link.search.substr(matches[0].length).split('&');
                }
                break;
        }

        ptnRPCMethod.lastIndex = undefined;
        let matches = ptnRPCMethod.exec(link.search);
        let className = matches[1];
        let memberType = matches[2];
        let memberName = matches[3];

        

        try {
            let $class = await this.getServiceClass(filename, className, link, domainRootDir);

            //console.log('$class: ', $class);
            let $instance = new $class(request, response, request['session'], domainRootDir);

            //console.log('instance created: ', $instance[memberName]);

            let result = await <Promise<any>>($instance[memberName].apply($instance, rpcArgs));
            if (result instanceof rpc.RawResponse) {
                return; //nothing to do there
            }
            else {
                switch (method) {
                    case 'POST':
                        response.end(JSON.stringify({
                            value: result,
                            success: true
                        }));
                        return;
                    case 'GET':
                        response.end(JSON.stringify(result));
                        return;
                }
            }

        }
        catch (ex) {
            console.log(`***** RPC Call Error ${(new Date).toLocaleTimeString()} *****\n`, ex);
            if (ex instanceof rpc.RPCError) {
                response.writeHead(200, {
                    "Content-Type": "application/json"
                });
                response.end(JSON.stringify({
                    error: ex,
                    success: false
                })); //send RPCError to the client
                return;
            }
            else {
                if (this.dyanmic) { //throw the error back to the client in debugging mode
                    response.writeHead(200, {
                        "Content-Type": "application/json"
                    });
                    response.end(JSON.stringify({
                        error: ex,
                        success: false
                    }));
                    return;
                }
                else {
                    Response500(response, link.path); //only show internal server error in production mode
                    return;
                }
            }
        }
    }
}

 
/**
* This middleware blocks the user from accessing system files on the server;
* *.sys.js files are server core scripts. they must be kept away from the user;
*/
export class SYSMiddleware implements IPromisedMiddleware {
    async  handler(request: http.ServerRequest, response: http.ServerResponse):Promise<boolean> {
        let link = url.parse(decodeURI(request.url));
        if (/\.sys\.js$/ig.test(link.pathname)) {
            Response404(response, link.path);
            return false;
        }
        return true;
    }
}

export interface IServerConfig {
    port?: number, //default 80
    cors?: boolean, //default false
    domains?: IDomainSetup[]; //use default path if not specified;
}

/**
 * this class is used to check process memory usage to detect memory leaks.
 */
export class MemorySpy {
    constructor(public peroid?: number) {
        if (typeof peroid != 'number') peroid = 5000; //default 5 seconds per check ;
    }
    /**
     * start the memory check by setInterval 
     */
    start() {
        setInterval(this.spyMemoryUsage, 5000);
    }
    /**
     * this is the function that checks memory usage and force gc;
     */
    spyMemoryUsage() {
        let usage = process.memoryUsage();
        let date = new Date(Date.now());
        let HH = date.getHours().toString();
        let mm = date.getMinutes().toString();
        let ss = date.getSeconds().toString();
        HH = '00'.substr(0, 2 - HH.length) + HH;
        mm = '00'.substr(0, 2 - mm.length) + mm;
        ss = '00'.substr(0, 2 - ss.length) + ss;
        //console.log(`>>>>>> Inspect Memory ${HH}:${mm}:${ss}`);
        //console.log(`Heap Total: ${(usage.heapTotal/1024/1024).toFixed(2)}M`);
        if (usage.heapTotal > 1 * 1024 * 1024 * 1024) process.send('restart');
    }
}

/**
 * simply create a new instance to enable this feature;
 * the process will call the wrapper to restart itself at uncaught exception;
 * this ensures the server to run forever;
 */
export class RestartOnUncaughtException {
    constructor() {
        process.on('uncaughtException', (value) => {
            //tell parent to kill me and restart
            console.log('Server UncaughtException: ', value);
            process.send('restart');
        })
    }
}