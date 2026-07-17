import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getAuth } from '../config/auth';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'aetheris-super-secret-key-1298473';

const generateToken = (id: string, email: string, role: string) => {
  return jwt.sign({ id, email, role }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

export async function registerUser(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Please provide all required fields (name, email, password)' });
    return;
  }

  try {
    console.log(`[Better Auth] Registering user: ${email}`);
    const auth = await getAuth();
    if (!auth) {
      res.status(500).json({ message: 'Authentication service is not configured or failed to initialize.' });
      return;
    }
    const response = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    const userProfile = response.user;
    res.status(201).json({
      token: generateToken(userProfile.id, userProfile.email, 'user'),
      user: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: 'user',
      },
    });
  } catch (error: any) {
    console.error('Better Auth registration failed:', error);
    res.status(400).json({ message: error.message || 'Better Auth registration failed' });
  }
}

export async function loginUser(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Please provide email and password' });
    return;
  }

  try {
    console.log(`[Better Auth] Authenticating user: ${email}`);
    const auth = await getAuth();
    if (!auth) {
      res.status(500).json({ message: 'Authentication service is not configured or failed to initialize.' });
      return;
    }
    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    const userProfile = response.user;
    res.json({
      token: generateToken(userProfile.id, userProfile.email, 'user'),
      user: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: 'user',
      },
    });
  } catch (error: any) {
    console.error('Better Auth authentication failed:', error);
    res.status(401).json({ message: error.message || 'Invalid credentials' });
  }
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { name, email, googleId } = req.body;

  if (!email || !googleId) {
    res.status(400).json({ message: 'Missing Google credentials' });
    return;
  }

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || 'Google User',
        email,
        googleId,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    res.json({
      token: generateToken(user._id.toString(), user.email, user.role),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error during Google auth', error: error.message });
  }
}
