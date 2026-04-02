import { NextFunction, Request, Response } from 'express'

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message)

  if (err.name === 'ValidationError') {
    res.status(400).json({ message: 'Validatsiya xatosi', error: err.message })
    return
  }

  if (err.name === 'CastError') {
    res.status(400).json({ message: 'Noto\'g\'ri ID formati' })
    return
  }

  if ((err as any).code === 11000) {
    res.status(400).json({ message: 'Bu ma\'lumot allaqachon mavjud' })
    return
  }

  res.status(500).json({
    message: 'Server xatosi',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  })
}
