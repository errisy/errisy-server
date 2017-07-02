# errisy-server
an out-of-box nodejs server with front end RPC support for Angular2/4 and mongoDB ORM support (see errisy-mongo)
1. it allows you to host multiple domains in the same server or cluster.
2. it wraps all service calls in remote procedure call system that can be easily consumed by Angular2/4.
3. it comes with the mongoDB ORM wrapper to handle mongoDB with minimal efforts.

## Quick Start

```cmd
npm install errisy-server
```

```typescript
import * as cluster from 'cluster';
import * as path from 'path';
import * as os from 'os'; 
import * as fs from 'fs';

import {HttpServer, HttpsServer, DomainMiddleware, HostRedirctMiddleware, FileWhiteListMiddleware, FileMiddleware, 
    SessionMiddleware, RPCMiddleware, SYSMiddleware } from 'errisy-server';

// by default you can use cookie session from
import { CookieSessionMiddleware } from 'errisy-server/cookie.session';

const numberOfProcesses = 1;// os.cpus().length; //get the number of cpus

let sessionKey = 'mPOgkkohV1XhhuyWMfY3MfP2efbulciw'; // 

if (cluster.isMaster) {
    let workers: cluster.Worker[] = [];
    for (let i = 0; i < numberOfProcesses; i++) {
        let worker = cluster.fork();
        workers.push(worker);
    }
}
else {
    const session = new CookieSessionMiddleware(config.session);
    const http = new HttpServer(80);
    http.Middlewares = [
        new DomainMiddleware([
            {
                domain: 'API Dev Server',
                regex: /^(localhost|127\.0\.0\.1|192\.168\.0\.13)$/ig,
                root: '/',
                middlewares:[
                    session,
                    new SYSMiddleware(),
                    new RPCMiddleware(true, false)
                ]
            }
        ])
    ]
    http.start();
}
```

## why not express?

```javascript
express.get('/', function(req, res){
  res.send('hello world!');
})
```
How does front end consume it? Typically, xhr (XMLHttpRequest).

Both server and client sides are not well structure and managable.

