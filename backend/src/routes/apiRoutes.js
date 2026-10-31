const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const employeeController = require('../controllers/employeeController');
const mlmController = require('../controllers/mlmController');
const projectController = require('../controllers/projectController');
const plotController = require('../controllers/plotController');
const plotMapController = require('../controllers/plotMapController');
const ocrController = require('../controllers/ocrController');
const commissionController = require('../controllers/commissionController');
const payoutController = require('../controllers/payoutController');
const kycController = require('../controllers/kycController');
const dashboardController = require('../controllers/dashboardController');
const notificationController = require('../controllers/notificationController');
const reportController = require('../controllers/reportController');

const inquiryController = require('../controllers/inquiryController');
const bulkBuyController = require('../controllers/bulkBuyController');
const bulkDealController = require('../controllers/bulkDealController');
const BulkBuyInquiry = require('../models/BulkBuyInquiry');
const uploadController = require('../controllers/uploadController');
const propertyController = require('../controllers/propertyController');
const galleryController = require('../controllers/galleryController');
const cityController = require('../controllers/cityController');
const settingController = require('../controllers/settingController');
const bookingController = require('../controllers/bookingController');

const { protect, authorize } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');

const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'AGENT', 'DIRECTOR'];
const PLOT_STATUSES = ['AVAILABLE', 'BOOKED', 'PENDING', 'AGREEMENT', 'SOLD'];
const PROPERTY_TYPES = ['RESIDENTIAL_PLOT', 'COMMERCIAL', 'VILLA', 'SHOWROOM', 'APARTMENT', 'STUDIO_APARTMENT', 'LAND'];
const LISTING_TYPES = ['SALE', 'RENT', 'LEASE'];
const PROPERTY_STATUSES = ['AVAILABLE', 'BOOKED', 'SOLD', 'UPCOMING'];


const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many attempts, please try again later.' });
const inquiryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many inquiries submitted. Please wait a few minutes before trying again.' });
const sponsorLookupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, message: 'Too many sponsor lookups. Please wait a few minutes and try again.' });
const propertySubmitLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many property submissions. Please wait before submitting again.' });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many uploads. Please wait a few minutes before trying again.' });

// Multer errors (file type / size) → clean 400 instead of opaque 500
function handleUploadError(err, _req, res, next) {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File exceeds the 50MB size limit' });
  }
  if (err.name === 'MulterError' || /not allowed|Only JPEG/i.test(err.message || '')) {
    return res.status(400).json({ message: err.message || 'Invalid file upload' });
  }
  return next(err);
}

router.post('/upload', protect, uploadLimiter, upload.single('file'), handleUploadError, uploadController.uploadFile);
// Kept for older clients; requires auth — anonymous upload is no longer allowed.
router.post('/public/upload', protect, uploadLimiter, upload.single('file'), handleUploadError, uploadController.uploadFile);


router.get('/public/projects', inquiryController.getPublicProjects);
router.get('/public/projects/:id', inquiryController.getPublicProjectById);
router.get('/public/plots', inquiryController.getPublicPlots);
router.get('/public/agents', inquiryController.getPublicAgents);
router.get('/public/sponsors/lookup', sponsorLookupLimiter, employeeController.lookupPublicSponsor);
router.get('/public/agent-invite/:code', employeeController.getPublicInvite);
router.get('/public/locations', inquiryController.getPublicLocations);
router.get('/public/properties', propertyController.getPublicProperties);
router.get('/public/properties/locations', propertyController.getPublicPropertyLocations);
router.get('/public/properties/:slug', propertyController.getPublicPropertyBySlug);
router.post('/public/properties/:id/buy-inquiry', inquiryLimiter, validate({
  name: { required: true, type: 'string', minLength: 2, maxLength: 80 },
  phone: { required: true, type: 'string', minLength: 5, maxLength: 20 }
}), propertyController.createBuyInquiry);
router.get('/public/gallery', galleryController.getPublicGallery);
router.get('/public/cities', cityController.getPublicCities);
router.get('/public/bulk-deals', bulkDealController.getPublicBulkDeals);
router.get('/public/bulk-deals/locations', bulkDealController.getPublicBulkDealLocations);
router.get('/public/bulk-deals/:slug', bulkDealController.getPublicBulkDealBySlug);
router.post('/public/bulk-deals/request', inquiryLimiter, validate({
  name: { required: true, type: 'string', minLength: 2, maxLength: 80 },
  phone: { required: true, type: 'string', minLength: 5, maxLength: 20 }
}), bulkDealController.submitBulkDealRequest);

