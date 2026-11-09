import { Router } from 'express';
import User from '../models/User.js';
import { authRequired, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {};
    if (
      !email ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      !password ||
      password.length < 8 ||
      !name?.trim()
    ) {
      return res.status(400).json({
        error: 'Provide a valid email, name, and password of at least 8 characters',
      });
    }
    const normalized = email.trim().toLowerCase();
    if (await User.exists({ email: normalized })) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const user = await User.create({
      email: normalized,
      name: name.trim(),
      passwordHash: await User.hashPassword(password),
    });
    return res.status(201).json({ token: signToken(user._id), user: user.toSafeJSON() });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });
    if (!user || !(await user.comparePassword(password || ''))) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }
    res.json({ token: signToken(user._id), user: user.toSafeJSON() });
  } catch (e) {
    next(e);
  }
});

router.get('/me', authRequired, (req, res) => res.json(req.user.toSafeJSON()));

export default router;