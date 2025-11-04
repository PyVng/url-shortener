// Simple JWT authentication for Vercel deployment
const jwt = require('jsonwebtoken');

class SimpleAuth {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.users = new Map(); // In-memory user storage for demo
    this.initializeDemoUsers();
  }

  initializeDemoUsers() {
    // Create demo users for testing
    this.users.set('demo@example.com', {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      password: this.hashPassword('demo123')
    });

    this.users.set('test@example.com', {
      id: '2', 
      email: 'test@example.com',
      name: 'Test User',
      password: this.hashPassword('test123')
    });
  }

  hashPassword(password) {
    // Simple hash for demo (in production, use bcrypt)
    return Buffer.from(password + this.JWT_SECRET).toString('base64');
  }

  verifyPassword(password, hashedPassword) {
    return this.hashPassword(password) === hashedPassword;
  }

  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name
      },
      this.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  async register(email, password, name = null) {
    // Check if user already exists
    if (this.users.has(email)) {
      throw new Error('Пользователь уже существует');
    }

    const user = {
      id: Date.now().toString(),
      email,
      name: name || email.split('@')[0],
      password: this.hashPassword(password)
    };

    this.users.set(email, user);
    
    const token = this.generateToken(user);
    return { user, token };
  }

  async login(email, password) {
    const user = this.users.get(email);
    
    if (!user || !this.verifyPassword(password, user.password)) {
      throw new Error('Неверный email или пароль');
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  async logout(token) {
    // In a real implementation, you might want to blacklist tokens
    // For now, just return success
    return { success: true };
  }

  async getCurrentUser(token) {
    const decoded = this.verifyToken(token);
    if (!decoded) {
      return null;
    }

    const user = this.users.get(decoded.email);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name
    };
  }

  // Middleware for Express
  requireAuth() {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Требуется аутентификация'
        });
      }

      const token = authHeader.substring(7);
      const user = this.verifyToken(token);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Недействительный токен'
        });
      }

      req.user = user;
      next();
    };
  }

  // Optional auth middleware
  optionalAuth() {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
      }

      const token = authHeader.substring(7);
      const user = this.verifyToken(token);
      
      req.user = user || null;
      next();
    };
  }
}

// Create singleton instance
const simpleAuth = new SimpleAuth();

module.exports = simpleAuth;
