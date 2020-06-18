declare module 'ember-cli-fastboot/services/fastboot' {
    import Service from '@ember/service';

    interface Request {
        method: string;
        body: any;
        cookies: any;
        headers: any;
        queryParams: any;
        path: string;
        protocol: string;
        host: string;
    }

    interface Shoebox {
        put(key: string, value: any): void;
        retrieve(key: string): undefined | JSON;
    }

    export default class Fastboot extends Service {
        public isFastBoot: boolean;
        public request: Request;
        public shoebox: Shoebox;
        public response: any;
        public metadata: any;
        public deferRendering(promise: Promise<unknown>): unknown;
    }
}
