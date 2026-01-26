import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Role from '../models/Role';

// Extend Express Request interface to include user data
export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async ( // ✅ FIX: mark as async
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || 'maritime_secret_key'
    );

    // 🔒 HYDRATE USER FROM DATABASE (CRITICAL FIX)
    const user = await User.findByPk(decoded.id, {
      attributes: [
        'id',
        'email',
        'company_id',
        'role_id',
        'department',
        'vessel_id'
      ],
      include: [
        { model: Role, as: 'role', attributes: ['name'] }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Normalize shape (keeps existing usage intact)
    req.user = {
      id: user.id,
      email: user.email,
      company_id: user.company_id,
      department: user.department,
      vessel_id: user.vessel_id,
      role: user.role?.name
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};
