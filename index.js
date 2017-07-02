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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
//a simple node server
var http = require("http");
var https = require("https");
var url = require("url");
var fs = require("fs");
var vm = require("vm");
var net = require("net");
var nodepath = require("path");
var child_process = require("child_process");
var process = require("process");
var uuid = require("uuid");
var mime_sys_1 = require("./mime.sys");
var efs = require("errisy-fs");
var rpc_1 = require("./rpc");
var session = require("node-session");
var formidable = require("formidable");
var __StartUpDir = nodepath.parse(process.argv[1]).dir;
var Util = (function () {
    function Util() {
    }
    Util.GenerateRandomKey = function (length, chars) {
        if (length == undefined || length == null)
            length = 32;
        if (!chars)
            chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var chrlen = chars.length;
        var result = '';
        for (var i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(chrlen * Math.random()));
        }
        return result;
    };
    return Util;
}());
exports.Util = Util;
var HttpServer = (function () {
    function HttpServer(port) {
        var _this = this;
        this.port = port;
        this.Middlewares = [];
        this.handler = function (request, response) { return __awaiter(_this, void 0, void 0, function () {
            var i, middleware, ex_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.Middlewares.length)) return [3 /*break*/, 6];
                        middleware = this.Middlewares[i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, middleware.handler(request, response)];
                    case 3:
                        if (!(_a.sent()))
                            return [2 /*return*/];
                        return [3 /*break*/, 5];
                    case 4:
                        ex_1 = _a.sent();
                        console.log(ex_1);
                        Response500(response, (request.headers['host'] ? request.headers['host'] : '') + request.url);
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6:
                        Response404(response, request.url);
                        return [2 /*return*/, undefined];
                }
            });
        }); };
        this.checkPort = function (callback) {
            var tester = net.createServer();
            var that = _this;
            tester.once('error', function (err) {
                if (err.code == 'EADDRINUSE') {
                    //try later 
                    console.log('Port ' + _this.port + ' is not Free. Server will try again in 0.5 sec ...');
                    setTimeout(function () { return that.checkPort(callback); }, 500);
                }
            });
            tester.once('listening', function () {
                console.log('Port ' + _this.port + ' is Free. Starting HTTP Server...');
                tester.close();
                callback();
            });
            tester.listen(_this.port);
        };
        this.startServer = function () {
            _this.server = http.createServer(_this.handler);
            _this.server.listen(_this.port);
        };
        if (typeof this.port != 'number')
            this.port = 80;
    }
    HttpServer.prototype.start = function () {
        this.checkPort(this.startServer);
    };
    HttpServer.prototype.stop = function () {
        this.server.close();
    };
    return HttpServer;
}());
exports.HttpServer = HttpServer;
var HttpsServer = (function (_super) {
    __extends(HttpsServer, _super);
    function HttpsServer(port, options) {
        var _this = _super.call(this, port) || this;
        _this.port = port;
        _this.options = options;
        _this.startServer = function () {
            if (_this.options) {
                _this.server = https.createServer(_this.options, _this.handler);
            }
            else if (_this.PrivateKeyFile && _this.CertificateFile) {
                var privateKey = fs.readFileSync(_this.PrivateKeyFile).toString();
                var certificate = fs.readFileSync(_this.CertificateFile).toString();
                _this.server = https.createServer({ cert: certificate, key: privateKey }, _this.handler);
            }
            _this.server.listen(_this.port);
        };
        return _this;
    }
    return HttpsServer;
}(HttpServer));
exports.HttpsServer = HttpsServer;
var WrappedMiddleware = (function () {
    function WrappedMiddleware(CallbackMiddleware) {
        this.CallbackMiddleware = CallbackMiddleware;
    }
    WrappedMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var resolved = false;
                        var next = function () {
                            resolved = true;
                            resolve(true);
                        };
                        var terminate = function () { if (!resolved)
                            resolve(false); };
                        _this.CallbackMiddleware(request, response, next);
                    })];
            });
        });
    };
    return WrappedMiddleware;
}());
exports.WrappedMiddleware = WrappedMiddleware;
/**
 * domain middleware will handle the request with its own middlewares, it will terminate the middleware chain.
 */
