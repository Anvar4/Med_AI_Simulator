import mongoose, { Document, Schema } from 'mongoose'

/**
 * A support request submitted via the Telegram support bot
 * (@Med_AI_Simulator_Supportbot). Each message from a user becomes a ticket the
 * admin panel can triage. If the Telegram user is linked to a site account
 * (matched by telegramId), `user` is populated so the admin can view/edit them.
 */
export type TicketStatus = 'open' | 'in_progress' | 'resolved'

export interface ITicketAttachment {
  type: 'photo' | 'document'
  fileId: string        // Telegram file_id (used to re-send/serve)
  fileName?: string
  caption?: string
}

export interface ITicketReply {
  fromAdmin: boolean
  text: string
  createdAt: Date
}

export interface ISupportTicket extends Document {
  // Telegram identity of the requester
  telegramId: string
  telegramUsername?: string
  telegramName?: string
  chatId: string
  // Linked site account, if matched by telegramId
  user?: mongoose.Types.ObjectId
  category?: string            // optional FAQ/topic category chosen in the bot
  message: string
  attachments: ITicketAttachment[]
  status: TicketStatus
  replies: ITicketReply[]
  resolvedBy?: mongoose.Types.ObjectId
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const attachmentSchema = new Schema<ITicketAttachment>(
  {
    type: { type: String, enum: ['photo', 'document'], required: true },
    fileId: { type: String, required: true },
    fileName: { type: String },
    caption: { type: String },
  },
  { _id: false }
)

const replySchema = new Schema<ITicketReply>(
  {
    fromAdmin: { type: Boolean, default: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    telegramId: { type: String, required: true, index: true },
    telegramUsername: { type: String },
    telegramName: { type: String },
    chatId: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    category: { type: String },
    message: { type: String, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
    status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open', index: true },
    replies: { type: [replySchema], default: [] },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
)

supportTicketSchema.index({ status: 1, createdAt: -1 })

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema)