router.get('/public/announcement', settingController.getAnnouncement);
router.get('/public/frontend-stats', settingController.getFrontendStats);
router.put('/admin/announcement', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), settingController.updateAnnouncement);
router.get('/admin/settings', protect, authorize('ADMIN', 'DIRECTOR'), settingController.getAllSettings);
router.put('/admin/settings', protect, authorize('ADMIN', 'DIRECTOR'), settingController.updateAllSettings);

// --- DEDICATED GALLERY MANAGEMENT ROUTES (Admin) ---
router.get('/admin/gallery', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), galleryController.getAdminGallery);
router.post('/admin/gallery', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), galleryController.createGalleryItem);
router.put('/admin/gallery/:id', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), galleryController.updateGalleryItem);
router.delete('/admin/gallery/:id', protect, authorize('ADMIN', 'DIRECTOR'), galleryController.deleteGalleryItem);

// --- City Management (website city dropdown / cards / nearby search) ---
router.get('/admin/cities', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), cityController.getAdminCities);
router.post('/admin/cities', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), cityController.createCity);
router.put('/admin/cities/:id', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), cityController.updateCity);
router.delete('/admin/cities/:id', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), cityController.deleteCity);

// --- DEDICATED BULK DEALS MANAGEMENT ROUTES (Admin) ---
router.get('/admin/bulk-deals', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), bulkDealController.getAdminBulkDeals);
router.post('/admin/bulk-deals', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), bulkDealController.createBulkDeal);
router.put('/admin/bulk-deals/:id', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), bulkDealController.updateBulkDeal);
router.delete('/admin/bulk-deals/:id', protect, authorize('ADMIN', 'DIRECTOR'), bulkDealController.deleteBulkDeal);


router.post('/public/inquiries', inquiryLimiter, validate({
  name: { required: true, type: 'string', minLength: 2, maxLength: 80 },
  email: { required: true, type: 'email' },
  phone: { required: true, type: 'string', minLength: 5, maxLength: 20 }
}), inquiryController.createPublicInquiry);
router.post('/public/chatbot-lead', inquiryLimiter, validate({
  phone: { required: true, type: 'string', minLength: 5, maxLength: 20 }
}), inquiryController.createChatbotLead);
router.post('/public/bulk-buy', inquiryLimiter, validate({
  name: { required: true, type: 'string', minLength: 2, maxLength: 80 },
  phone: { required: true, type: 'string', minLength: 5, maxLength: 20 },
  email: { type: 'email' },
  unitCount: { type: 'number', min: BulkBuyInquiry.MIN_BULK_UNITS, max: BulkBuyInquiry.MAX_BULK_UNITS }
}), bulkBuyController.createPublicBulkBuy);
router.post('/public/agent-application', inquiryLimiter, validate({
  fullName: { required: true, type: 'string', minLength: 2, maxLength: 80 },
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 6, maxLength: 128 },
  phone: { required: true, type: 'string', minLength: 5, maxLength: 20 },
  sponsorCode: { type: 'string', maxLength: 40 },
  inviteCode: { type: 'string', maxLength: 40 }
}), inquiryController.createPublicAgentApplication);

// --- Auth Routes ---
router.post('/auth/register', protect, authorize('ADMIN'), validate({
  fullName: { required: true, type: 'string', minLength: 2, maxLength: 80 },
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 6, maxLength: 128 },
  phone: { type: 'string', maxLength: 20 }
}), authController.register);
router.post('/auth/login', authLimiter, validate({
  email: { required: true, type: 'string', maxLength: 254 },
  password: { required: true, type: 'string' }
}), authController.login);
router.post('/auth/verify-email', authLimiter, authController.verifyEmail);
router.get('/auth/verify-email', authLimiter, authController.verifyEmail);
router.post('/auth/resend-verification', authLimiter, validate({
  email: { required: true, type: 'string', maxLength: 254 }
}), authController.resendVerificationEmail);
router.post('/auth/forgot-password', authLimiter, validate({
  email: { required: true, type: 'string', maxLength: 254 }
}), authController.forgotPassword);
router.post('/auth/reset-password', authLimiter, authController.resetPassword);
router.get('/auth/me', protect, authController.getMe);
router.post('/auth/change-password', protect, authLimiter, validate({
  currentPassword: { required: true, type: 'string' },
  newPassword: { required: true, type: 'string', minLength: 6, maxLength: 128 }
}), authController.changePassword);