var DomainMiddleware = (function () {
    function DomainMiddleware(domains) {
        this.domains = domains;
        this.map = {};
        if (!Array.isArray(domains))
            this.domains = [];
        this.domains = this.domains.map(function (dom) {
            // accepts multiple root and will work for the first existing one
            console.log("domain.root: " + dom.root);
            if (dom.root) {
                if (typeof dom.root == 'string') {
                    dom.root = DomainMiddleware.parseDomRootString(dom.root);
                    if (!dom.root)
                        dom.root = nodepath.parse(process.argv[1]).dir;
                }
                else if (Array.isArray(dom.root)) {
                    var found = void 0;
                    for (var _i = 0, _a = dom.root; _i < _a.length; _i++) {
                        var dir = _a[_i];
                        found = DomainMiddleware.parseDomRootString(dir);
                        if (found)
                            break;
                    }
                    if (found) {
                        dom.root = found;
                    }
                    else {
                        dom.root = nodepath.parse(process.argv[1]).dir;
                    }
                }
            }
            else {
                console.log("Errisy Server Warning: Root of \"" + dom.domain + "\" is undefined!");
                dom.root = nodepath.parse(process.argv[1]).dir;
            }
            console.log("Errisy Server: { Domain: \"" + dom.domain + "\", Root: \"" + dom.root + "\" }");
            console.log(dom.middlewares);
            if (dom.domain)
                dom.regex = dom.regex ? dom.regex : new RegExp('', 'ig');
            return dom;
        });
    }
    DomainMiddleware.parseDomRootString = function (value) {
        if (value && (value == '' || value == '/' || /^\./.test(value))) {
            var rootparsed = nodepath.parse(nodepath.parse(process.argv[1]).dir + value);
            var dir = rootparsed.dir + "/" + rootparsed.name;
            console.log("combined dir is " + dir);
            if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
                return dir;
            }
            else {
                return undefined;
            }
        }
        else if (value) {
            if (fs.existsSync(value) && fs.statSync(value).isDirectory()) {
                return value;
            }
            else {
                return undefined;
            }
        }
        else {
            return undefined;
        }
    };
    DomainMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var host, i, domain, j, middleware, ex_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        host = request.headers['host'];
                        if (!host) return [3 /*break*/, 9];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < this.domains.length)) return [3 /*break*/, 9];
                        domain = this.domains[i];
                        domain.regex.lastIndex = undefined;
                        if (!domain.regex.test(host)) return [3 /*break*/, 8];
                        request['$DomainRootDir'] = domain.root;
                        j = 0;
                        _a.label = 2;
                    case 2:
                        if (!(j < domain.middlewares.length)) return [3 /*break*/, 7];
                        middleware = domain.middlewares[j];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, middleware.handler(request, response)];
                    case 4:
                        if (!(_a.sent()))
                            return [2 /*return*/, false];
                        return [3 /*break*/, 6];
                    case 5:
                        ex_2 = _a.sent();
                        console.log(ex_2);
                        Response500(response, (request.headers['host'] ? request.headers['host'] : '') + request.url);
                        return [3 /*break*/, 6];
                    case 6:
                        j++;
                        return [3 /*break*/, 2];
                    case 7:
                        Response404(response, request.url);
                        return [2 /*return*/, false];
                    case 8:
                        i++;
                        return [3 /*break*/, 1];
                    case 9: return [2 /*return*/, true]; //must return true to allow other domain middlewares to work
                }
            });
        });
    };
    return DomainMiddleware;
}());
exports.DomainMiddleware = DomainMiddleware;
/**
 * redirect to a different domain or protocal.
 * e.g. when you want user to access only https, you can set up http server to perform redirection to https://
 */
var HostRedirctMiddleware = (function () {
    function HostRedirctMiddleware(entries) {
        this.entries = entries;
        if (!Array.isArray(this.entries))
            this.entries = [];
        this.entries = this.entries.map(function (opt) {
            if (opt.domain)
                opt.regex = new RegExp(opt.domain, opt.options ? opt.options : 'ig');
            return opt;
        });
    }
    HostRedirctMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var host, i, entry;
            return __generator(this, function (_a) {
                host = request.headers['host'];
                if (host) {
                    for (i = 0; i < this.entries.length; i++) {
                        entry = this.entries[i];
                        entry.regex.lastIndex = undefined;
                        if (entry.regex.test(host)) {
                            //redirect to the specific protocal and host;
                            response.writeHead(302, {
                                Location: (entry.protocal ? entry.protocal : 'http') + "://" + entry.host + request.url
                            });
                            response.end();
                            return [2 /*return*/, false];
                        }
                    }
                }
                return [2 /*return*/, true];
            });
        });
    };
    return HostRedirctMiddleware;
}());
exports.HostRedirctMiddleware = HostRedirctMiddleware;
/**
 * enable node session on the request and response;
 * please make sure different cluster instances are using the same secret for session, otherwise, there may be conflicts.
 */
var SessionMiddleware = (function () {
    function SessionMiddleware(secret) {
        this.secret = secret;
        if (!this.secret)
            this.secret = Util.GenerateRandomKey();
        this.session = new session({ secret: this.secret });
    }
    SessionMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        try {
                            _this.session.startSession(request, response, function () {
                                resolve(true);
                            });
                        }
                        catch (ex) {
                            reject(ex);
                        }
                    })];
            });
        });
    };
    return SessionMiddleware;
}());
exports.SessionMiddleware = SessionMiddleware;
/**
 * enable cors and set Access-Control-Allow-* for preflighted OPTIONS requests
 */
var CORSMiddleware = (function () {
    function CORSMiddleware() {
    }
    CORSMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Methods', 'GET,POST');
                response.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Cookie, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
                if (request.method.toUpperCase() == 'OPTIONS') {
                    response.writeHead(200);
                    response.end();
                    return [2 /*return*/, false];
                }
                return [2 /*return*/, true];
            });
        });
    };
    return CORSMiddleware;
}());
exports.CORSMiddleware = CORSMiddleware;
function Response404(response, path) {
    response.writeHead(404, {
        "Content-Type": "text/plain"
    });
    response.end('File ' + path + ' can not be found on the server.');
}
exports.Response404 = Response404;
function Response500(response, path) {
    response.writeHead(500, {
        "Content-Type": "text/plain"
    });
    response.end('File ' + path + ' encountered internal server errors.');
}
exports.Response500 = Response500;
/**
 * define routing rules for web app to block/enable paths;
 */
