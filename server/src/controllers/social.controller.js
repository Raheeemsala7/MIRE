const socialService = require('../services/social.service');
const ApiResponse = require('../utils/apiResponse');

class SocialController {
  async getConversations(req, res, next) {
    try {
      const { conversations, total, page, limit } = await socialService.getConversations(req.query);
      return ApiResponse.paginated(res, {
        message: 'Conversations fetched successfully',
        data: conversations,
        page,
        limit,
        total
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const result = await socialService.getConversationMessages(req.params.id);
      return ApiResponse.success(res, {
        message: 'Messages fetched successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async sendReply(req, res, next) {
    try {
      const message = await socialService.sendReply({
        conversationId: req.params.id,
        text: req.body.text,
        mediaUrl: req.body.mediaUrl,
        mediaType: req.body.mediaType,
        agentId: req.user._id
      });
      return ApiResponse.created(res, {
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  async updateConversation(req, res, next) {
    try {
      const conversation = await socialService.updateConversation(req.params.id, req.body);
      return ApiResponse.success(res, {
        message: 'Conversation updated',
        data: conversation
      });
    } catch (error) {
      next(error);
    }
  }

  async convertToOrder(req, res, next) {
    try {
      const order = await socialService.convertToOrder(req.params.id, req.body, req.user._id);
      return ApiResponse.created(res, {
        message: 'Order created from conversation',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async linkCustomer(req, res, next) {
    try {
      const conversation = await socialService.linkCustomer(req.params.id, req.body.customerId);
      return ApiResponse.success(res, {
        message: 'Customer linked to conversation',
        data: conversation
      });
    } catch (error) {
      next(error);
    }
  }

  async getSocialAccounts(req, res, next) {
    try {
      const accounts = await socialService.getSocialAccounts();
      return ApiResponse.success(res, {
        message: 'Connected social accounts',
        data: accounts
      });
    } catch (error) {
      next(error);
    }
  }

  async connectSocialAccount(req, res, next) {
    try {
      const account = await socialService.connectSocialAccount(req.body);
      return ApiResponse.success(res, {
        message: 'Social account connected successfully',
        data: account
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SocialController();
