import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { userService } from '../services/user.service.js';
import type { PlanCode } from '../db/types.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        planCode: PlanCode;
      };
    }
  }
}

// Cache for JWKS
let jwksCache: jose.JWTVerifyGetKey | null = null;
let jwksCacheTime = 0;
const JWKS_CACHE_TTL = 3600000; // 1 hour

/**
 * Get JWKS from Supabase
 */
async function getJWKS(): Promise<jose.JWTVerifyGetKey> {
  const now = Date.now();
  
  if (jwksCache && (now - jwksCacheTime) < JWKS_CACHE_TTL) {
    return jwksCache;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }

  const jwksUrl = new URL('/.well-known/jwks.json', supabaseUrl);
  jwksCache = jose.createRemoteJWKSet(jwksUrl);
  jwksCacheTime = now;

  return jwksCache;
}

/**
 * Verify JWT token using Supabase JWKS
 */
async function verifyToken(token: string): Promise<jose.JWTPayload> {
  const jwks = await getJWKS();
  
  const { payload } = await jose.jwtVerify(token, jwks, {
    issuer: `${process.env.SUPABASE_URL}/auth/v1`,
    audience: 'authenticated',
  });

  return payload;
}

/**
 * Alternative: Verify JWT using SUPABASE_JWT_SECRET (HS256)
 * Use this if JWKS endpoint is not available
 */
async function verifyTokenWithSecret(token: string): Promise<jose.JWTPayload> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET is not configured');
  }

  const secretKey = new TextEncoder().encode(secret);
  
  const { payload } = await jose.jwtVerify(token, secretKey, {
    algorithms: ['HS256'],
  });

  return payload;
}

/**
 * Auth Middleware
 * - Reads Authorization: Bearer <token>
 * - Verifies token with Supabase JWKS
 * - Links supabase_uid with users table (creates user if not exists)
 * - Adds req.user with { id, email, planCode }
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    let payload: jose.JWTPayload;
    
    try {
      // Try JWKS first
      payload = await verifyToken(token);
    } catch (jwksError) {
      // Fallback to JWT secret
      try {
        payload = await verifyTokenWithSecret(token);
      } catch (secretError) {
        console.error('Token verification failed:', jwksError, secretError);
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
        return;
      }
    }

    // Extract user info from token
    const supabaseUid = payload.sub;
    const email = payload.email as string | undefined;

    if (!supabaseUid || !email) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token payload',
      });
      return;
    }

    // Get or create user in our database
    const user = await userService.getOrCreateUser({
      supabaseUid,
      email,
      name: (payload.user_metadata as Record<string, unknown>)?.name as string | undefined,
    });

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      planCode: user.planCode,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Optional Auth Middleware
 * Same as authMiddleware but doesn't fail if no token is provided
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  // If token is provided, verify it
  await authMiddleware(req, res, next);
}
