import http from "http";

class Post {
    constructor() {
        this.server = http.createServer((request, response) => this.requestHandler(request, response));
        this.map = new Map();
        this.routeDelimiter = "$";
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

        const methodHandler = this.map.get(method + this.routeDelimiter + url);
        const globalHandler = this.map.get(url);

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