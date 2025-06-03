import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();
const prisma = new PrismaClient();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the listings images directory
const listingsDir = path.join(__dirname, '../uploads/listings');

/**
 * Scan and analyze all listing images
 */
async function analyzeListingImages() {
  console.log('\n=== Listing Images Analysis ===\n');
  
  // Ensure the directory exists
  if (!fs.existsSync(listingsDir)) {
    console.log('Creating listings directory:', listingsDir);
    fs.mkdirSync(listingsDir, { recursive: true });
    console.log('Listings directory created successfully.');
    return;
  }
  
  console.log(`Scanning directory: ${listingsDir}`);
  
  try {
    // Read all files in the directory
    const files = fs.readdirSync(listingsDir);
    console.log(`Found ${files.length} files in total.`);
    
    // Pattern for valid image names: img.USERID.LISTINGCODE.XX.ext
    const pattern = /^img\.([0-9a-f]{7})\.([a-z0-9]+)\.(\d{2})(\.[a-z]+)$/i;
    
    // Categorize files
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      const match = file.match(pattern);
      if (match) {
        validFiles.push({
          filename: file,
          userId: match[1],
          listingCode: match[2],
          imageNumber: match[3],
          extension: match[4],
          fullPath: path.join(listingsDir, file)
        });
      } else {
        invalidFiles.push(file);
      }
    });
    
    console.log(`\nValid files: ${validFiles.length}`);
    console.log(`Invalid files: ${invalidFiles.length}`);
    
    // Analysis by user and listing
    const userStats = {};
    const listingStats = {};
    
    validFiles.forEach(file => {
      // User stats
      if (!userStats[file.userId]) {
        userStats[file.userId] = {
          totalImages: 0,
          listings: new Set(),
          byExtension: {}
        };
      }
      userStats[file.userId].totalImages++;
      userStats[file.userId].listings.add(file.listingCode);
      
      // Extension stats
      const ext = file.extension.toLowerCase();
      if (!userStats[file.userId].byExtension[ext]) {
        userStats[file.userId].byExtension[ext] = 0;
      }
      userStats[file.userId].byExtension[ext]++;
      
      // Listing stats
      const listingKey = `${file.userId}-${file.listingCode}`;
      if (!listingStats[listingKey]) {
        listingStats[listingKey] = {
          userId: file.userId,
          listingCode: file.listingCode,
          imageCount: 0,
          numberSequence: []
        };
      }
      listingStats[listingKey].imageCount++;
      listingStats[listingKey].numberSequence.push(parseInt(file.imageNumber, 10));
    });
    
    // Print user statistics
    console.log('\n=== User Statistics ===');
    for (const userId in userStats) {
      console.log(`\nUser ID: ${userId}`);
      console.log(`  Total Images: ${userStats[userId].totalImages}`);
      console.log(`  Listings: ${userStats[userId].listings.size}`);
      console.log(`  File types:`);
      for (const ext in userStats[userId].byExtension) {
        console.log(`    ${ext}: ${userStats[userId].byExtension[ext]}`);
      }
    }
    
    // Print listing statistics
    console.log('\n=== Listing Statistics ===');
    for (const key in listingStats) {
      const listing = listingStats[key];
      console.log(`\nListing: ${listing.listingCode} (User: ${listing.userId})`);
      console.log(`  Image Count: ${listing.imageCount}`);
      
      // Check sequence integrity
      listing.numberSequence.sort((a, b) => a - b);
      let isSequential = true;
      for (let i = 0; i < listing.numberSequence.length; i++) {
        if (listing.numberSequence[i] !== i + 1) {
          isSequential = false;
          break;
        }
      }
      
      console.log(`  Sequence Integrity: ${isSequential ? 'OK' : 'BROKEN'}`);
      if (!isSequential) {
        console.log(`  Actual Sequence: ${listing.numberSequence.join(', ')}`);
        console.log(`  Missing Numbers: ${findMissingNumbers(listing.numberSequence)}`);
      }
    }
    
    // Print invalid files if any
    if (invalidFiles.length > 0) {
      console.log('\n=== Invalid Files ===');
      invalidFiles.forEach(file => {
        console.log(`  ${file}`);
      });
    }
    
    console.log('\n=== Storage Summary ===');
    let totalSize = 0;
    validFiles.forEach(file => {
      const stats = fs.statSync(file.fullPath);
      totalSize += stats.size;
    });
    
    console.log(`Total disk usage: ${formatBytes(totalSize)}`);
    console.log(`Average file size: ${formatBytes(totalSize / validFiles.length)}`);
    
  } catch (error) {
    console.error('Error analyzing listing images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Find missing numbers in a sequence
 * @param {number[]} sequence - Array of numbers
 * @returns {string} - Comma-separated list of missing numbers
 */
function findMissingNumbers(sequence) {
  if (sequence.length === 0) return 'none';
  
  const max = Math.max(...sequence);
  const missing = [];
  
  for (let i = 1; i <= max; i++) {
    if (!sequence.includes(i)) {
      missing.push(i);
    }
  }
  
  return missing.length ? missing.join(', ') : 'none';
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted string with appropriate unit
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Fix sequence numbers for a specific listing
 * @param {string} userId - User ID in hex format
 * @param {string} listingCode - Listing code
 */
async function fixSequenceNumbers(userId, listingCode) {
  if (!userId || !listingCode) {
    console.error('Both userId and listingCode are required');
    return;
  }
  
  console.log(`\nFixing sequence numbers for User: ${userId}, Listing: ${listingCode}`);
  
  try {
    // Pattern to match files for this listing
    const pattern = new RegExp(`^img\\.${userId}\\.${listingCode}\\.(\\d{2})\\.(.*?)$`, 'i');
    const files = fs.readdirSync(listingsDir)
      .filter(file => pattern.test(file))
      .map(file => {
        const match = file.match(pattern);
        return {
          filename: file,
          number: parseInt(match[1], 10),
          extension: match[2],
          fullPath: path.join(listingsDir, file)
        };
      })
      .sort((a, b) => a.number - b.number);
    
    console.log(`Found ${files.length} files for this listing`);
    
    if (files.length === 0) {
      console.log('No files to fix');
      return;
    }
    
    // Create a temporary directory for the operation
    const tempDir = path.join(listingsDir, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Move all files to temp with new sequence numbers
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const newNumber = (i + 1).toString().padStart(2, '0');
      const newFilename = `img.${userId}.${listingCode}.${newNumber}.${file.extension}`;
      const newPath = path.join(tempDir, newFilename);
      
      fs.copyFileSync(file.fullPath, newPath);
      console.log(`Renumbered: ${file.filename} -> ${newFilename}`);
    }
    
    // Delete original files
    for (const file of files) {
      fs.unlinkSync(file.fullPath);
    }
    
    // Move files back from temp
    const fixedFiles = fs.readdirSync(tempDir);
    for (const file of fixedFiles) {
      fs.copyFileSync(path.join(tempDir, file), path.join(listingsDir, file));
    }
    
    // Clean up temp directory
    for (const file of fixedFiles) {
      fs.unlinkSync(path.join(tempDir, file));
    }
    fs.rmdirSync(tempDir);
    
    console.log('Sequence numbers fixed successfully');
    
  } catch (error) {
    console.error('Error fixing sequence numbers:', error);
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Usage:
  node manage-listing-images.js [command] [options]

Commands:
  analyze                     Scan and analyze all listing images
  fix-sequence <userId> <listingCode>  Fix sequence numbers for a specific listing
  help                        Show this help message

Examples:
  node manage-listing-images.js analyze
  node manage-listing-images.js fix-sequence abc1234 xyz789
  `);
}

// Main function to parse command line arguments and execute commands
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  switch (command) {
    case 'analyze':
      await analyzeListingImages();
      break;
    case 'fix-sequence':
      if (args.length < 3) {
        console.error('Both userId and listingCode are required for fix-sequence command');
        showHelp();
        return;
      }
      await fixSequenceNumbers(args[1], args[2]);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
  }
}

// Run the main function
main().catch(console.error);