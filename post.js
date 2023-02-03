import http from "http";

class Post {
    constructor() {
        this.server = http.createServer((request, response) => this.requestHandler(request, response));
        this.routeDelimiter = "$";
        this.middlewareTag = "MIDDLEWARE"
        this.map = new Map();
        this.map.set(this.middlewareTag, []);
    }

    requestHandler(request, response) {
        let handlerStack = this.#createStack(request.url, request.method);
        handlerStack = this.#hydrateStack(handlerStack);
        this.#executeStack(handlerStack, request, response);
    }

    #executeStack(stack, request, response) {
        let stackPointer = -1;

        next();

        function next() {
            stackPointer++;
            stack[stackPointer] && stack[stackPointer](request, response, next);
        }
    }

    #createStack(url, method) {
        let stack = [];

        const globalMiddleware = this.map.get(this.middlewareTag);
        const routeMiddleware = this.map.get(this.middlewareTag + this.routeDelimiter + url);

        const methodHandler = this.map.get(method + this.routeDelimiter + url);
        const globalHandler = this.map.get(url);

        globalMiddleware && stack.push(globalMiddleware);
        routeMiddleware && stack.push(routeMiddleware);
        methodHandler && stack.push(methodHandler);
        globalHandler && stack.push(globalHandler);

        return stack;
    }

    #hydrateStack(stack) {
        const newStack = [];
        for(const handler of stack) {
            if(typeof handler === "function") {
                newStack.push(handler);
            }else {
                newStack.push(...handler);
            }
        }
        return newStack;
    }

    use() {
        let index = 0;
        
        while(index < arguments.length) {
            if(typeof arguments[index] === "string") {
                this.map.set(this.middlewareTag + this.routeDelimiter + arguments[index], arguments[index + 1]);
                index++;
            }else if(typeof arguments[index] === "function") {
                const newMiddleware = [...this.map.get(this.middlewareTag), arguments[index]]
                this.map.set(this.middlewareTag, newMiddleware);
            }

            index++;
        }
    }

    listen(port, callback) {
        this.server.listen(port, callback);
    }

    all(route, handler) {
        this.map.set(route, handler);
    }

    get(route, handler) {
        this.map.set("GET" + this.routeDelimiter + route, handler);
    }

    post(route, handler) {
        this.map.set("POST" + this.routeDelimiter + route, handler);
    }

    put(route, handler) {
        this.map.set("PUT" + this.routeDelimiter + route, handler);
    }

    delete(route, handler) {
        this.map.set("DELETE" + this.routeDelimiter + route, handler);
    }
}

export default (args) => new Post(args);