interface RPCResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

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

    async load(): Promise<void> {
        let response: Response;

        try {
            response = await fetch(`${this.url}/discover`);
        } catch (e) {
            console.error("Failed to fetch RPC list to load all remote functions");
            return;
        }

        if (!response.ok) {
            console.error("Failed to load RPC list due to a backend RPC endpoint misconfiguration");
            return;
        }

        const methods: string[] = await response.json();

        for (const name of methods) {
            this[name] = (...args: any[]) => this.call(name, args);
        }

        console.log("RPC functions have been loaded successfully");
    }

    async call<T = any>(name: string, params: any[]): Promise<T> {
        let response: Response;

        try {
            response = await fetch(`${this.url}/call`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ method: name, params }),
            });
        } catch (e) {
            throw new Error(`RPC Network Error while calling ${name} from ${this.url}: ${e}`);
        }

        const data: RPCResponse<T> = await response.json();

        if (!data.success) {
            throw new Error(`RPC function error from backend: ${name}() \n\n\n${data.error?.toString()}`);
        }

        return data.data as T;
    }
}

