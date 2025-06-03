import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export const register = async (req, res) => {
    console.log("register endpoint works!");
    const { username, email, password, name, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // HASH THE PASSWORD
        const hashPassword = await bcrypt.hash(password, 10);
        console.log(hashPassword);

        // CREATE NEW USER AND SAVE TO DB
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashPassword,
                name: name || null, // Define o campo name como null se não for fornecido
                role
            }
        });

        const age = 1000 * 60 * 60 * 24 * 7; // 7 days

        const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: age });

        console.log(newUser);
        res.status(201).json({ message: "User registered successfully", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to Create User" });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) return res.status(401).json({ message: "Invalid credentials!" });

        // Check if password is correct
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: "Invalid credentials!" });

        // Generate a token and send it to the user
        const age = 1000 * 60 * 60 * 24 * 7; // 7 days
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: age });

        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to login" });
    }
}

export const getUserInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, email: true, name: true, role: true }
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch user info" });
    }
}

export const logout = (req, res) => {
    res.clearCookie("token").status(200).json({ message: "User logged out successfully" });
    console.log("logout endpoint works!");
}