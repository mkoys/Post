# Post
A feather weight javascript web framework

## Features
- Includes a static file handler
- Supports adding middleware to the server
- Supports adding middleware either globally or between routes
- Supports handling HTTP requests and sending HTTP responses

## Usage

### Getting Started
The server can be started by creating an instance of application by calling post.app and then calling application.listen to let the server listen to a specific port.
```js
// Import post into project
import post from "post";

// Create new application instance
const app = post.app();

// Handle HTTP GET requests
app.get("/", (request, response) => {
    response.send("Hello world!");
});

// Start the server
app.listen(3000, () => console.log("Listening on port 3000"));
```

### Middleware
You can add middleware functions to be executed before or after a specific route. Global middleware can be added without specifying a route, while route-specific middleware can be added by providing a route string as the first argument.
```js
// Global middleware
app.use((req, res, next) => {
    console.log("Global middleware");
    next();
});

// Route-specific middleware
app.use("/home", (req, res, next) => {
    console.log("Route-specific middleware");
    next();
});
```

### Routing
Routes can be added for specific HTTP methods (GET, POST, PUT, DELETE, etc.). If no HTTP method is specified, the route will be accessible by all methods.
```js
// Handle HTTP GET requests
app.get("/", (req, res) => {
    res.send("Hello World");
});

// Handle HTTP POST requests
app.post("/", (req, res) => {
    // Get data from request
    const data = req.body; 
    res.json({ message: "Post request received" });
});
```

### Static files
The server includes a static file middleware to serve static files, such as images and CSS files.
```js
// Exposes public folder
app.use(post.static("public"));

// Exposes static folder on public route 
app.use("public", post.static("static"));
```

## Conclusion
This is a small express-like clone that provides a simple way to handle HTTP requests and responses in Node.js. Use it as a starting point for your next project or as a way to learn more about HTTP and middleware.

### Note
This is just a small clone of Express and may not support all the features of Express. It is just for educational purposes.