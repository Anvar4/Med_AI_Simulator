import dotenv from 'dotenv';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import app from '../src/app';

dotenv.config()

let connectPromise: Promise<typeof mongoose> | null = null

function ensureDbConnection(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose)
  }

  if (!connectPromise) {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('MONGODB_URI topilmadi. Vercel env ga MONGODB_URI kiriting.')
    }
    connectPromise = mongoose.connect(mongoUri)
  }

  return connectPromise
}

export default async function handler(req: Request, res: Response) {
  await ensureDbConnection()
  return app(req, res)
}
