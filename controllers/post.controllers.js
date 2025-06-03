import prisma from '../lib/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Get all posts with filtering options
export const getAllPosts = async (req, res) => {
  console.log('Query recebida:', req.query);
  try {
    const {
      city,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      minArea,
      maxArea,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = {};
    // Se vier district na query, usa como city
    let cityQuery = city;
    if (req.query.district) {
      cityQuery = req.query.district;
    }
    // Add filters based on query parameters
    if (req.query.title) filter.title = { contains: req.query.title, mode: 'insensitive' };
    if (cityQuery) filter.city = { equals: cityQuery, mode: 'insensitive' };
    if (minPrice) filter.price = { ...(filter.price || {}), gte: parseInt(minPrice) };
    if (maxPrice) filter.price = { ...(filter.price || {}), lte: parseInt(maxPrice) };
    if (bedrooms) filter.bedroom = { gte: parseInt(bedrooms) }; // agora filtra 2 ou mais quartos
    if (bathrooms) filter.bathroom = { gte: parseInt(bathrooms) }; // já filtra 2 ou mais casas de banho
    if (minArea) filter.area = { ...(filter.area || {}), gte: parseInt(minArea) };
    if (maxArea) filter.area = { ...(filter.area || {}), lte: parseInt(maxArea) };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    console.log('Filtro Prisma:', filter);
    // Get total count for pagination
    const total = await prisma.post.count({ where: filter });
    
    // Get posts with filtering, sorting and pagination
    const posts = await prisma.post.findMany({
      where: filter,
      orderBy: {
        [sort]: order
      },
      skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true
          }
        },
        postDetail: true
      }
    });

    res.status(200).json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

// Get featured posts
export const getFeaturedPosts = async (req, res) => {
  try {
    // Get most recent posts
    const featuredPosts = await prisma.post.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        postDetail: true
      }
    });

    res.status(200).json(featuredPosts);
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    res.status(500).json({ message: 'Failed to fetch featured posts' });
  }
};

// Get recommended posts (could be based on user preferences, location, etc.)
export const getRecommendedPosts = async (req, res) => {
  try {
    // This is a simplified implementation
    // In a real app, you would use more sophisticated recommendation logic
    const recommendedPosts = await prisma.post.findMany({
      take: 8,
      orderBy: [
        {
          price: 'asc'  // Could use different logic for recommendations
        }
      ],
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        },
        postDetail: true
      }
    });

    res.status(200).json(recommendedPosts);
  } catch (error) {
    console.error('Error fetching recommended posts:', error);
    res.status(500).json({ message: 'Failed to fetch recommended posts' });
  }
};

// Get post by ID
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true
          }
        },
        postDetail: true
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
};

