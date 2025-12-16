import User from '../models/User';
import { generateToken, generateRefreshToken } from '../utils/jwt';

export const createUser = async (userData: any) => {
  const user = await User.create(userData);
  // @ts-ignore
  const token = generateToken(user._id.toString(), user.role);
  // @ts-ignore
  const refreshToken = generateRefreshToken(user._id.toString());
  // @ts-ignore
  user.refreshToken = refreshToken;
  // @ts-ignore
  await user.save();
  
  return { user, token, refreshToken };
};

export const authenticateUser = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  const token = generateToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());
  
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();
  
  return { user, token, refreshToken };
};