import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function updateImageUrls() {
  try {
    console.log('Starting to update image URLs in the database...');
    
    // Get all posts with images
    const posts = await prisma.post.findMany({
      where: {
        images: {
          isEmpty: false
        }
      }
    });
    
    console.log(`Found ${posts.length} posts with images to update`);
    
    // For each post, update the image URLs
    for (const post of posts) {
      const updatedImages = post.images.map(imageUrl => {
        // Check if the URL is a Storj URL
        if (imageUrl.includes(process.env.STORJ_ENDPOINT) || imageUrl.includes(process.env.STORJ_BUCKET)) {
          // Extract the filename from the URL
          const urlParts = imageUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          
          // Create a new URL pointing to our proxy endpoint
          return `/api/image/${filename}`;
        }
        
        return imageUrl;
      });
      
      // Update the post with the new image URLs
      await prisma.post.update({
        where: { id: post.id },
        data: { images: updatedImages }
      });
      
      console.log(`Updated images for post ${post.id}`);
    }
    
    console.log('All image URLs updated successfully!');
  } catch (error) {
    console.error('Error updating image URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
updateImageUrls();