interface RPCResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

// used for protocol version compatibility for future changes in RPC protocol
const api_version = 1

export interface RPCConfig {
    url: string;
}

export class RPC {
    public url: string;

    // Index signature to allow dynamic method names
    [key: string]: any;

    constructor(url: string | RPCConfig) {
        const urlString = typeof url === 'string' ? url : url.url;
        this.url = urlString.endsWith("/") ? urlString.slice(0, -1) : urlString;
    }

    load(...method: string[]): void {
        for (const name of method) {
            this[name] = (...args: any[]) => this.call(name, args);
        }
    }

    async call<T = any>(name: string, params: any[]): Promise<T> {
        let response: Response;

        try {
            response = await fetch(`${this.url}/call`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ method: name, params, version: api_version }),
            });
        } catch (e) {
            throw new Error(`RPC Network Error while calling ${name} from ${this.url}: ${e}`);
        }

        const data: RPCResponse<T> = await response.json();

        if (!data.success) {
            throw new Error(`RPC function error from backend: ${name}()\t ${data.error?.toString()}`);
        }

        return data.data as T;
    }
}