## My solution is remote procedure call.
See [errisy-tsc](https://github.com/errisy/errisy-tsc) for remote procedure call details.

### What's in the box?
1. http and https server that support a standard production setup of http/https servers.
2. RPCMiddleware for handling remote procedure calls with the *.rpc.ts files. They can be loaded dynamically with vm in dev mode, but can be loaded with require as module in production mode.
3. FrontEndRouterMiddleware to direct links that should be handled by front end router to the specified html file.
4. FileMiddleware for handling file request.
5. SessionMiddleware for setup sessions. (This will be updated with my own code as the module node-session can crash during dev mode hot reload. But it does not affect production.).

## Example Server Setup
[link to this example code](/example%20setup/start.sys.ts)

1. There are HttpsServer and HttpServer. You need to specify port in the constructor.
```TypeScript
let http = new HttpServer(80);
```
2. Similar to many other servers such as express, errisy-server structure can be set up be specifiying an array of middleware:
```TypeScript
https.Middlewares = [
        new DomainMiddleware([ // the highest level should be your domain middleware if you want the server to process multiple domains.
            {
                regex: /(localhost|192\.168\.0\.XX|127\.0\.0\.1|\www\.yourdomain\.com)$/ig, //change to your deploy ip address, this pattern should match your domain. when you are using the same server to hosting different domains, you should remove IP addresses, as they are not domain name. IP addresses are only for your local dev access.
                root: ['C:/www/root/', '/root/www'], // user __dir if you deployed in the same folder, where the errisy-server module is installed. But I recommend using a different folder for security.
		// this allows you to specify separated root folders for different domains. it is potential solution for shared nodejs hosting. i.e. use the same server to handle multiple different domains.
                middlewares: [
                    session,
                    new SYSMiddleware(),
                    new RPCMiddleware(false, false),
                    new FrontEndRouterMiddleware([ //the front end router middleware will send all request that matches your front end router paths to specific html file. index.html for the case here.
                        {
                            file: 'index.html',
                            patterns: [
                                /^\/(|report)$/ig
                            ]
                        }
                    ]),
                    //new FileMiddleware(), in dev mode, you can use file middle to access any file in the folder
                    new FileWhiteListMiddleware([/^\/index\.html$/g, /^\/admin\.html$/g, /^\/management\.html$/g, /^\/img\//g])
                ]
            }
        ]),
        //redirect to www as the certificate only works perfect for www
        new HostRedirctMiddleware([
            {
                regex: /\w*\.?smartkoala\.com\.au$/ig,
                options: 'ig',
                protocal: 'https',
                host: 'localhost'
            }
        ])
    ];
```
```TypeScript
import * as cluster from 'cluster';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import { IServerOptions, HttpsServer, HttpServer, DomainMiddleware, HostRedirctMiddleware, FrontEndRouterMiddleware, FileWhiteListMiddleware, FileMiddleware, SessionMiddleware, RPCMiddleware, SYSMiddleware, WrappedMiddleware } from 'errisy-server';

const numberOfProcesses = 1;// os.cpus().length; //get the number of cpus

//load server.json
let config: IServerOptions = JSON.parse(fs.readFileSync('server-dev.json').toString());
const day = 86400000;

if (cluster.isMaster) {

    let workers: cluster.Worker[] = [];

    for (let i = 0; i < numberOfProcesses; i++) {
        let worker = cluster.fork();
        workers.push(worker);
    }
}
else {
    const session = new SessionMiddleware(config.session); // currently using node session. this is not very stable for production. I will replace it with MongoDB session control.
    const http = new HttpServer(80);
    http.Middlewares = [
        new HostRedirctMiddleware([ //redirect the http to https. in you don't need https, just put the settings for https here.
            {
                regex: /(localhost|192\.168\.0\.XX|127\.0\.0\.1|\w*\.?yourdomain\.com\.au)$/ig, 
                options: 'ig',
                protocal: 'https',
                host: 'www.smartkoala.com.au'
            }
        ])
    ]

    http.start();

    const https = new HttpsServer(443);

    https.PrivateKeyFile = config.key; //specific the private and full chain certificates here.
    https.CertificateFile = config.cert;

    https.Middlewares = [
        new DomainMiddleware([
            {
                regex: /(localhost|192\.168\.0\.XX|127\.0\.0\.1|\www\.yourdomain\.com)$/ig, //change to your deploy ip address
                root: ['C:/www/root/', '/root/www'], // user __dir if you deployed in the same folder, where the errisy-server module is installed. But I recommend using a different folder for security.
                middlewares: [
                    session,
                    new SYSMiddleware(),
                    new RPCMiddleware(false, false),
                    new FrontEndRouterMiddleware([ //the front end router middleware will send all request that matches your front end router paths to specific html file. index.html for the case here.
                        {
                            file: 'index.html',
                            patterns: [
                                /^\/(|report)$/ig
                            ]
                        }
                    ]),
                    //new FileMiddleware(), in dev mode, you can use file middle to access any file in the folder
                    new FileWhiteListMiddleware([/^\/index\.html$/g, /^\/admin\.html$/g, /^\/management\.html$/g, /^\/img\//g])
                ]
            }
        ]),
        //redirect to www as the certificate only works perfect for www
        new HostRedirctMiddleware([
            {
                regex: /\w*\.?smartkoala\.com\.au$/ig,
                options: 'ig',
                protocal: 'https',
                host: 'localhost'
            }
        ])
    ]
    https.start();
}
```


## How does remote procedure call work?
** this following can be found at [errisy-tsc](https://github.com/errisy/errisy-tsc) **

Simple write your service as classes in *.rpc.ts files and extends from rpc.RPCService.

use **@rpc.service** to decorate the service class that you want to expose to the client.
use **@rpc.member** to decorate the member that you want to expose to the client.

**app.rpc.ts:**
```typescript
/// <transpile path="C:\HTTP\npm\errisy-tsc\csclient.cs"/>
import * as rpc from 'errisy-rpc';
import { ImageItem } from './imageitem';
/**
 * the RPC service example.
 */
@rpc.service
export class AppService extends rpc.RPCService {
    /**
     * this is genarate a list of image slides for the front end to display
     */
    @rpc.member
    public async ImageList(): Promise<ImageItem[]> {
        return [
            new ImageItem('img/1.jpg', 300, 1000),
            new ImageItem('img/2.jpg', 500, 2000),
            new ImageItem('img/3.jpg', 200, 400),
            new ImageItem('img/4.jpg', 100, 800),
            new ImageItem('img/5.jpg', 300, 1400),
        ]
    }
}
```
So here is the transpiled client for Angular 2.
You can simply inject it into any Angular 2 component and use it to call it by await (because all rpc calls are wrapped in the async functions)
You can also invoke it by calling the [ImageList url] field, which is the link for it: "/app/app.rpc.js?AppService-ImageList&"

**Check out the magic of comments** The comments are also copied from the service to the client. That means the front end developers will see the output.

**app.rpc.ts:**
```typescript
//Client file generated by RPC Compiler.
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as rpc from 'errisy-rpc';

import { ImageItem } from './imageitem';
/**
 * the RPC service example.
 */
@Injectable()
export class AppService {
	constructor(private $_Angular2HttpClient: Http){
	}
	/**Please set Base URL if this Remote Procedure Call is not sent to the default domain address.*/
	public $baseURL: string = "";
		/**
		 * this is genarate a list of image slides for the front end to display
		 */
		public ImageList(): Promise<ImageItem[]>{
			return this.$_Angular2HttpClient.post(this.$baseURL + '/app/app.rpc.js?AppService-ImageList', rpc.buildClientData()).map(rpc.Converter.convertJsonResponse).toPromise();
		}
		public get "ImageList url"():string{
			return this.$baseURL + "/app/app.rpc.js?AppService-ImageList&";
		}
}

```

## Transpiled C#:

C# can call the service as well with automatically generated front end client file! (For example, Xamarin project, Windows Desktop/WPF/Winform projects).
You must include the C# PolyFill for your C# front end.
Make sure you set the transpile path properly: 
**/// <transpile path="path in your computer"/>**
```CSharp
//Data Type Definition Generated by RPC compiler. Please do not modify this file.
namespace app
{
	/// <summary>
	/// the RPC service example.
	/// </summary>
	public class AppService
	{
		public AppService(string baseUrl){
			BaseUrl = baseUrl;
		}
		public string BaseUrl { get; set; }
		/// <summary>
		/// this is genarate a list of image slides for the front end to display
		/// </summary>
		public async System.Threading.Tasks.Task<ImageItem[]> ImageList()
		{
			return NodeJSRPC.Converter.convertJsonResponse<ImageItem[]>(await NodeJSRPC.HttpClient.Post(this.BaseUrl + "/app/app.rpc.js?AppService-ImageList", ));
		}
	}
}
```

#Can this handle file upload?
Yes! 
Use rpc.Polyfill.File to handle client side JavaScript File objects and rpc.Polyfill.Blob to handle client side JavaScript Blob objects.
This works for C# as well. Check it out yourself in the client files.

```typescript
/// <transpile path="C:\HTTP\npm\errisy-tsc\csclient.cs"/>

import * as rpc from 'errisy-rpc';
import { ImageItem } from './imageitem';

/**
 * the RPC service example.
 */
@rpc.service
export class AppService extends rpc.RPCService {

    /**
     * this is genarate a list of image slides for the front end to display
     */
    @rpc.member
    public async ImageList(): Promise<ImageItem[]> {
        return [
            new ImageItem('img/1.jpg', 300, 1000),
            new ImageItem('img/2.jpg', 500, 2000),
            new ImageItem('img/3.jpg', 200, 400),
            new ImageItem('img/4.jpg', 100, 800),
            new ImageItem('img/5.jpg', 300, 1400),
        ]
    }
    /**
     * File upload
     * @param file
     */
    @rpc.member
    public async upload(file: rpc.Polyfill.File): Promise<string> {

    }
    /**
     * transfer of bytes
     * @param file
     */
    @rpc.member
    public async transfer(file: rpc.Polyfill.Blob): Promise<boolean> {

    }
}
```
