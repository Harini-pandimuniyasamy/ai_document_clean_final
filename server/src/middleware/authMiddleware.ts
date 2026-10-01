import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { connectDB } from '../config/db';

export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  id: string;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // 1. Check Authorization header (Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && typeof req.query.token === 'string') {
    // 2. Also support token in query param for direct browser file download/preview links
    token = req.query.token;
  }

  await connectDB();

  // If token is provided, verify against MongoDB
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || process.env.JWT_TOKEN || 'docuclean_ai_production_secret_key_2026';
      const decoded = jwt.verify(token, secret) as JwtPayload;

      const user = await User.findById(decoded.id).select('-password -passwordHash');
      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      // If explicit token was provided but invalid/expired, reject with 401
      res.status(401).json({
        success: false,
        message: 'Not authorized, token is invalid or expired',
      });
      return;
    }
  }



  res.status(401).json({
    success: false,
    message: 'Not authorized, please register or log in.',
  });
};
