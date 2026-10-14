const SystemSetting = require('../models/SystemSetting');

const DEFAULT_ANNOUNCEMENT = 'महत्वपूर्ण सूचना: धोलरा SIR एवं नोएडा स्मार्ट सिटी टाउनशिप में नए प्लॉट्स की रजिस्ट्री चालू है। साइट विज़िट बुक करने के लिए संपर्क करें: +91 93112 27789 | व्हाट्सएप: +91 92899 27527';


const DEFAULTS = {
  ANNOUNCEMENT_TICKER: {
    value: DEFAULT_ANNOUNCEMENT,
    jsonValue: { isActive: true }
  },
  COMPANY_INFO: {
    value: 'House & Sky Enterprise Advisory',
    jsonValue: {
      companyName: 'House & Sky Enterprise Advisory',
      tagline: 'Premium Real Estate & Township Investments',
      phone: '+91 93112 27789',
      whatsapp: '+91 92899 27527',
      email: 'info@houseandskyenterprise.com',
      address: 'India',
      gstNumber: '',
      reraNumber: '',
      website: ''
    }
  },
  COMMISSION_CONFIG: {
    value: 'commission_config',
    jsonValue: {
      enableAutoCommission: true,
      enableWhatsappAlerts: true,
      enableEmailAlerts: true,
      defaultCommissionPercent: 2,
      gstOnCommission: 18
    }
  },
  MLM_CONFIG: {
    value: 'mlm_config',
    jsonValue: {
      maxLegDepth: 10,
      minSalesForRankUp: 1,
      autoRankPromotion: false
    }
  },
  FRONTEND_STATS: {
    value: 'frontend_stats',
    jsonValue: {
      projectsCount: '2 Projects',
      advisorsCount: '45+ Team',
      locationsCount: '6 Enclaves',
      revenue: '₹120 Cr+'
    }
  }
};

/**
 * Helper — get or create a setting with default values
 */
async function getOrCreate(key) {
  let setting = await SystemSetting.findOne({ key });
  if (!setting) {
    const def = DEFAULTS[key] || { value: '', jsonValue: null, isActive: true };
    setting = await SystemSetting.create({
      key,
      value: def.value || '',
      jsonValue: def.jsonValue || null,
      isActive: true
    });
  }
  return setting;
}


exports.getAnnouncement = async (req, res, next) => {
  try {
    const setting = await getOrCreate('ANNOUNCEMENT_TICKER');
    res.json({
      announcement: setting.value || DEFAULT_ANNOUNCEMENT,
      isActive: setting.jsonValue?.isActive !== false
    });
  } catch (error) {
    next(error);
  }
};

exports.getFrontendStats = async (req, res, next) => {
  try {
    const setting = await getOrCreate('FRONTEND_STATS');
    res.json(setting.jsonValue || DEFAULTS.FRONTEND_STATS.jsonValue);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// ADMIN — All Settings
// ─────────────────────────────────────────

/**
 * GET /admin/settings
 * Returns all settings as a structured object for the admin panel.
 */
exports.getAllSettings = async (req, res, next) => {
  try {
    const keys = Object.keys(DEFAULTS);
    const results = await Promise.all(keys.map((k) => getOrCreate(k)));

    const output = {};
    results.forEach((s) => {
      output[s.key] = {
        value: s.value,
        jsonValue: s.jsonValue,
        isActive: s.isActive,
        updatedAt: s.updatedAt
      };
    });

    res.json(output);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/settings
 * Bulk-update any number of settings in one call.
 * Body: { ANNOUNCEMENT_TICKER: { value, jsonValue }, COMPANY_INFO: { jsonValue }, ... }
 */
exports.updateAllSettings = async (req, res, next) => {
  try {
    const updates = req.body && typeof req.body === 'object' ? req.body : {}; // { KEY: { value?, jsonValue?, isActive? } }
    const results = {};

    for (const [key, payload] of Object.entries(updates)) {
      if (!payload || typeof payload !== 'object') continue;
      let setting = await SystemSetting.findOne({ key });
      if (!setting) {
        const def = DEFAULTS[key] || { value: '', jsonValue: null };
        setting = new SystemSetting({ key, value: def.value, jsonValue: def.jsonValue });
      }
      if (payload.value !== undefined) setting.value = String(payload.value ?? '');
      if (payload.jsonValue !== undefined) setting.jsonValue = payload.jsonValue;
      if (payload.isActive !== undefined) setting.isActive = payload.isActive;
      await setting.save();
      results[key] = { value: setting.value, jsonValue: setting.jsonValue, isActive: setting.isActive };
    }

    res.json({ message: 'Settings saved successfully', results });
  } catch (error) {
    next(error);
  }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    const { value, isActive } = req.body;
    let setting = await SystemSetting.findOne({ key: 'ANNOUNCEMENT_TICKER' });
    if (!setting) setting = new SystemSetting({ key: 'ANNOUNCEMENT_TICKER' });
    if (value !== undefined) setting.value = value;
    // Keep the current active flag when the caller only updates the text
    const currentActive = setting.jsonValue?.isActive !== false;
    setting.jsonValue = { ...(setting.jsonValue || {}), isActive: isActive === undefined ? currentActive : isActive !== false };
    await setting.save();
    res.json({ message: 'Announcement updated', announcement: setting.value, isActive: setting.jsonValue?.isActive });
  } catch (error) {
    next(error);
  }
};