// Create new post
export const createPost = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      propertyType,
      bedroom,
      bathroom,
      garages,
      area,
      areaBruta,
      address,
      city,
      district,
      parish,
      postalCode,
      latitude,
      longitude,
      renovationTiers,
      images
    } = req.body;

    // Get user ID from JWT token
    const userId = req.user.id;
    
    // Handle image URLs - either from the uploaded files (legacy) or directly from request body
    let imageUrls = [];
    
    // If images are provided in the request body as an array
    if (Array.isArray(images)) {
      imageUrls = images;
    }
    // If images are provided as a JSON string
    else if (typeof images === 'string') {
      try {
        imageUrls = JSON.parse(images);
      } catch (e) {
        console.error('Error parsing images JSON:', e);
      }
    }
    // Legacy support for direct file uploads
    else if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/listings/${file.filename}`);
    }
    
    // Log received data for debugging
    console.log('Creating post with data:', {
      title, description, price, bedroom, bathroom, area, latitude, longitude, images: imageUrls
    });

    // Create post and post details in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create post with properly typed data according to schema
      const post = await prisma.post.create({
        data: {
          title: title || "No Title",
          description: description || "",
          price: price ? parseInt(price) : 0, // Int in schema
          bedroom: bedroom ? parseInt(bedroom) : 0, // Int in schema
          bathroom: bathroom ? parseInt(bathroom) : 0, // Int in schema
          area: area ? parseInt(area) : 0, // Int in schema
          address: address || "",
          city: city || "",
          latitude: latitude ? String(latitude) : "", // String in schema
          longitude: longitude ? String(longitude) : "", // String in schema
          images: Array.isArray(imageUrls) ? imageUrls : [],
          userId: userId
        }
      });
      
      console.log('Post created successfully:', post.id);

      return post;
    });

    res.status(201).json({
      message: 'Post created successfully',
      postId: result.id
    });
  } catch (error) {
    console.error('Error creating post:', error);
    
    // Log detailed error info for Prisma errors
    if (error.code) {
      console.error('Prisma error code:', error.code);
      console.error('Prisma error meta:', error.meta);
    }
    
    // Delete uploaded files if post creation fails
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      });
    }
    
    // Send detailed error message
    let errorMessage = 'Failed to create post';
    if (error.message.includes('prisma')) {
      if (error.meta && error.meta.field_name) {
        errorMessage += `: Invalid data for field '${error.meta.field_name}'`;
      } else {
        errorMessage += ': Database error';
      }
    } else {
      errorMessage += ': ' + error.message;
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

// Update post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (existingPost.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Extract post and post detail data from request
    const {
      title,
      description,
      price,
      images,
      address,
      city,
      bedroom,
      bathroom,
      latitude,
      longitude,
      area,
      utilities,
      pet,
      income,
      school,
      bus,
      restaurant
    } = req.body;

    // Update post and post details in a transaction
    await prisma.$transaction(async (prisma) => {
      // Update post
      await prisma.post.update({
        where: { id },
        data: {
          title,
          description,
          price: price ? parseInt(price) : undefined,
          images: images || undefined,
          address,
          city,
          bedroom: bedroom ? parseInt(bedroom) : undefined,
          bathroom: bathroom ? parseInt(bathroom) : undefined,
          latitude,
          longitude,
          area: area ? parseInt(area) : undefined
        }
      });

      // Update post details
      await prisma.postDetail.upsert({
        where: { postId: id },
        update: {
          utilities,
          pet,
          income,
          school: school ? parseInt(school) : null,
          bus: bus ? parseInt(bus) : null,
          restaurant: restaurant ? parseInt(restaurant) : null
        },
        create: {
          postId: id,
          utilities,
          pet,
          income,
          school: school ? parseInt(school) : null,
          bus: bus ? parseInt(bus) : null,
          restaurant: restaurant ? parseInt(restaurant) : null
        }
      });
    });

    res.status(200).json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if post exists and belongs to user
    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete post (cascade will delete postDetail as configured in the schema)
    await prisma.post.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

// Save/Favorite a post
export const savePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;
    console.log('[savePost] userId:', userId, 'postId:', postId);

    // Check if already saved
    const existingSaved = await prisma.savedPost.findFirst({
      where: {
        userId,
        postId
      }
    });
    console.log('[savePost] existingSaved:', existingSaved);

    if (existingSaved) {
      return res.status(400).json({ message: 'Post already saved' });
    }

    // Save the post
    const created = await prisma.savedPost.create({
      data: {
        userId,
        postId
      }
    });
    console.log('[savePost] created:', created);

    res.status(201).json({ message: 'Post saved successfully' });
  } catch (error) {
    console.error('[savePost] Error:', error);
    res.status(500).json({ message: 'Failed to save post', error: error.message, stack: error.stack });
  }
};

// Unsave/Unfavorite a post
export const unsavePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    console.log('[unsavePost] Called with:', { userId, postId, params: req.params });

    // Check if exists
    const existing = await prisma.savedPost.findFirst({ where: { userId, postId } });
    console.log('[unsavePost] Existing savedPost:', existing);

    // Delete the saved post
    const result = await prisma.savedPost.deleteMany({ where: { userId, postId } });
    console.log('[unsavePost] Delete result:', result);

    res.status(200).json({ message: 'Post unsaved successfully' });
  } catch (error) {
    console.error('Error unsaving post:', error);
    res.status(500).json({ message: 'Failed to unsave post' });
  }
};

// Get saved/favorited posts for a user
export const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[getSavedPosts] userId:', userId);

    const savedPosts = await prisma.savedPost.findMany({
      where: {
        userId
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true
              }
            },
            postDetail: true
          }
        }
      }
    });

    // Filtra favoritos órfãos (post == null)
    const validPosts = savedPosts.filter(saved => saved.post !== null);
    console.log('[getSavedPosts] validPosts count:', validPosts.length);
    res.status(200).json(validPosts.map(saved => saved.post));
  } catch (error) {
    console.error('[getSavedPosts] Error:', error);
    res.status(500).json({ message: 'Failed to fetch saved posts', error: error.message, stack: error.stack });
  }
};

export const getFavoritePosts = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('[getFavoritePosts] userId:', userId);
    const savedPosts = await prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            user: { select: { id: true, username: true, name: true } },
            postDetail: true
          }
        }
      }
    });
    const validPosts = savedPosts.filter(saved => saved.post !== null);
    console.log('[getFavoritePosts] validPosts:', validPosts.length, validPosts);
    res.status(200).json(validPosts.map(saved => saved.post));
  } catch (error) {
    console.error('[getFavoritePosts] Error:', error);
    res.status(500).json({ message: 'Failed to fetch favorite posts', error: error.message });
  }
};

// Upload images for a post
export const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Process uploaded files
    // In a production app, you would upload these to a cloud storage service like AWS S3
    // For this demo, we'll generate URLs that would work if the files were actually stored
    const fileUrls = req.files.map(file => {
      // Generate unique filename
      const uniqueId = uuidv4();
      const fileExt = file.originalname.split('.').pop();
      const filename = `${uniqueId}.${fileExt}`;
      
      // In production, here we would upload the file to cloud storage
      // For this demo, we'll create a URL that points to where the file would be
      return `/uploads/${filename}`;
    });
    
    res.status(200).json({
      message: 'Images uploaded successfully',
      urls: fileUrls
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Failed to upload images' });
  }
};

export const toggleFavoritePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user.id;
    console.log('[toggleFavoritePost] userId:', userId, 'postId:', postId);
    // Verifica se já existe
    const existing = await prisma.savedPost.findFirst({
      where: { userId, postId }
    });
    console.log('[toggleFavoritePost] existing:', existing);
    if (existing) {
      console.log('[toggleFavoritePost] Vai remover favorito');
      await prisma.savedPost.deleteMany({ where: { userId, postId } });
      return res.status(200).json({ message: 'Post removed from favorites', isFavorite: false });
    } else {
      console.log('[toggleFavoritePost] Vai adicionar favorito');
      await prisma.savedPost.create({ data: { userId, postId } });
      return res.status(201).json({ message: 'Post added to favorites', isFavorite: true });
    }
  } catch (error) {
    console.error('[toggleFavoritePost] Error:', error);
    res.status(500).json({ message: 'Failed to toggle favorite', error: error.message });
  }
};