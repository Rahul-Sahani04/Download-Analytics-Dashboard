import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key';
const JWT_REFRESH_SECRET = 'your-refresh-secret-key';

// In-memory storage
const users = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'password',
    name: 'Admin User',
    role: 'admin',
    refreshToken: null as string | null,
  },
  {
    id: '2',
    email: 'faculty@example.com',
    password: 'password',
    name: 'Faculty User',
    role: 'faculty',
    refreshToken: null as string | null,
  },
];

// Token blacklist for logged out tokens
const tokenBlacklist = new Set<string>();

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Save refresh token
    user.refreshToken = refreshToken;

    // Return user info and tokens
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    tokenBlacklist.add(token);

    // Clear refresh token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = users.find(u => u.id === decoded.userId);
    if (user) {
      user.refreshToken = null;
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    const user = users.find(u => u.id === decoded.userId && u.refreshToken === refreshToken);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// Middleware to verify token is not blacklisted
export const checkTokenBlacklist = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ error: 'Token has been invalidated' });
    }
  }
  next();
};