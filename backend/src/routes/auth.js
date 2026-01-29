const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple token generator (use JWT in production)
const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        timestamp: Date.now()
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
};

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user in database
        let user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // If user doesn't exist, create a default one (for demo purposes)
        if (!user) {
            // Create default users if this is first login attempt
            const defaultUsers = [
                { email: 'admin@hrassist.com', password: 'admin123', name: 'Admin User', role: 'admin' },
                { email: 'user@hrassist.com', password: 'user123', name: 'Regular User', role: 'user' }
            ];

            for (const defaultUser of defaultUsers) {
                await prisma.user.upsert({
                    where: { email: defaultUser.email },
                    update: {},
                    create: defaultUser
                });
            }

            // Try to find user again
            user = await prisma.user.findUnique({
                where: { email: email.toLowerCase() }
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password (in production, use bcrypt.compare)
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user);

        // Return success response
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and name are required'
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create new user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password, // In production, hash with bcrypt
                name,
                role: 'user'
            }
        });

        // Generate token
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Verify token endpoint
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Decode token
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());

        // Check if token is expired (24 hours)
        const tokenAge = Date.now() - decoded.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (tokenAge > maxAge) {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    // In a real application, you might want to invalidate the token
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
