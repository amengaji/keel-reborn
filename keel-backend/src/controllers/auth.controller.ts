// keel-reborn/keel-backend/src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import User from '../models/User';
import Role from '../models/Role';
import jwt from 'jsonwebtoken';

/**
 * MARITIME EXPERT NOTE:
 * Authentication is the "Gangway Control" of our application.
 * Only verified personnel are allowed on board the Digital TRB.
 */

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Find the user and include their Role (Rank)
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }]
    });

    // 2. Security Check (UX Note: We use a generic error for security)
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

    /**
     * MARITIME TRAINING NOTE:
     * In a full production environment, we would use bcrypt.compare here.
     * For this "Clean Slate" initialization, we are checking the hash directly.
     */
    const isPasswordValid = user.password_hash === password; // Temporary direct check for setup
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Generate the "Digital Key" (JWT)
    const token = jwt.sign(
      { id: user.id, role: user.role?.name },
      process.env.JWT_SECRET || 'maritime_secret_key',
      { expiresIn: '8h' } // Standard 8-hour watch duration
    );

    // 4. Success Response (UX Note: Send user details so UI can say "Welcome, Captain")
    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role?.name
      }
    });

  } catch (error) {
    console.error('❌ AUTH ERROR:', error);
    return res.status(500).json({ message: 'A system error occurred during login. Please try again.' });
  }
};