var RouteMiddleware = (function () {
    function RouteMiddleware(rules) {
        this.rules = rules;
        this.rules = rules.map(function (rule) {
            if (rule.route)
                rule.regex = new RegExp(rule.route, rule.options ? rule.options : 'ig');
            return rule;
        }).filter(function (rule) { return rule.regex; });
    }
    RouteMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var link, i, rule;
            return __generator(this, function (_a) {
                link = url.parse(decodeURI(request.url));
                for (i = 0; i < this.rules.length; i++) {
                    rule = this.rules[i];
                    rule.regex.lastIndex = undefined;
                    if (rule.regex.test(link.pathname))
                        return [2 /*return*/, rule.access];
                }
                return [2 /*return*/, true];
            });
        });
    };
    return RouteMiddleware;
}());
exports.RouteMiddleware = RouteMiddleware;
var FileUtilities = (function () {
    function FileUtilities() {
    }
    FileUtilities.PipeFile = function (request, response, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var stats, ex_3, mimes, maxSize, readStream, range, start, end, total, chunksize, positions, statusCode, readStream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, efs.exists(filename)];
                    case 1:
                        if (!(_a.sent()))
                            return [2 /*return*/, true];
                        return [4 /*yield*/, efs.stat(filename)];
                    case 2:
                        stats = _a.sent();
                        if (!stats.isFile())
                            return [2 /*return*/, true];
                        return [3 /*break*/, 4];
                    case 3:
                        ex_3 = _a.sent();
                        return [2 /*return*/, true];
                    case 4:
                        mimes = mime_sys_1.mime.lookup(filename);
                        maxSize = (mimes[0] && mimes[0].isDefaultStream) ? 204800 : stats.size;
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
                            readStream = fs.createReadStream(filename);
                            readStream.pipe(response);
                        }
                        else {
                            range = request.headers['range'];
                            start = void 0, end = void 0;
                            total = stats.size;
                            chunksize = void 0;
                            if (range) {
                                positions = range.replace(/bytes=/, "").split("-");
                                start = parseInt(positions[0], 10);
                                end = positions[1] ? parseInt(positions[1], 10) : start + 204799;
                            }
                            else {
                                start = 0;
                                end = start + maxSize - 1;
                            }
                            if (start > total - 1)
                                start = total - 1;
                            if (end > total - 1)
                                end = total - 1;
                            chunksize = (end - start) + 1;
                            statusCode = (chunksize == stats.size) ? 200 : 206;
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
                            readStream = fs.createReadStream(filename, { start: start, end: end });
                            readStream.pipe(response);
                            //console.log(request.url, maxSize, statusCode);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return FileUtilities;
}());
exports.FileUtilities = FileUtilities;
var FileWhiteListMiddleware = (function () {
    /** This provides a default index for the file middleware.*/
    function FileWhiteListMiddleware(whitelist, defaultFile) {
        this.whitelist = whitelist;
        this.defaultFile = defaultFile;
        if (!this.defaultFile)
            this.defaultFile = 'index.html';
    }
    FileWhiteListMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var link, domainRootDir, filename, relativePath, stats, ex_4, mimes, maxSize, readStream, range, start, end, total, chunksize, positions, statusCode, readStream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        link = url.parse(decodeURI(request.url));
                        domainRootDir = request['$DomainRootDir'] ? request['$DomainRootDir'] : __StartUpDir;
                        filename = domainRootDir + decodeURI(link.pathname);
                        relativePath = link.pathname;
                        if (/\/$/.test(filename)) {
                            filename += this.defaultFile;
                            relativePath += this.defaultFile;
                        }
                        if (!Array.isArray(this.whitelist) || !this.whitelist.some(function (rgx) {
                            rgx.lastIndex = undefined;
                            return rgx.test(relativePath);
                        })) {
                            Response404(response, link.pathname);
                            return [2 /*return*/, false];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, efs.exists(filename)];
                    case 2:
                        if (!(_a.sent()))
                            return [2 /*return*/, true];
                        return [4 /*yield*/, efs.stat(filename)];
                    case 3:
                        stats = _a.sent();
                        if (!stats.isFile())
                            return [2 /*return*/, true];
                        return [3 /*break*/, 5];
                    case 4:
                        ex_4 = _a.sent();
                        return [2 /*return*/, true];
                    case 5:
                        mimes = mime_sys_1.mime.lookup(filename);
                        maxSize = (mimes[0] && mimes[0].isDefaultStream) ? 204800 : stats.size;
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
                            readStream = fs.createReadStream(filename);
                            readStream.pipe(response);
                        }
                        else {
                            range = request.headers['range'];
                            start = void 0, end = void 0;
                            total = stats.size;
                            chunksize = void 0;
                            if (range) {
                                positions = range.replace(/bytes=/, "").split("-");
                                start = parseInt(positions[0], 10);
                                end = positions[1] ? parseInt(positions[1], 10) : start + 204799;
                            }
                            else {
                                start = 0;
                                end = start + maxSize - 1;
                            }
                            if (start > total - 1)
                                start = total - 1;
                            if (end > total - 1)
                                end = total - 1;
                            chunksize = (end - start) + 1;
                            statusCode = (chunksize == stats.size) ? 200 : 206;
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
                            readStream = fs.createReadStream(filename, { start: start, end: end });
                            readStream.pipe(response);
                            //console.log(request.url, maxSize, statusCode);
                        }
                        //the file is processed here, stop passing to the next middleware
                        return [2 /*return*/, false];
                }
            });
        });
    };
    return FileWhiteListMiddleware;
}());
exports.FileWhiteListMiddleware = FileWhiteListMiddleware;
var FrontEndRouterMiddleware = (function () {
    function FrontEndRouterMiddleware(routes) {
        this.routes = routes;
    }
    FrontEndRouterMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var link, found, domainRootDir, filename;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        link = url.parse(decodeURI(request.url));
                        found = this.routes.find(function (route) { return Array.isArray(route.patterns) && route.patterns.length > 0 && route.patterns.some(function (ptn) { return ((ptn.lastIndex = undefined), ptn.test(link.pathname)); }); });
                        if (!found) return [3 /*break*/, 2];
                        domainRootDir = request['$DomainRootDir'] ? request['$DomainRootDir'] : __StartUpDir;
                        filename = nodepath.join(domainRootDir, decodeURI(found.file));
                        return [4 /*yield*/, FileUtilities.PipeFile(request, response, filename)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [2 /*return*/, true];
                }
            });
        });
    };
    return FrontEndRouterMiddleware;
}());
exports.FrontEndRouterMiddleware = FrontEndRouterMiddleware;
var FileMiddleware = (function () {
    /** This provides a default index for the file middleware.*/
    function FileMiddleware(defaultFile) {
        this.defaultFile = defaultFile;
        if (!this.defaultFile)
            this.defaultFile = 'index.html';
    }
    FileMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var link, domainRootDir, filename, stats, ex_5, mimes, maxSize, readStream, range, start, end, total, chunksize, positions, statusCode, readStream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        link = url.parse(decodeURI(request.url));
                        domainRootDir = request['$DomainRootDir'] ? request['$DomainRootDir'] : __StartUpDir;
                        filename = domainRootDir + decodeURI(link.pathname);
                        if (/\/$/.test(filename))
                            filename += this.defaultFile;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, efs.exists(filename)];
                    case 2:
                        if (!(_a.sent()))
                            return [2 /*return*/, true];
                        return [4 /*yield*/, efs.stat(filename)];
                    case 3:
                        stats = _a.sent();
                        if (!stats.isFile())
                            return [2 /*return*/, true];
                        return [3 /*break*/, 5];
                    case 4:
                        ex_5 = _a.sent();
                        return [2 /*return*/, true];
                    case 5:
                        mimes = mime_sys_1.mime.lookup(filename);
                        maxSize = (mimes[0] && mimes[0].isDefaultStream) ? 204800 : stats.size;
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
                            readStream = fs.createReadStream(filename);
                            readStream.pipe(response);
                        }
                        else {
                            range = request.headers['range'];
                            start = void 0, end = void 0;
                            total = stats.size;
                            chunksize = void 0;
                            if (range) {
                                positions = range.replace(/bytes=/, "").split("-");
                                start = parseInt(positions[0], 10);
                                end = positions[1] ? parseInt(positions[1], 10) : start + 204799;
                            }
                            else {
                                start = 0;
                                end = start + maxSize - 1;
                            }
                            if (start > total - 1)
                                start = total - 1;
                            if (end > total - 1)
                                end = total - 1;
                            chunksize = (end - start) + 1;
                            statusCode = (chunksize == stats.size) ? 200 : 206;
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
                            readStream = fs.createReadStream(filename, { start: start, end: end });
                            readStream.pipe(response);
                            //console.log(request.url, maxSize, statusCode);
                        }
                        //the file is processed here, stop passing to the next middleware
                        return [2 /*return*/, false];
                }
            });
        });
    };
    return FileMiddleware;
}());
exports.FileMiddleware = FileMiddleware;
var DirectoryMiddleware = (function () {
    function DirectoryMiddleware() {
    }
    DirectoryMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var link, domainRootDir, filename, stats, ex_6, files, pathname_1, result, ex_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        link = url.parse(request.url);
                        domainRootDir = request['$DomainRootDir'] ? request['$DomainRootDir'] : __StartUpDir;
                        filename = domainRootDir + decodeURI(link.pathname);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, efs.exists(filename)];
                    case 2:
                        if (!(_a.sent()))
                            return [2 /*return*/, true];
                        return [4 /*yield*/, efs.stat(filename)];
                    case 3:
                        stats = _a.sent();
                        if (!stats.isDirectory())
                            return [2 /*return*/, true];
                        return [3 /*break*/, 5];
                    case 4:
                        ex_6 = _a.sent();
                        return [2 /*return*/, true];
                    case 5:
                        response.writeHead(200, {
                            "Content-Type": "text/html"
                        });
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, efs.readdir(filename)];
                    case 7:
                        files = _a.sent();
                        pathname_1 = pathreducer.toPathname(decodeURI(link.pathname));
                        result = '<html>\n\
<head>\n\
<title>Index of /</title>\n\
<meta charset="UTF-8">\
</head>\n\
<body>\n\
<h1>Index of ' + pathname_1 + '</h1>\n\
<ul>\n' +
                            files.map(function (file) { return '\t<li><a href="' + (pathname_1 + file).replace(/\\/ig, '\\\\') + '">' + file + '</a></li>\n'; }).join('') +
                            '</ul>\n\
<div>Simple Node Service</div>\
</body></html>';
                        response.end(result);
                        return [3 /*break*/, 9];
                    case 8:
                        ex_7 = _a.sent();
                        return [2 /*return*/, true];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return DirectoryMiddleware;
}());
exports.DirectoryMiddleware = DirectoryMiddleware;
var pathreducer = (function () {
    function pathreducer() {
    }
    pathreducer.reduce = function (path) {
        return path.replace(/[^\\^\/^\:]+[\\\/]+\.\.[\\\/]+/ig, '').replace(/([^\:])[\\\/]{2,}/ig, function (capture) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return args[0] + '\/';
        }).replace(/\.[\\\/]+/ig, '');
    };
    pathreducer.filename = function (path) {
        var index = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('\/'));
        if (index > -1)
            return path.substr(index + 1);
        return path;
    };
    pathreducer.pathname = function (path) {
        var index = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('\/'));
        //console.log('[pathreducer]->pathaname: ', path, index, path.length);
        if (index == path.length - 1)
            return path.substr(0, index + 1);
        return path;
    };
    pathreducer.file2pathname = function (path) {
        var index = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('\/'));
        //console.log('[pathreducer]->pathaname: ', path, index, path.length);
        if (index > -1)
            return path.substr(0, index + 1);
        return path;
    };
    pathreducer.toPathname = function (path) {
        var index = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('\/'));
        if (index < path.length - 1)
            return path + '/';
        return path;
    };
    return pathreducer;
}());
exports.pathreducer = pathreducer;
/**
 * This is a task stack that accepts task request from request for high performance tasks running in child process.
 * You shall use task when *.cgi.js or *.rpc.js can not handle the request in synchronized manner (e.g. taking to long time to complete);
 */
