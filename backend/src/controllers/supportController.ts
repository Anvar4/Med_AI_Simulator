import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { SupportTicket } from '../models/SupportTicket'
import { sendSupportReply } from '../services/supportBot'

/**
 * GET /api/admin/support/stats — ticket counts by status for the dashboard.
 */
export const getSupportStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, open, inProgress, resolved] = await Promise.all([
      SupportTicket.countDocuments({}),
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
    ])
    res.json({
      status: 'success',
      stats: { total, open, inProgress, resolved, pending: open + inProgress },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

/**
 * GET /api/admin/support/tickets?status=&page= — paginated ticket list.
 */
export const getSupportTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1' } = req.query
    const filter: Record<string, unknown> = {}
    if (status && ['open', 'in_progress', 'resolved'].includes(status as string)) {
      filter.status = status
    }
    const pageNum = Math.max(1, parseInt(page as string))
    const limit = 20

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('user', 'name email username phone avatar isPremium role')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limit)
        .limit(limit),
      SupportTicket.countDocuments(filter),
    ])

    res.json({
      status: 'success',
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: pageNum,
      tickets,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

/**
 * PATCH /api/admin/support/tickets/:id — change status.
 * body: { status: 'open' | 'in_progress' | 'resolved' }
 */
export const updateTicketStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status?: string }
    if (!status || !['open', 'in_progress', 'resolved'].includes(status)) {
      res.status(400).json({ message: 'Noto\'g\'ri holat' })
      return
    }
    const update: Record<string, unknown> = { status }
    if (status === 'resolved') {
      update.resolvedBy = req.user!._id
      update.resolvedAt = new Date()
    }
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name email username phone avatar isPremium role')
    if (!ticket) { res.status(404).json({ message: 'Murojaat topilmadi' }); return }
    res.json({ status: 'success', ticket })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

/**
 * POST /api/admin/support/tickets/:id/reply — reply to the user via the bot.
 * body: { text: string }
 */
export const replyToTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body as { text?: string }
    if (!text || !text.trim()) { res.status(400).json({ message: 'Javob matni bo\'sh' }); return }

    const ticket = await SupportTicket.findById(req.params.id)
    if (!ticket) { res.status(404).json({ message: 'Murojaat topilmadi' }); return }

    const delivered = await sendSupportReply(ticket.chatId, text.trim())

    ticket.replies.push({ fromAdmin: true, text: text.trim(), createdAt: new Date() })
    if (ticket.status === 'open') ticket.status = 'in_progress'
    await ticket.save()

    const populated = await ticket.populate('user', 'name email username phone avatar isPremium role')
    res.json({
      status: 'success',
      delivered,
      message: delivered ? 'Javob yuborildi' : 'Javob saqlandi (bot orqali yetkazib bo\'lmadi)',
      ticket: populated,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}

/**
 * DELETE /api/admin/support/tickets/:id — remove a ticket.
 */
export const deleteTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id)
    if (!ticket) { res.status(404).json({ message: 'Murojaat topilmadi' }); return }
    res.json({ status: 'success', message: 'Murojaat o\'chirildi' })
  } catch (error) {
    res.status(500).json({ message: 'Server xatosi', error })
  }
}
