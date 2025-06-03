import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
import { 
  getAllPosts, 
  getFeaturedPosts,
  getRecommendedPosts,
  getPostById, 
  createPost, 
  updatePost, 
  deletePost,
  savePost,
  unsavePost,
  getSavedPosts,
  getFavoritePosts,
  toggleFavoritePost,

} from "../controllers/post.controllers.js";
import { verifyToken, verifyAgent } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directory paths
const uploadsDir = path.join(__dirname, '../uploads');
const listingsDir = path.join(__dirname, '../uploads/listings');

// Create directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(listingsDir)) {
  fs.mkdirSync(listingsDir, { recursive: true });
}

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, listingsDir);
  },
  filename: function(req, file, cb) {
    const userId = req.user ? req.user.id : 'anonymous';
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `img.${userId}.${timestamp}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Aceitar apenas imagens
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
    files: 20 // Maximum 20 files per upload
  },
  fileFilter: fileFilter
});

// Rotas públicas (não requerem autenticação)
router.get("/featured", getFeaturedPosts);
router.get("/recommended", getRecommendedPosts);
router.get("/user/saved", verifyToken, getSavedPosts);
// Se tiveres rota de favoritos, coloca aqui também
router.get("/favorites", verifyToken, getFavoritePosts);
router.get("/:id", getPostById);
router.get("/", getAllPosts);

// Rotas protegidas (requerem autenticação)
// Rota para criar posts com imagens já enviadas previamente
router.post("/", verifyToken, verifyAgent, createPost);
router.post('/toggle-favorite', verifyToken, toggleFavoritePost);
router.put("/:id", verifyToken, upload.array('images', 20), updatePost);
router.delete("/:id", verifyToken, deletePost);
router.post("/save", verifyToken, savePost);
router.delete("/save/:postId", verifyToken, unsavePost);

export default router;