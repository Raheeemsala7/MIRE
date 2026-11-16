const { Conversation, ConversationStatuses } = require('../models/Conversation');
const Message = require('../models/Message');
const Customer = require('../models/Customer');
const SocialAccount = require('../models/SocialAccount');
const Notification = require('../models/Notification');
const whatsappService = require('../integrations/whatsapp/whatsapp.service');
const instagramService = require('../integrations/instagram/instagram.service');
const facebookService = require('../integrations/facebook/facebook.service');
const orderService = require('./order.service');
const ApiError = require('../utils/apiError');
const { getIO } = require('../config/socket');
const { getPaginationOptions } = require('../utils/pagination');

class SocialService {
  /**
   * Normalized incoming message ingestion (Meta Webhook)
   */
  async handleIncomingMessage({ platform, senderId, recipientId, text, mediaUrl = '', mediaType = '', raw = null, customerName = '' }) {
    // 1. Find or create conversation
    let conversation = await Conversation.findOne({ platform, externalUserId: senderId });

    if (!conversation) {
      // Find matching customer by phone if platform is WhatsApp
      let customer = null;
      if (platform === 'WHATSAPP') {
        customer = await Customer.findOne({ phone: { $regex: senderId.slice(-9) } });
      }

      conversation = await Conversation.create({
        platform,
        externalUserId: senderId,
        customer: customer?._id || null,
        customerName: customer?.fullName || customerName || `Customer (${senderId.slice(-4)})`,
        customerPhone: platform === 'WHATSAPP' ? senderId : customer?.phone || '',
        status: ConversationStatuses.OPEN,
        unreadCount: 1,
        lastMessageText: text || `[${mediaType || 'Media Attachment'}]`,
        lastMessageAt: new Date()
      });
    } else {
      conversation.status = ConversationStatuses.OPEN;
      conversation.unreadCount += 1;
      conversation.lastMessageText = text || `[${mediaType || 'Media Attachment'}]`;
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    // 2. Store Normalized Message
    const message = await Message.create({
      conversation: conversation._id,
      platform,
      direction: 'INCOMING',
      senderId,
      recipientId,
      messageType: mediaUrl ? (mediaType.toUpperCase() === 'IMAGE' ? 'IMAGE' : 'DOCUMENT') : 'TEXT',
      content: text || '',
      mediaUrl,
      mediaType,
      status: 'DELIVERED',
      rawPayload: raw
    });

    // 3. Emit real-time notification to staff
    const io = getIO();
    io.emit('social:message_received', {
      conversationId: conversation._id,
      message,
      conversation
    });

    await Notification.create({
      type: 'NEW_MESSAGE',
      title: `New ${platform} Message`,
      message: `${conversation.customerName}: ${text ? text.slice(0, 60) : 'Attachment'}`,
      recipientRole: 'CUSTOMER_SUPPORT',
      entityType: 'Conversation',
      entityId: conversation._id
    });

    return { conversation, message };
  }

  /**
   * Send an outgoing agent reply
   */
  async sendReply({ conversationId, text, mediaUrl = '', mediaType = '', agentId }) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound('Conversation not found');

    let sendResult = null;
    const recipient = conversation.externalUserId;

    // Route to appropriate Meta integration service
    if (conversation.platform === 'WHATSAPP') {
      if (mediaUrl) {
        sendResult = await whatsappService.sendMediaMessage(recipient, mediaUrl, text, mediaType || 'image');
      } else {
        sendResult = await whatsappService.sendTextMessage(recipient, text);
      }
    } else if (conversation.platform === 'INSTAGRAM') {
      sendResult = await instagramService.sendTextMessage(recipient, text);
    } else if (conversation.platform === 'FACEBOOK') {
      sendResult = await facebookService.sendTextMessage(recipient, text);
    }

    const message = await Message.create({
      conversation: conversation._id,
      platform: conversation.platform,
      direction: 'OUTGOING',
      senderId: 'BUSINESS_AGENT',
      recipientId: recipient,
      messageType: mediaUrl ? 'IMAGE' : 'TEXT',
      content: text,
      mediaUrl,
      mediaType,
      status: 'SENT',
      sentBy: agentId,
      rawPayload: sendResult
    });

    conversation.lastMessageText = text || `[Sent ${mediaType || 'Media'}]`;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const io = getIO();
    io.emit('social:message_sent', { conversationId: conversation._id, message });

    return message;
  }

  /**
   * List paginated conversations with filters
   */
  async getConversations(query = {}) {
    const { page, limit, skip, sort } = getPaginationOptions(query);
    const filter = {};

    if (query.platform) filter.platform = query.platform;
    if (query.status) filter.status = query.status;
    if (query.assignedEmployee) filter.assignedEmployee = query.assignedEmployee;
    if (query.search) {
      filter.$or = [
        { customerName: { $regex: query.search, $options: 'i' } },
        { customerPhone: { $regex: query.search, $options: 'i' } },
        { externalUserId: { $regex: query.search, $options: 'i' } },
        { lastMessageText: { $regex: query.search, $options: 'i' } }
      ];
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate('customer', 'fullName phone email totalOrders')
        .populate('assignedEmployee', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Conversation.countDocuments(filter)
    ]);

    return { conversations, total, page, limit };
  }

  /**
   * Get single conversation with full message thread
   */
  async getConversationMessages(conversationId) {
    const conversation = await Conversation.findById(conversationId)
      .populate('customer')
      .populate('assignedEmployee', 'name email role')
      .populate('linkedOrders', 'orderNumber status pricing.totalAmount createdAt');

    if (!conversation) throw ApiError.notFound('Conversation not found');

    // Mark as read
    if (conversation.unreadCount > 0) {
      conversation.unreadCount = 0;
      await conversation.save();
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sentBy', 'name role')
      .sort({ createdAt: 1 });

    return { conversation, messages };
  }

  /**
   * Update conversation status or assignee
   */
  async updateConversation(id, { status, assignedEmployee, tags }) {
    const conversation = await Conversation.findById(id);
    if (!conversation) throw ApiError.notFound('Conversation not found');

    if (status) conversation.status = status;
    if (assignedEmployee !== undefined) conversation.assignedEmployee = assignedEmployee;
    if (tags) conversation.tags = tags;

    await conversation.save();
    return conversation;
  }

  /**
   * Convert conversation to Order (Section 11 requirement)
   */
  async convertToOrder(conversationId, orderPayload, performedBy) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound('Conversation not found');

    const order = await orderService.createManualOrder({
      ...orderPayload,
      source: conversation.platform,
      sourceConversationId: conversation._id,
      performedBy
    });

    conversation.linkedOrders.push(order._id);
    await conversation.save();

    return order;
  }

  /**
   * Link conversation to Customer
   */
  async linkCustomer(conversationId, customerId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound('Conversation not found');

    const customer = await Customer.findById(customerId);
    if (!customer) throw ApiError.notFound('Customer not found');

    conversation.customer = customer._id;
    conversation.customerName = customer.fullName;
    conversation.customerPhone = customer.phone;
    await conversation.save();

    return conversation;
  }

  /**
   * Social Accounts Management (Settings)
   */
  async getSocialAccounts() {
    return SocialAccount.find();
  }

  async connectSocialAccount(data) {
    const existing = await SocialAccount.findOne({ identifier: data.identifier });
    if (existing) {
      Object.assign(existing, data);
      existing.status = 'CONNECTED';
      return existing.save();
    }
    return SocialAccount.create(data);
  }
}

module.exports = new SocialService();
