import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { verifyToken } from '../middlewares/authMiddleware.js';
import util from 'util';

const router = express.Router();
dotenv.config();

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, '../uploads/listings');

// Ensure the directory exists with proper permissions
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true, mode: 0o755 });
  console.log('Created listings directory:', imagesDir);
}

// Função para formatar o ID do usuário em hexadecimal
const formatUserIdHex = (userId) => {
  const numericId = userId.toString().replace(/[^0-9a-f]/g, '');
  return numericId.padStart(7, '0').substring(0, 7);
};

// Configuração do multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const userId = req.user.id;
    const listingCode = req.body.listingCode || Date.now().toString(36);
    const imageNumber = req.imageCount ? (req.imageCount + 1) : 1;
    req.imageCount = imageNumber;
    
    const userIdHex = formatUserIdHex(userId);
    const paddedImageNum = imageNumber.toString().padStart(2, '0');
    const extname = path.extname(file.originalname).toLowerCase();
    
    const filename = `img.${userIdHex}.${listingCode}.${paddedImageNum}${extname}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
  }
};

//Get the size of current directory memory
function getDirectorySize(directoryPath) {
  const files = fs.readdirSync(directoryPath);
  let totalSize = 0;
  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      totalSize += stats.size;
    }
  });
  return totalSize;
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 20
  }
});

// Rota para upload múltiplo de imagens
router.post('/upload-multiple', verifyToken, (req, res) => {

  const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

  // check current directory size before uploading new images
  // This is a synchronous operation, so it may block the event loop for large directories.
  const currentSize = getDirectorySize(imagesDir);
  if (currentSize >= MAX_SIZE) {
    return res.status(400).json({
      error: 'The server administrator has set a 5GB limit for images. Please contact support or remove old images.'
    });
  }




  upload.array('images', 20)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Maximum is 20 files' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const imageUrls = req.files.map(file => `/uploads/listings/${file.filename}`);

    res.status(200).json({
      message: 'Upload successful!',
      imageUrls
    });
  });
});

// Rota para servir imagens
router.get('/:userIdHex/:listingCode/:filename', (req, res) => {
  try {
    const { userIdHex, listingCode, filename } = req.params;
    const imagePath = path.join(imagesDir, filename);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(imagePath)) {
      const width = 800;
      const height = 600;
      return res.redirect(`https://via.placeholder.com/${width}x${height}/e0e0e0/808080?text=Image+Not+Available`);
    }
    
    // Configurar cache para melhor performance
    res.set('Cache-Control', 'public, max-age=31536000');
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

export default router;