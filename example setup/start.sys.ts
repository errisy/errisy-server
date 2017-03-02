
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


