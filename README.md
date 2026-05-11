# Stock

## Run the backend server

1. Create a `.env` file in the project root with these values:

```env
MONGODB_URI=your-mongodb-connection-string
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
```

2. Start the backend with:

```bash
npm start
```

3. Open `index.html` in your browser to use the frontend.

> Do not run `node app.js`. That file is client-side browser code and will fail in Node.
