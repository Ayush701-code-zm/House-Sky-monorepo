const BulkBuyInquiry = require('../models/BulkBuyInquiry');
const Property = require('../models/Property');

const MIN_BULK_UNITS = BulkBuyInquiry.MIN_BULK_UNITS;
const MAX_BULK_UNITS = BulkBuyInquiry.MAX_BULK_UNITS;
const BULK_BUY_STATUSES = BulkBuyInquiry.BULK_BUY_STATUSES;
const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

function toUnitCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return MIN_BULK_UNITS;
  return Math.min(MAX_BULK_UNITS, Math.max(MIN_BULK_UNITS, Math.round(parsed)));
}

exports.createPublicBulkBuy = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      unitCount,
      budgetRange,
      propertyType,
      city,
      state,
      propertyId,
      propertyTitle,
      message
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone number are required' });
    }

    let resolvedTitle = String(propertyTitle || '').trim();
    let resolvedPropertyId = null;
    if (propertyId && OBJECT_ID_RE.test(String(propertyId))) {
      const property = await Property.findById(propertyId).select('title');
      if (property) {
        resolvedPropertyId = property._id;
        if (!resolvedTitle) resolvedTitle = property.title;
      }
    }

    const inquiry = await BulkBuyInquiry.create({
      name: String(name).trim(),
      email: String(email || '').trim(),
      phone: String(phone).trim(),
      unitCount: toUnitCount(unitCount),
      budgetRange: String(budgetRange || '').trim(),
      propertyType: String(propertyType || '').trim(),
      city: String(city || '').trim(),
      state: String(state || '').trim(),
      propertyId: resolvedPropertyId,
      propertyTitle: resolvedTitle,
      message: String(message || '').trim(),
      status: 'NEW',
      source: 'PROPERTIES_PAGE'
    });

    res.status(201).json({
      message: 'Thank you. Our desk will call you about the bulk purchase.',
      inquiryId: inquiry._id
    });
  } catch (error) {
    next(error);
  }
};

exports.getBulkBuyInquiries = async (req, res, next) => {
  try {
    const inquiries = await BulkBuyInquiry.find()
      .populate('propertyId', 'title slug city location')
      .populate({
        path: 'assignedAgentId',
        populate: { path: 'userId', select: 'fullName email phone' }
      })
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    next(error);
  }
};

exports.updateBulkBuyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedAgentId } = req.body;
    const inquiry = await BulkBuyInquiry.findById(id);
    if (!inquiry) return res.status(404).json({ message: 'Bulk buy inquiry not found' });

    if (status) {
      if (!BULK_BUY_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      inquiry.status = status;
    }
    if (assignedAgentId !== undefined) inquiry.assignedAgentId = assignedAgentId || null;
    await inquiry.save();
    res.json({ message: 'Bulk buy inquiry updated', inquiry });
  } catch (error) {
    next(error);
  }
};
