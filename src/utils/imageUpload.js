/**
 * Utility functions for handling image uploads with the new naming convention:
 * img.(user_id_hex).(listing_code).(image_number).extension
 */

/**
 * Generates a new listing code to use with image uploads
 * @returns {Promise<string>} A promise that resolves to a new listing code
 */
export const generateListingCode = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/listing-images/generate-listing-code', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to generate listing code: ${response.statusText}`);
    }

    const data = await response.json();
    return data.listingCode;
  } catch (error) {
    console.error('Error generating listing code:', error);
    throw error;
  }
};

/**
 * Uploads a single image using the new naming convention
 * 
 * @param {File} image - The image file to upload
 * @param {string} listingCode - The listing code to associate with the image
 * @returns {Promise<Object>} A promise that resolves to an object with the image URL
 */
export const uploadSingleImage = async (image, listingCode) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    if (!listingCode) {
      throw new Error('Listing code is required');
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('listingCode', listingCode);

    const response = await fetch('/api/listing-images/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Uploads multiple images sequentially for a listing
 * 
 * @param {File[]} images - An array of image files to upload
 * @param {string} listingCode - The listing code to associate with the images
 * @param {Function} progressCallback - Optional callback for upload progress (receives percentage)
 * @returns {Promise<string[]>} A promise that resolves to an array of image URLs
 */
export const uploadMultipleImages = async (images, listingCode, progressCallback = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    if (!listingCode) {
      throw new Error('Listing code is required');
    }

    if (!Array.isArray(images) || images.length === 0) {
      return [];
    }

    // Check for maximum image count
    if (images.length > 20) {
      throw new Error('Maximum 20 images allowed per listing');
    }

    const imageUrls = [];
    let completedUploads = 0;

    // Upload images one at a time to ensure correct sequential numbering
    for (const image of images) {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('listingCode', listingCode);

      const response = await fetch('/api/listing-images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      imageUrls.push(data.imageUrl);

      // Update progress if callback provided
      completedUploads++;
      if (progressCallback) {
        const progressPercent = Math.round((completedUploads / images.length) * 100);
        progressCallback(progressPercent);
      }
    }

    return imageUrls;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
};

/**
 * Creates the full image path using the new naming convention
 * 
 * @param {string} userIdHex - The hexadecimal user ID
 * @param {string} listingCode - The listing code
 * @param {string} filename - The filename including image number and extension
 * @returns {string} The full image URL path
 */
export const getImageUrl = (userIdHex, listingCode, filename) => {
  return `/api/listing-images/${userIdHex}/${listingCode}/${filename}`;
};