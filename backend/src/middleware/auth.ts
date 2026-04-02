import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { IUser, User } from '../models/User'

export interface AuthRequest extends Request {
  user?: IUser
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      res.status(401).json({ message: 'Avtorizatsiyadan o\'tilmagan' })
      return
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
    const user = await User.findById(decoded.id)

    if (!user) {
      res.status(401).json({ message: 'Foydalanuvchi topilmadi' })
      return
    }

    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Token yaroqsiz' })
  }
}

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Ruxsat berilmagan' })
      return
    }
    next()
  }
}
