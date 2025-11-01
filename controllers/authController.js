const { supabase, supabaseAdmin } = require('../db/supabase');

class AuthController {
  // Регистрация пользователя
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: 'Authentication service not configured'
        });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Вход пользователя
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: 'Authentication service not configured'
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }

      res.json({
        success: true,
        data: {
          user: data.user,
          session: data.session
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Выход пользователя
  async logout(req, res) {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: 'Authentication service not configured'
        });
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Получение текущего пользователя
  async getCurrentUser(req, res) {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: 'Authentication service not configured'
        });
      }

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Обновление профиля пользователя
  async updateProfile(req, res) {
    try {
      const { name } = req.body;

      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: 'Authentication service not configured'
        });
      }

      const { data, error } = await supabase.auth.updateUser({
        data: { name }
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.json({
        success: true,
        data: { user: data.user }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Middleware для проверки аутентификации
  async requireAuth(req, res, next) {
    try {
      if (!supabase) {
        return res.status(503).json({
          success: false,
          error: 'Authentication service not configured'
        });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No authorization token provided'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify the JWT token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  }
}

module.exports = new AuthController();