var TaskHost = (function () {
    function TaskHost() {
        var _this = this;
        this.creationCount = 0;
        this.tasksToRun = [];
        this.tasksRunning = [];
        this.tasksCompleted = [];
        /** Create a task and return the task id.*/
        this.createTask = function (job, args, obj) {
            //console.log('create task.');
            _this.creationCount += 1;
            var info = {
                id: _this.creationCount.toString(),
                filename: job,
                args: args,
                status: 'Scheduled',
                obj: obj
            };
            _this.tasksToRun.push(info);
            return info.id;
        };
        /** Cancel the task is scheduled or started*/
        this.cancelTask = function (id) {
            var available = [];
            _this.tasksToRun.forEach(function (task) { return available.push(task); });
            _this.tasksRunning.forEach(function (task) { return available.push(task); });
            available.filter(function (task) { return task.id == id; }).forEach(function (task) {
                try {
                    task.process.pid && task.process.kill && task.process.kill();
                }
                catch (ex) {
                }
            });
        };
        this.start = function () {
            var _loop_1 = function () {
                var task = _this.tasksToRun.shift();
                task.starttime = Number(new Date());
                task.status = 'Running';
                _this.tasksRunning.push(task);
                var that = _this;
                //console.log('starting task');
                task.process = child_process.fork(task.filename + '.sys.js', task.args);
                task.process.on('message', function (data) {
                    //console.log('Task ' + task.id + ' - progress :', data);
                    task.progress = data;
                });
                //task.process.emit('message', task.obj);
                task.process.send(task.obj);
                task.process.on('error', function () {
                    var errorTask = that.tasksRunning.splice(that.tasksRunning.indexOf(task), 1)[0];
                    errorTask.status = 'Error';
                    that.tasksCompleted.push(errorTask);
                });
                task.process.on('exit', function () {
                    //console.log('Task ' + task.id + ' has completed.');
                    var completedTask = that.tasksRunning.splice(that.tasksRunning.indexOf(task), 1)[0];
                    completedTask.status = 'Completed';
                    completedTask.endtime = Number(Date.now());
                    that.tasksCompleted.push(completedTask);
                });
            };
            //console.log('task start.');
            while (_this.tasksToRun.length > 0) {
                _loop_1();
            }
        };
        this.onStatusUpdate = function () {
        };
        this.checkStatus = function (id) {
            var target;
            if (_this.tasksToRun.some(function (task) {
                if (task.id == id) {
                    target = task;
                    return true;
                }
            }) ||
                _this.tasksRunning.some(function (task) {
                    if (task.id == id) {
                        target = task;
                        return true;
                    }
                }) ||
                _this.tasksCompleted.some(function (task) {
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
        };
    }
    return TaskHost;
}());
exports.TaskHost = TaskHost;
var ServerTaskHost = new TaskHost();
var ptnRPCMethod = /^\?([\w\.]+)([&@\-]?)(\w+)/; //[@: get &: set null:method]
var ptnRPCGETMethod = /^\?([\w\.]+)([&@\-]?)(\w+)&?/; //[@: get &: set null:method]
// References is the dictionary that hold all loaded library;
var References = {};
/**
    * works out whether it is a multiple part form data;
    * @param headers
    */
function isContentTypeMultiplePartForm(headers) {
    for (var key in headers) {
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
var RPCMiddleware = (function () {
    function RPCMiddleware(dyanmic, useDeserialzer) {
        this.dyanmic = dyanmic;
        this.useDeserialzer = useDeserialzer;
        this.modules = {};
    }
    RPCMiddleware.ReceiveJsonAsync = function (request, domainRootDir) {
        return new Promise(function (resolve, reject) {
            switch (request.method.toUpperCase()) {
                case 'POST':
                    var body_1 = "";
                    request.on('data', function (chunk) {
                        body_1 += chunk;
                    });
                    request.on('end', function () {
                        try {
                            var obj = JSON.parse(body_1);
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
    };
    RPCMiddleware.ReceiveFormAsync = function (request, domainRootDir) {
        return new Promise(function (resolve, reject) {
            var form = new formidable.IncomingForm();
            var fields = {};
            var files = {};
            var names = [];
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
            form.on('end', function () {
                var args = [];
                for (var i = 0; i < names.length; i++) {
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
            form.on('error', function (err) {
                reject(err);
            });
            form.parse(request);
        });
    };
    RPCMiddleware.Deserialize = function (jsonObject, domainRootDir) {
        if (typeof jsonObject != 'object')
            return jsonObject;
        if (jsonObject == null)
            return null;
        if (jsonObject == undefined)
            return undefined;
        if (Array.isArray(jsonObject)) {
            //console.log('Deserialize Array: ', JSON.stringify(jsonObject));
            for (var i = 0; i < jsonObject.length; i++) {
                jsonObject[i] = RPCMiddleware.Deserialize(jsonObject[i], domainRootDir);
            }
        }
        if (jsonObject['@Serializable.ModuleName'] && jsonObject['@Serializable.TypeName']) {
            //console.log('Deserialize Object: ', JSON.stringify(jsonObject));
            var moduleName = jsonObject['@Serializable.ModuleName'];
            var typeName = jsonObject['@Serializable.TypeName'];
            //load module to References
            if (moduleName.charAt(0) == '/') {
                //this is a relative file;
                // if the module was not loaded, load it from the module file;
                //console.log('__relativeRoot: ', __relativeRoot);
                if (!References[moduleName]) {
                    var $file = pathreducer.reduce(domainRootDir + moduleName + '.js');
                    //console.log('Deserialize->Load Type Def from: ', $file);
                    References[moduleName] = RPCMiddleware.DynamicRequire(domainRootDir, pathreducer.filename($file), pathreducer.file2pathname($file));
                }
            }
            else {
                //this is a type from module
                References[moduleName] = require(moduleName);
            }
            //how to obtain the module and type from it?
            var obj = new References[moduleName][typeName]();
            //console.log('obj built: ', moduleName, typeName, obj);
            for (var key in jsonObject) {
                if (key != '$$hashKey')
                    obj[key] = RPCMiddleware.Deserialize(jsonObject[key], domainRootDir);
            }
            return obj;
        }
        return jsonObject;
    };
    /**
    * Dynamically load and run a script in a try-catch block. This is great for debugging.
    * @param fileName The script file name with relative path. e.g. "../app/testModule". '.js' will be added to the end of the file name.
    * @param directoryName The directory where the script file is located. By default it is the root directory.
    */
    RPCMiddleware.DynamicRequire = function (domainRootDir, fileName, directoryName) {
        var _this = this;
        try {
            if (!directoryName)
                directoryName = domainRootDir;
            //console.log('DynamicRequire: ', fileName, ' Base Path: ' + directoryName);
            var required_1 = {};
            var requiredIndex_1 = 0;
            var fullFilename = pathreducer.reduce(directoryName + '//' + fileName);
            if (fs.existsSync(fullFilename)) {
                if (fs.statSync(fullFilename).isFile()) {
                    var code = "(function (){\n    \ttry{\n    \t\tlet exports = {};\n    \t\tlet module = {};\n    " + fs.readFileSync(fullFilename).toString().replace(/require\s*\(\s*[\'"`](\.+[\/a-z_\-\s0-9\.]+)[\'"`]\s*\)/ig, function (capture) {
                        var args = [];
                        for (var _i = 1; _i < arguments.length; _i++) {
                            args[_i - 1] = arguments[_i];
                        }
                        //let $file = pathreducer.reduce(directoryName + '//' + args[0] + '.js');
                        var $modulePath = args[0];
                        var $file;
                        //console.log('path capture:', capture, args[0]);
                        //console.log('module path: ', $modulePath, /^\.{1,2}/i.test($modulePath));
                        if (/^\.{1,2}/i.test($modulePath)) {
                            $file = pathreducer.reduce(directoryName + '//' + args[0] + '.js');
                        }
                        else {
                            $file = pathreducer.reduce(directoryName + '/node_modules/' + args[0] + '/index.js');
                        }
                        required_1[requiredIndex_1] = _this.DynamicRequire(domainRootDir, pathreducer.filename($file), pathreducer.file2pathname($file));
                        var replacement = '$__required[' + requiredIndex_1 + ']';
                        requiredIndex_1 += 1;
                        return replacement;
                    }) + "\n    \t\treturn exports;\n    \t}\n    \tcatch(ex){\n    \tconsole.log('Error:', ex, '@" + fullFilename.replace(/\\/ig, '\\\\') + "');\n    \treturn undefined;\n    \t}\n    })";
                    var context = vm.createContext({
                        console: console,
                        require: require,
                        Buffer: Buffer,
                        __dirname: directoryName,
                        __filename: __filename,
                        process: process,
                        $__required: required_1
                    });
                    var _script = new vm.Script(code); //vm.createScript(code);
                    var fn = _script.runInContext(context);
                    var exported = fn();
                    if (!exported)
                        console.log('Exported is undefined: ', fullFilename);
                    if (exported['__relativeRoot'])
                        exported['__relativeRoot'] = domainRootDir;
                    fn = undefined;
                    required_1 = undefined;
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
    };
    RPCMiddleware.prototype.getServiceClass = function (filename, className, link, domainRootDir) {
        return __awaiter(this, void 0, void 0, function () {
            var $module_1, data, precode, scriptFile, $directory, required, requiredIndex, argumentlist, code, context, _script, fn, $module;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.dyanmic && this.modules[filename]) {
                            $module_1 = this.modules[filename];
                            return [2 /*return*/, $module_1[className]];
                        }
                        return [4 /*yield*/, efs.readFile(filename)];
                    case 1:
                        data = _a.sent();
                        precode = data.toString();
                        scriptFile = pathreducer.reduce(domainRootDir + '\/' + link.pathname);
                        $directory = pathreducer.file2pathname(scriptFile);
                        required = {};
                        requiredIndex = 0;
                        argumentlist = {};
                        code = "(function (){\n\ttry{\n\t\tlet exports = {};\n\t\tlet module = {};\n" + precode.replace(/require\s*\(\s*[\'"](\.+[\/a-z_\-\s0-9\.]+)[\'"]\s*\)/ig, function (capture) {
                            var args = [];
                            for (var _i = 1; _i < arguments.length; _i++) {
                                args[_i - 1] = arguments[_i];
                            }
                            var $file = pathreducer.reduce($directory + '//' + args[0] + '.js');
                            required[requiredIndex] = RPCMiddleware.DynamicRequire(domainRootDir, pathreducer.filename($file), pathreducer.file2pathname($file));
                            var replacement = '$__required[' + requiredIndex + ']';
                            requiredIndex += 1;
                            return replacement;
                        }) + "\n\t\treturn exports;\n\t}\n\tcatch(ex){\n\tconsole.log('Error:', ex, '@" + scriptFile.replace(/\\/ig, '\\\\') + "');\n\treturn undefined;\n\t}\n})";
                        context = vm.createContext({
                            console: console,
                            require: require,
                            Buffer: Buffer,
                            __dirname: $directory,
                            __filename: scriptFile,
                            process: process,
                            $__required: required,
                            module: undefined
                        });
                        _script = new vm.Script(code);
                        code = undefined;
                        fn = _script.runInContext(context);
                        $module = fn();
                        if (!this.dyanmic) {
                            this.modules[filename] = $module;
                        }
                        return [2 /*return*/, $module[className]]; //this is the class type
                }
            });
        });
    };
    RPCMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var link, domainRootDir, filename, that, stats, ex_8, rpcArgs, method, _a, matches_1, matches, className, memberType, memberName, $class, $instance, result, ex_9;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        link = url.parse(decodeURI(request.url));
                        //console.log(`RPC url: ${link.pathname}`);
                        if (!/\.rpc\.js$/ig.test(link.pathname))
                            return [2 /*return*/, true];
                        domainRootDir = request['$DomainRootDir'] ? request['$DomainRootDir'] : __StartUpDir;
                        filename = domainRootDir + link.pathname;
                        that = this;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        if (!efs.exists)
                            Response404(response, link.path);
                        return [4 /*yield*/, efs.stat(filename)];
                    case 2:
                        stats = _b.sent();
                        if (!stats.isFile())
                            return [2 /*return*/, true];
                        return [3 /*break*/, 4];
                    case 3:
                        ex_8 = _b.sent();
                        Response404(response, link.path);
                        return [2 /*return*/, true];
                    case 4:
                        method = request.method.toUpperCase();
                        _a = method;
                        switch (_a) {
                            case 'POST': return [3 /*break*/, 5];
                            case 'GET': return [3 /*break*/, 10];
                        }
                        return [3 /*break*/, 11];
                    case 5:
                        if (!isContentTypeMultiplePartForm(request.headers)) return [3 /*break*/, 7];
                        return [4 /*yield*/, RPCMiddleware.ReceiveFormAsync(request, domainRootDir)];
                    case 6:
                        rpcArgs = _b.sent();
                        return [3 /*break*/, 9];
                    case 7: return [4 /*yield*/, RPCMiddleware.ReceiveJsonAsync(request, domainRootDir)];
                    case 8:
                        rpcArgs = _b.sent();
                        _b.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        {
                            ptnRPCGETMethod.lastIndex = undefined;
                            matches_1 = ptnRPCGETMethod.exec(link.search);
                            rpcArgs = link.search.substr(matches_1[0].length).split('&');
                        }
                        return [3 /*break*/, 11];
                    case 11:
                        ptnRPCMethod.lastIndex = undefined;
                        matches = ptnRPCMethod.exec(link.search);
                        className = matches[1];
                        memberType = matches[2];
                        memberName = matches[3];
                        _b.label = 12;
                    case 12:
                        _b.trys.push([12, 15, , 16]);
                        return [4 /*yield*/, this.getServiceClass(filename, className, link, domainRootDir)];
                    case 13:
                        $class = _b.sent();
                        $instance = new $class(request, response, request['session'], domainRootDir);
                        return [4 /*yield*/, ($instance[memberName].apply($instance, rpcArgs))];
                    case 14:
                        result = _b.sent();
                        if (result instanceof rpc_1.RawResponse) {
                            return [2 /*return*/]; //nothing to do there
                        }
                        else {
                            switch (method) {
                                case 'POST':
                                    response.end(JSON.stringify({
                                        value: result,
                                        success: true
                                    }));
                                    return [2 /*return*/];
                                case 'GET':
                                    response.end(JSON.stringify(result));
                                    return [2 /*return*/];
                            }
                        }
                        return [3 /*break*/, 16];
                    case 15:
                        ex_9 = _b.sent();
                        console.log("***** RPC Call Error " + (new Date).toLocaleTimeString() + " *****\n", ex_9);
                        if (ex_9 instanceof rpc_1.RPCError) {
                            response.writeHead(200, {
                                "Content-Type": "application/json"
                            });
                            response.end(JSON.stringify({
                                error: ex_9,
                                success: false
                            })); //send RPCError to the client
                            return [2 /*return*/];
                        }
                        else {
                            if (this.dyanmic) {
                                response.writeHead(200, {
                                    "Content-Type": "application/json"
                                });
                                response.end(JSON.stringify({
                                    error: ex_9,
                                    success: false
                                }));
                                return [2 /*return*/];
                            }
                            else {
                                Response500(response, link.path); //only show internal server error in production mode
                                return [2 /*return*/];
                            }
                        }
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    return RPCMiddleware;
}());
exports.RPCMiddleware = RPCMiddleware;
/**
* This middleware blocks the user from accessing system files on the server;
* *.sys.js files are server core scripts. they must be kept away from the user;
*/
var SYSMiddleware = (function () {
    function SYSMiddleware() {
    }
    SYSMiddleware.prototype.handler = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            var link;
            return __generator(this, function (_a) {
                link = url.parse(decodeURI(request.url));
                //console.log(`SysMiddleware: ${link.pathname}`);
                if (/\.sys\.js$/ig.test(link.pathname)) {
                    Response404(response, link.path);
                    return [2 /*return*/, false];
                }
                return [2 /*return*/, true];
            });
        });
    };
    return SYSMiddleware;
}());
exports.SYSMiddleware = SYSMiddleware;
/**
 * this class is used to check process memory usage to detect memory leaks.
 */
var MemorySpy = (function () {
    function MemorySpy(peroid) {
        this.peroid = peroid;
        if (typeof peroid != 'number')
            peroid = 5000; //default 5 seconds per check ;
    }
    /**
     * start the memory check by setInterval
     */
    MemorySpy.prototype.start = function () {
        setInterval(this.spyMemoryUsage, 5000);
    };
    /**
     * this is the function that checks memory usage and force gc;
     */
    MemorySpy.prototype.spyMemoryUsage = function () {
        var usage = process.memoryUsage();
        var date = new Date(Date.now());
        var HH = date.getHours().toString();
        var mm = date.getMinutes().toString();
        var ss = date.getSeconds().toString();
        HH = '00'.substr(0, 2 - HH.length) + HH;
        mm = '00'.substr(0, 2 - mm.length) + mm;
        ss = '00'.substr(0, 2 - ss.length) + ss;
        //console.log(`>>>>>> Inspect Memory ${HH}:${mm}:${ss}`);
        //console.log(`Heap Total: ${(usage.heapTotal/1024/1024).toFixed(2)}M`);
        if (usage.heapTotal > 1 * 1024 * 1024 * 1024)
            process.send('restart');
    };
    return MemorySpy;
}());
exports.MemorySpy = MemorySpy;
/**
 * simply create a new instance to enable this feature;
 * the process will call the wrapper to restart itself at uncaught exception;
 * this ensures the server to run forever;
 */
var RestartOnUncaughtException = (function () {
    function RestartOnUncaughtException() {
        process.on('uncaughtException', function (value) {
            //tell parent to kill me and restart
            console.log('Server UncaughtException: ', value);
            process.send('restart');
        });
    }
    return RestartOnUncaughtException;
}());
exports.RestartOnUncaughtException = RestartOnUncaughtException;
//# sourceMappingURL=index.js.map