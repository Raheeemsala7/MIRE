const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

const recordAudit = async ({
  action,
  entityType,
  entityId,
  performedBy = null,
  previousState = null,
  newState = null,
  details = null,
  req = null
}) => {
  try {
    const ipAddress = req ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '' : '';
    const userAgent = req ? req.headers['user-agent'] || '' : '';

    await AuditLog.create({
      action,
      entityType,
      entityId,
      performedBy: performedBy || req?.user?._id || null,
      previousState,
      newState,
      details,
      ipAddress,
      userAgent
    });
  } catch (error) {
    logger.error('Failed to record audit log', error);
  }
};

module.exports = { recordAudit };
