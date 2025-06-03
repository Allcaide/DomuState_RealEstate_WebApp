import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

// Middleware para verificar se o usuário está autenticado
export const verifyToken = async (req, res, next) => {
  try {
    // Obter token do cookie ou do cabeçalho de autorização
    const token = req.cookies.token || 
                (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Adicionar usuário ao objeto de requisição
    req.user = user;
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

// Middleware para verificar se o usuário é administrador
export const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Admin role required" });
  }
};

// Middleware para verificar se o usuário é um contratante
export const verifyContractor = (req, res, next) => {
  if (req.user && (req.user.role === 'contractor' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Contractor role required" });
  }
};

// Middleware para verificar se o usuário tem permissão para criar anúncios imobiliários
export const verifyAgent = (req, res, next) => {
  if (req.user && (req.user.role === 'agent' || req.user.role === 'admin' ||
                   req.user.role === 'seller' || req.user.role === 'buyer')) {
    next();
  } else {
    res.status(403).json({ message: "Access denied: You don't have permission to create listings" });
  }
};

// Middleware para autenticar o token
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
          where: { id: decoded.id }
      });

      if (!user) return res.status(401).json({ message: "User not found" });

      req.user = user;
      next();
  } catch (error) {
      console.error("Authentication error:", error);
      res.status(401).json({ message: "Authentication failed" });
  }
};