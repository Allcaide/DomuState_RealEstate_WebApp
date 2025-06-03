import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';

// Get user by ID with their published listings
export const getUserWithListings = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                posts: {
                    include: {
                        postDetail: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Count saved posts
        const savedPostsCount = await prisma.savedPost.count({
            where: { userId }
        });

        const result = {
            ...user,
            savedPostsCount
        };

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Failed to fetch user data" });
    }
};

// Update user profile
export const updateUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email, name, currentPassword, newPassword } = req.body;

        // Verify current user exists
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true, email: true }
        });

        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create data object for update
        const updateData = {};
        
        if (username) updateData.username = username;
        if (name !== undefined) updateData.name = name || null; // Allow setting to null
        
        // If email is being changed, check it's not already taken
        if (email && email !== currentUser.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });
            
            if (existingUser) {
                return res.status(400).json({ message: "Email already in use" });
            }
            
            updateData.email = email;
        }

        // If password is being changed, verify current password and hash new one
        if (newPassword && currentPassword) {
            const validPassword = await bcrypt.compare(currentPassword, currentUser.password);
            
            if (!validPassword) {
                return res.status(401).json({ message: "Current password is incorrect" });
            }
            
            // Hash the new password
            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        // Update user if there are changes
        if (Object.keys(updateData).length > 0) {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    name: true,
                    role: true,
                    createdAt: true
                }
            });
            
            return res.status(200).json({ 
                message: "User profile updated successfully", 
                user: updatedUser 
            });
        }

        return res.status(200).json({ 
            message: "No changes to update",
            user: {
                id: userId,
                username: req.user.username,
                email: req.user.email,
                name: req.user.name,
                role: req.user.role,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user profile" });
    }
};

// Delete user account
export const deleteUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        // Verify password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Delete user (cascade will delete related posts and saved posts)
        await prisma.user.delete({
            where: { id: userId }
        });

        res.status(200).json({ message: "User account deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Failed to delete user account" });
    }
};

// Delete a specific post
export const deleteUserPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.postId;

        // Check if post exists and belongs to user
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { userId: true }
        });

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.userId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to delete this post" });
        }

        // Delete post (cascade will delete post details and saved references)
        await prisma.post.delete({
            where: { id: postId }
        });

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ message: "Failed to delete post" });
    }
};