router.post('/auth/register-public-agent', authLimiter, validate({
  fullName: { required: true, type: 'string', minLength: 2, maxLength: 80 },
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 6, maxLength: 128 },
  phone: { required: true, type: 'string', minLength: 5, maxLength: 20 },
  sponsorCode: { type: 'string', maxLength: 40 },
  inviteCode: { type: 'string', maxLength: 40 }
}), authController.registerPublicAgent);

// Property Owner Registration (separate from MLM agent flow)
router.post('/auth/register-property-owner', authLimiter, validate({
  fullName: { required: true, type: 'string', minLength: 2, maxLength: 80 },
  email: { required: true, type: 'email' },
  phone: { required: true, type: 'string', minLength: 5, maxLength: 20 },
  password: { required: true, type: 'string', minLength: 6, maxLength: 128 }
}), authController.registerPropertyOwner);

// --- Employee / Agent CRUD & MLM Routes ---
router.get('/employees/me/invite-link', protect, employeeController.getMyInviteLink);
router.get('/employees', protect, employeeController.getEmployees);
router.post('/employees', protect, validate({
  fullName: { required: true, type: 'string', minLength: 2, maxLength: 80 },
  email: { required: true, type: 'email' },
  phone: { type: 'string', maxLength: 20 },
  password: { type: 'string', minLength: 6, maxLength: 128 },
  role: { type: 'string', enum: ROLES },
  parentId: { type: 'objectId' }
}), employeeController.createEmployee);
router.get('/employees/:id', protect, employeeController.getEmployeeById);
router.put('/employees/:id', protect, validate({
  fullName: { type: 'string', minLength: 2, maxLength: 80 },
  phone: { type: 'string', maxLength: 20 },
  currentRank: { type: 'string' },
  parentId: { type: 'objectId' }
}), employeeController.updateEmployee);
router.delete('/employees/:id', protect, authorize('ADMIN'), employeeController.deleteEmployee);
router.post('/employees/:id/approve', protect, authorize('ADMIN', 'MANAGER', 'DIRECTOR'), employeeController.approveAgent);
router.post('/employees/:id/reject', protect, authorize('ADMIN', 'MANAGER', 'DIRECTOR'), employeeController.rejectAgent);
router.post('/employees/:id/evaluate-rank', protect, authorize('ADMIN', 'DIRECTOR'), employeeController.updateEmployeeRank);

router.get('/mlm/tree', protect, mlmController.getTree);
router.get('/mlm/rank-rules', protect, mlmController.getRankRules);
router.get('/mlm/summary', protect, authorize('ADMIN', 'DIRECTOR'), mlmController.getMLMSummary);
router.post('/mlm/evaluate-rank/:employeeId', protect, authorize('ADMIN', 'DIRECTOR'), mlmController.evaluateRank);

// --- Projects & Settings CRUD Routes ---
router.get('/projects', protect, projectController.getProjects);
router.post('/projects', protect, authorize('ADMIN', 'DIRECTOR'), validate({
  name: { required: true, type: 'string', minLength: 2, maxLength: 120 },
  code: { required: true, type: 'string', minLength: 2, maxLength: 30 },
  location: { required: true, type: 'string' },
  totalAreaSqft: { required: true, type: 'number', min: 0 },
  basePricePerSqft: { required: true, type: 'number', min: 0 }
}), projectController.createProject);
router.get('/projects/:id', protect, projectController.getProjectById);
router.put('/projects/:id', protect, authorize('ADMIN', 'DIRECTOR'), validate({
  name: { type: 'string', minLength: 2, maxLength: 120 },
  code: { type: 'string', minLength: 2, maxLength: 30 },
  totalAreaSqft: { type: 'number', min: 0 },
  basePricePerSqft: { type: 'number', min: 0 }
}), projectController.updateProject);
router.delete('/projects/:id', protect, authorize('ADMIN'), projectController.deleteProject);
router.put('/projects/:projectId/settings', protect, authorize('ADMIN'), projectController.updateProjectSettings);

