import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Importar rotas
import authRoute from "./routes/auth.route.js";
import postRoute from "./routes/post.route.js";

import listingImagesRoute from "./routes/listing-images.route.js";
import userRoute from "./routes/user.route.js";

// Configurar ambiente
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Criar diretórios de upload se não existirem
const uploadsDir = path.join(__dirname, 'uploads');
const listingsDir = path.join(__dirname, 'uploads/listings');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(listingsDir)) {
  fs.mkdirSync(listingsDir, { recursive: true });
}

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/listings', express.static(path.join(__dirname, 'uploads/listings')));

// Rotas da API
app.use("/api/auth", authRoute);
app.use("/api/posts", postRoute);

app.use("/api/listing-images", listingImagesRoute);
app.use("/api/users", userRoute);

// Rota de health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is up and running" });
});

// Error handler middleware
app.use((err, req, res, next) => {
  // Log error details for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Ensure content type is set to JSON for API routes
  if (req.originalUrl.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    
    // Determine appropriate status code
    let statusCode = err.status || 500;
    if (err.name === 'ValidationError') {
      statusCode = 400;
    } else if (err.name === 'UnauthorizedError' || err.message.includes('auth')) {
      statusCode = 401;
    } else if (err.name === 'ForbiddenError') {
      statusCode = 403;
    } else if (err.name === 'NotFoundError') {
      statusCode = 404;
    }
    
    // Send detailed error in development, simplified in production
    const errorResponse = {
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
      status: statusCode,
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    };
    
    // Include stack trace in development only
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack;
    }
    
    res.status(statusCode).json(errorResponse);
  } else {
    // For non-API routes, proceed with normal error handling
    res.status(err.status || 500);
    res.send('Server Error');
  }
});

// Servir arquivos estáticos do cliente em desenvolvimento
app.use(express.static(path.join(__dirname, '../client/public')));

// Catch-all route para o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
  console.log(`Frontend (served by API) accessible at: http://localhost:${PORT}`);
});

export default app;