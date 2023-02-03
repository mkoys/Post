import http from "http";
import fs from "fs";
import path from "path";

class Post {
    constructor() {
        this.server = http.createServer((request, response) => this.#requestHandler(request, response));
        this.routeDelimiter = "$";
        this.middlewareTag = "MIDDLEWARE"
        this.map = new Map();
        this.map.set(this.middlewareTag, []);
    }

    #requestHandler(request, response) {
        this.#getBody(request, body => {
            request.body = body;
            let handlerStack = this.#createStack(request.url, request.method);
            handlerStack = this.#hydrateStack(handlerStack);
            const customResponse = this.#createReponse(response);
            this.#executeStack(handlerStack, request, customResponse);
        });
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
        for (const handler of stack) {
            if (typeof handler === "function") {
                newStack.push(handler);
            } else {
                newStack.push(...handler);
            }
        }
        return newStack;
    }

    #createReponse(response) {
        let newResponse = {};

        newResponse.send = (message) => {
            response.write(message);
            response.end();
        }

        newResponse.sendStatus = (statusCode) => {
            response.statusCode = statusCode;
            response.end();
        }

        newResponse.json = (message) => {
            try { message = JSON.stringify(message) }
            catch (error) { console.error(error) }
            finally { response.setHeader("Content-Type", "application/json") }
            response.write(message);
            response.end();
        }

        newResponse.response = response;

        return newResponse;
    }

    #getBody(request, callback) {
        let body = [];
        request.on('data', (chunk) => body.push(chunk));
        request.on('end', () => {
            body = Buffer.concat(body).toString();
            callback(body);
        });
    }

    use() {
        let index = 0;

        while (index < arguments.length) {
            let url = false;

            if (typeof arguments[index] === "string") {
                this.map.set(this.middlewareTag + this.routeDelimiter + arguments[index], arguments[index + 1]);
                url = true;
                index++;
            }

            if (typeof arguments[index] === "function" && !url) {

                const newMiddleware = [...this.map.get(this.middlewareTag), arguments[index]];
                this.map.set(this.middlewareTag, newMiddleware);
            } else if (typeof arguments[index] === "object") {
                const middleware = this.map.get("MIDDLEWARE");
                const middlewareRouter = arguments[index].map.get("MIDDLEWARE");
                const newMiddleware = [...middleware, ...middlewareRouter];
                if (url) {
                    arguments[index].map.forEach((value, key) => {
                        const splitKey = key.split(this.routeDelimiter);
                        if (splitKey[0] !== this.middlewareTag) {
                            splitKey[1] = arguments[index - 1] + splitKey[1];
                            const newKey = splitKey.join("$");
                            this.map.set(newKey, value);
                        }
                    });
                } else { arguments[index].map.forEach((value, key) => this.map.set(key, value)) }
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

export function post(args) { return new Post(args) };

export function staticHandler(pathString) {
    const router = new Post();

    mapDirectory(pathString, "");

    function mapDirectory(directory, url) {
        const isDirectory = fs.lstatSync(directory).isDirectory();

        if (isDirectory) {
            const files = fs.readdirSync(directory, { encoding: "utf-8" });

            files.forEach(file => {
                const currentPath = path.join(directory, file);
                const isDirectory = fs.lstatSync(currentPath).isDirectory();

                if (isDirectory) {
                    mapDirectory(currentPath, url + "/" + file);
                } else {
                    const currentPath = path.join(directory, file);
                    handle(currentPath, url + "/" + file);
                }
            });
        } else {
            handle(directory, url + "/" + file)
        }
    }

    function handle(pathString, url) {
        router.get(url, (req, res) => {
            res.response.setHeader("Content-type", getType(pathString));
            res.response.write(fs.readFileSync(pathString));
            res.response.end();
        });
    }

    function getType(filePath) {
        switch (path.extname(filePath)) {
            case ".html": return "text/html"; break;
            case ".css": return "text/css"; break;
            case ".js": return "application/javascript"; break;
            case ".json": return "application/json"; break;
            case ".png": return "application/png"; break;
            case ".jpg": return "application/jpeg"; break;
            case ".jpeg": return "application/jpeg"; break;
            case ".gif": return "application/gif"; break;
            default: return "text"; break;
        }
    }

    return router;
}