router.get('/properties/my', protect, propertyController.getMyProperties);
router.get('/properties/my/:id', protect, propertyController.getMyPropertyById);
router.put('/properties/my/:id', protect, propertyController.updateMyProperty);
router.post('/properties/submit', protect, propertySubmitLimiter, validate({
  title: { required: true, type: 'string', minLength: 3, maxLength: 160 },
  contactPhone: { required: true, type: 'string', minLength: 5, maxLength: 20 }
}), propertyController.registerPublicProperty);
router.post('/properties/:id/approve', protect, authorize('ADMIN', 'DIRECTOR'), propertyController.approveProperty);
router.post('/properties/:id/reject', protect, authorize('ADMIN', 'DIRECTOR'), propertyController.rejectProperty);
router.get('/properties', protect, propertyController.getProperties);
router.post('/properties', protect, authorize('ADMIN', 'DIRECTOR'), validate({
  title: { required: true, type: 'string', minLength: 2, maxLength: 160 },
  propertyType: { type: 'string', enum: PROPERTY_TYPES },
  listingType: { type: 'string', enum: LISTING_TYPES },
  status: { type: 'string', enum: PROPERTY_STATUSES },
  price: { type: 'number', min: 0 },
  projectId: { type: 'objectId' }
}), propertyController.createProperty);
router.get('/properties/:id', protect, propertyController.getPropertyById);
router.put('/properties/:id', protect, authorize('ADMIN', 'DIRECTOR'), validate({
  title: { type: 'string', minLength: 2, maxLength: 160 },
  propertyType: { type: 'string', enum: PROPERTY_TYPES },
  listingType: { type: 'string', enum: LISTING_TYPES },
  status: { type: 'string', enum: PROPERTY_STATUSES },
  price: { type: 'number', min: 0 },
  projectId: { type: 'objectId' }
}), propertyController.updateProperty);
router.patch('/properties/:id/status', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), validate({
  status: { required: true, type: 'string', enum: PROPERTY_STATUSES }
}), propertyController.updatePropertyStatus);
router.delete('/properties/:id', protect, authorize('ADMIN'), propertyController.deleteProperty);

// --- Plot Management & Sales Routes ---
router.get('/user/my-properties', protect, plotController.getUserProperties);
router.get('/plots', protect, plotController.getPlots);
router.get('/plots/export-csv', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), plotController.exportPlotsCSV);
router.post('/plots/compute-price', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), plotController.computePricePreview);
router.post('/plots/import-csv', protect, authorize('ADMIN', 'DIRECTOR'), validate({
  projectId: { required: true, type: 'objectId' },
  plotsData: { required: true, type: 'array' }
}), plotController.importPlotsCSV);
router.get('/plots/:id', protect, plotController.getPlotById);
router.put('/plots/:id/marker', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), validate({
  xPercent: { required: true, type: 'number', min: 0, max: 100 },
  yPercent: { required: true, type: 'number', min: 0, max: 100 }
}), plotController.updatePlotMarker);
router.put('/plots/:id/status', protect, validate({
  status: { required: true, type: 'string', enum: PLOT_STATUSES },
  ownerEmail: { type: 'email' },
  paidAmount: { type: 'number', min: 0 }
}), plotController.updatePlotStatus);
router.post('/plots/:plotId/documents', protect, upload.single('file'), plotController.uploadPlotDocument);


router.get('/plot-maps', protect, plotMapController.getPlotMaps);
router.get('/plot-maps/:id', protect, plotMapController.getPlotMapById);
router.post('/ocr/analyze', protect, authorize('ADMIN', 'DIRECTOR'), upload.single('file'), ocrController.analyzeMap);
router.post('/ocr/approve/:mapId', protect, authorize('ADMIN', 'DIRECTOR'), ocrController.approveMapOverlay);
router.post('/ocr/reject/:mapId', protect, authorize('ADMIN', 'DIRECTOR'), ocrController.rejectMapOverlay);
router.get('/ocr/latest/:projectId', protect, authorize('ADMIN', 'DIRECTOR'), ocrController.getLatestMapByProject);


router.get('/commissions', protect, commissionController.getCommissions);
router.get('/commissions/summary', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), commissionController.getCommissionSummary);
router.post('/commissions/run', protect, authorize('ADMIN', 'DIRECTOR'), commissionController.runCommissionCalculation);

