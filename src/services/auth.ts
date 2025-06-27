import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthToken {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

class AuthService {
  private users: Map<string, User> = new Map();

  constructor() {
    // Create default admin user
    this.createDefaultAdmin();
  }

  private async createDefaultAdmin(): Promise<void> {
    const adminId = 'admin-1';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    
    const passwordHash = await bcrypt.hash(defaultPassword, config.auth.bcryptRounds);
    
    const adminUser: User = {
      id: adminId,
      username: 'admin',
      passwordHash,
      role: 'admin',
      createdAt: new Date(),
    };

    this.users.set(adminId, adminUser);
  }

  async authenticate(username: string, password: string): Promise<string | null> {
    const user = Array.from(this.users.values()).find(u => u.username === username);
    
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate JWT token
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    
    const token = jwt.sign(payload, config.auth.jwtSecret, { 
      expiresIn: config.auth.tokenExpiry 
    } as jwt.SignOptions);

    return token;
  }

  verifyToken(token: string): AuthToken | null {
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as AuthToken;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async createUser(username: string, password: string, role: 'admin' | 'user' = 'user'): Promise<User | null> {
    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find(u => u.username === username);
    if (existingUser) {
      return null;
    }

    const userId = `user-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, config.auth.bcryptRounds);

    const newUser: User = {
      id: userId,
      username,
      passwordHash,
      role,
      createdAt: new Date(),
    };

    this.users.set(userId, newUser);
    return newUser;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values()).map(user => ({
      ...user,
      passwordHash: '[REDACTED]' // Don't expose password hashes
    } as User));
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return false;
    }

    user.passwordHash = await bcrypt.hash(newPassword, config.auth.bcryptRounds);
    return true;
  }

  deleteUser(userId: string): boolean {
    // Don't allow deleting the admin user
    const user = this.users.get(userId);
    if (!user || user.username === 'admin') {
      return false;
    }

    return this.users.delete(userId);
  }
}

export const authService = new AuthService(); 