router.get('/payouts', protect, payoutController.getPayouts);
router.post('/payouts/request', protect, validate({
  employeeId: { type: 'objectId' }
}), payoutController.requestPayout);
router.post('/payouts/:id/approve', protect, authorize('ADMIN', 'DIRECTOR'), payoutController.approvePayout);


router.get('/kyc/me', protect, kycController.getMyKyc);
router.put('/kyc/me', protect, kycController.saveMyKyc);
router.get('/kyc', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), kycController.listKyc);
router.get('/kyc/employee/:employeeId', protect, kycController.getKycByEmployee);
router.get('/kyc/:id', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), kycController.getKycById);
router.post('/kyc/:id/approve', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), kycController.approveKyc);
router.post('/kyc/:id/reject', protect, authorize('ADMIN', 'DIRECTOR', 'MANAGER'), kycController.rejectKyc);


router.get('/reports/commission-audit', protect, authorize('ADMIN', 'DIRECTOR'), reportController.commissionAuditReport);
router.get('/reports/revenue', protect, authorize('ADMIN', 'DIRECTOR'), reportController.revenueReport);
router.get('/reports/mlm-performance', protect, authorize('ADMIN', 'DIRECTOR'), reportController.mlmPerformanceReport);
router.get('/reports/payout-summary', protect, authorize('ADMIN', 'DIRECTOR'), reportController.payoutSummaryReport);
router.get('/reports/plot-ledger', protect, authorize('ADMIN', 'DIRECTOR'), reportController.plotLedgerReport);


router.get('/inquiries', protect, authorize('ADMIN', 'MANAGER', 'DIRECTOR'), inquiryController.getInquiries);
router.put('/inquiries/:id/status', protect, authorize('ADMIN', 'MANAGER', 'DIRECTOR'), inquiryController.updateInquiryStatus);
router.get('/bulk-buy-inquiries', protect, authorize('ADMIN', 'MANAGER', 'DIRECTOR'), bulkBuyController.getBulkBuyInquiries);
router.put('/bulk-buy-inquiries/:id/status', protect, authorize('ADMIN', 'MANAGER', 'DIRECTOR'), bulkBuyController.updateBulkBuyStatus);


router.get('/agent/home', protect, bookingController.getHome);
router.put('/agent/profile', protect, bookingController.updateProfile);
router.put('/agent/bank', protect, bookingController.updateBank);
router.get('/agent/yearly-plan', protect, bookingController.getYearlyPlan);
router.put('/agent/yearly-target', protect, authorize('ADMIN', 'DIRECTOR'), bookingController.updateYearlyTarget);
router.get('/agent/team-sales', protect, bookingController.getTeamSales);

router.get('/bookings/reports', protect, authorize('ADMIN', 'DIRECTOR'), bookingController.report);
router.get('/bookings', protect, bookingController.listBookings);
router.post('/bookings', protect, bookingController.createBooking);
router.get('/bookings/:id', protect, bookingController.getBooking);
router.post('/bookings/:id/confirm', protect, authorize('ADMIN', 'DIRECTOR'), bookingController.confirmBooking);
router.post('/bookings/:id/reject', protect, authorize('ADMIN', 'DIRECTOR'), bookingController.rejectBooking);
router.post('/bookings/:id/cancel', protect, bookingController.cancelBooking);
router.post('/bookings/:id/accept-cancel', protect, authorize('ADMIN', 'DIRECTOR'), bookingController.acceptCancel);
router.post('/bookings/:id/agreement', protect, authorize('ADMIN', 'DIRECTOR'), bookingController.markAgreement);
router.post('/bookings/:id/sold', protect, authorize('ADMIN', 'DIRECTOR'), bookingController.markSold);
router.post('/bookings/:id/documents', protect, bookingController.addDocument);

router.get('/dashboard/stats', protect, authorize('ADMIN', 'DIRECTOR'), dashboardController.getDashboardStats);
router.get('/notifications', protect, notificationController.getNotifications);
router.get('/notifications/unread-count', protect, notificationController.getUnreadCount);
router.put('/notifications/mark-all-read', protect, notificationController.markAllRead);
router.put('/notifications/:id/read', protect, notificationController.markAsRead);

module.exports = router;
