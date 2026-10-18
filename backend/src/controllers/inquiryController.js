const Inquiry = require('../models/Inquiry');
const Project = require('../models/Project');
const Plot = require('../models/Plot');
const Property = require('../models/Property');
const User = require('../models/User');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const { getPresignedUrl } = require('../services/s3Service');
const { resolveSponsorByInviteCode, generateEmployeeCode } = require('../utils/agentInvite');
const { deriveMapEmbedUrl } = require('../utils/googleMaps');
const { notifyAdmins } = require('../services/notificationService');
const { withFreshProjectMedia } = require('../utils/mediaHydrator');
const { queryString, containsRegex } = require('../utils/queryUtils');
const mongoose = require('mongoose');

// 1. Public Project Listing (With Live MongoDB Plot Status Aggregation)
exports.getPublicProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ status: { $ne: 'DELETED' } })
      .select('name code location city state description highlights locationAdvantages amenities totalAreaSqft area totalPlots priceRange basePricePerSqft bannerImage bannerImageS3Key mapImageUrl mapImageS3Key logoImage insetImage gallery surveyNumber village latitude longitude googleMapsUrl mapEmbedUrl brochureUrl videoUrl contactPhone contactEmail legalInfo legalDocuments launchDate status isDholera')
      .sort({ createdAt: -1 })
      .lean();

    const projectsWithStats = await Promise.all(
      projects.map(async (p) => {
        const plotCounts = await Plot.aggregate([
          { $match: { projectId: p._id } },
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const statsMap = { AVAILABLE: 0, BOOKED: 0, PENDING: 0, SOLD: 0 };
        plotCounts.forEach(item => {
          if (item._id && statsMap[item._id] !== undefined) {
            statsMap[item._id] = item.count;
          }
        });

        const totalPlotsInDB = Object.values(statsMap).reduce((a, b) => a + b, 0);

        const hydrated = await withFreshProjectMedia(p);
        return {
          ...hydrated,
          totalPlots: Math.max(p.totalPlots || 0, totalPlotsInDB),
          availableCount: statsMap.AVAILABLE,
          bookedCount: statsMap.BOOKED,
          pendingCount: statsMap.PENDING,
          soldCount: statsMap.SOLD
        };
      })
    );

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(projectsWithStats);
  } catch (error) {
    next(error);
  }
};

// 1b. Public Project Details by ID (With Live Plot Stats & Plot Inventory)
exports.getPublicProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: 'Project not found' });
    const project = await Project.findById(id).lean();

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const plotCounts = await Plot.aggregate([
      { $match: { projectId: project._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const statsMap = { AVAILABLE: 0, BOOKED: 0, PENDING: 0, SOLD: 0 };
    plotCounts.forEach(item => {
      if (item._id && statsMap[item._id] !== undefined) {
        statsMap[item._id] = item.count;
      }
    });

    const totalPlotsInDB = Object.values(statsMap).reduce((a, b) => a + b, 0);

    const plots = await Plot.find({ projectId: project._id })
      .select('block plotNo sizeSqft sellableSqYrd carpetSqYrd price totalCost status plotType facing dimensions superBuiltUpSqft plc12mtr plc9mtr plcCorner plcParkFacing totalPlc discountedPlc marker coordinates polygon')
      .sort({ plotNo: 1 });

    const properties = await Property.find({
      projectId: project._id,
      isPublished: { $ne: false },
      // Never expose pending/rejected owner submissions publicly
      $or: [{ approvalStatus: 'APPROVED' }, { approvalStatus: { $exists: false } }]
    }).sort({ isFeatured: -1, createdAt: -1 });

    const hydrated = await withFreshProjectMedia(project);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      project: {
        ...hydrated,
        totalPlots: Math.max(project.totalPlots || 0, totalPlotsInDB),
        availableCount: statsMap.AVAILABLE,
        bookedCount: statsMap.BOOKED,
        pendingCount: statsMap.PENDING,
        soldCount: statsMap.SOLD
      },
      stats: statsMap,
      plots,
      properties
    });
  } catch (error) {
    next(error);
  }
};

// 2. Public Plot Discovery Listing (Public-safe available plots)
exports.getPublicPlots = async (req, res, next) => {
  try {
    const projectId = queryString(req.query.projectId);
    const block = queryString(req.query.block);
    const search = queryString(req.query.search);
    const filter = { status: { $in: ['AVAILABLE', 'BOOKED', 'PENDING'] } };

    if (projectId) {
      if (!mongoose.Types.ObjectId.isValid(projectId)) return res.json([]);
      filter.projectId = projectId;
    }
    if (block) filter.block = block;
    if (search) {
      filter.$or = [
        { plotNo: containsRegex(search) },
        { block: containsRegex(search) }
      ];
    }

    const plots = await Plot.find(filter)
      .select('projectId block plotNo sizeSqft sellableSqYrd carpetSqYrd price totalCost status plotType facing dimensions superBuiltUpSqft plc12mtr plc9mtr plcCorner plcParkFacing totalPlc discountedPlc marker coordinates polygon')
      .populate('projectId', 'name location code');

    res.json(plots);
  } catch (error) {
    next(error);
  }
};

// 3. Public Contact / Inquiry / Site Visit Submission
exports.createPublicInquiry = async (req, res, next) => {
  try {
    const { name, email, phone, inquiryType, projectId, plotNo, message } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone number are required' });
    }

    let projectName = '';
    // Ignore malformed ids instead of failing the whole inquiry with a CastError
    const validProjectId = projectId && mongoose.Types.ObjectId.isValid(String(projectId)) ? String(projectId) : null;
    if (validProjectId) {
      const proj = await Project.findById(validProjectId);
      if (proj) projectName = proj.name;
    }

    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      inquiryType: inquiryType || 'CONTACT_FORM',
      projectId: validProjectId,
      projectName,
      plotNo: plotNo ? String(plotNo) : '',
      message: message || '',
      status: 'NEW',
      source: 'LANDING_PAGE'
    });

    // Fire-and-forget admin notification
    notifyAdmins({
      title: `New Inquiry — ${name}`,
      message: `${phone} · ${inquiryType || 'CONTACT_FORM'}${projectName ? ` · ${projectName}` : ''}${plotNo ? ` · Plot ${plotNo}` : ''}`,
      category: 'INQUIRY',
      meta: { inquiryId: inquiry._id, name, phone, email, inquiryType, projectName, plotNo }
    });

    res.status(201).json({
      message: '🎉 Thank you! Your inquiry has been dispatched to our senior advisory desk.',
      inquiryId: inquiry._id
    });
  } catch (error) {
    next(error);
  }
};

// 3b. Public AI Chatbot Lead Submission
exports.createChatbotLead = async (req, res, next) => {
  try {
    const { name, phone, email, city, budget, interest, message } = req.body;

    if (!phone || String(phone).trim().length < 5) {
      return res.status(400).json({ message: 'Valid phone number is required to receive property details' });
    }

    const leadName = String(name || '').trim() || 'AI Chatbot Visitor';
    const cleanPhone = String(phone).trim();
    const cleanEmail = String(email || '').trim();
    const cleanCity = String(city || '').trim();
    const cleanBudget = String(budget || '').trim();
    const cleanInterest = String(interest || 'General Inquiry').trim();

    const inquiry = await Inquiry.create({
      name: leadName,
      email: cleanEmail || `${cleanPhone}@chatbot.lead`,
      phone: cleanPhone,
      inquiryType: 'CHATBOT_LEAD',
      message: `[AI Chatbot Lead] Interest: ${cleanInterest} | City: ${cleanCity || 'N/A'} | Budget: ${cleanBudget || 'N/A'}\n${String(message || '').trim()}`,
      status: 'NEW',
      source: 'AI_CHATBOT'
    });

    // Fire-and-forget admin notification
    notifyAdmins({
      title: `🤖 New AI Chatbot Lead — ${leadName}`,
      message: `📱 ${cleanPhone} · ${cleanInterest}${cleanCity ? ` · ${cleanCity}` : ''}${cleanBudget ? ` · ${cleanBudget}` : ''}`,
      category: 'INQUIRY',
      meta: { inquiryId: inquiry._id, name: leadName, phone: cleanPhone, email: cleanEmail, interest: cleanInterest, city: cleanCity, budget: cleanBudget }
    });

    res.status(201).json({
      message: '🎉 Thank you! Our advisory team will WhatsApp you the details shortly.',
      inquiryId: inquiry._id
    });
  } catch (error) {
    next(error);
  }
};

// 4. Public Agent Application Submission
exports.createPublicAgentApplication = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, experienceYears, message, inviteCode } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: 'Full name, email, phone number, and password are required' });
    }
    const normalizedEmail = String(email).toLowerCase().trim();

    let sponsor = null;
    if (inviteCode) {
      sponsor = await resolveSponsorByInviteCode(inviteCode);
      if (!sponsor) {
        return res.status(400).json({ message: 'This invite link is invalid. Ask your sponsor for a fresh link.' });
      }
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ message: 'An account with this email address already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      fullName,
      phone,
      role: 'AGENT',
      isActive: false,
      approvalStatus: 'PENDING_APPROVAL'
    });

    let employee;
    try {
      employee = await Employee.create({
        userId: user._id,
        employeeCode: await generateEmployeeCode(),
        joiningDate: new Date(),
        currentRank: 'Business Executive',
        parentId: sponsor ? sponsor._id : null
      });
    } catch (err) {
      // Don't leave an orphan user that blocks this email from re-applying.
      await User.deleteOne({ _id: user._id });
      throw err;
    }

    const sponsorName = sponsor?.userId?.fullName || '';
    const inquiry = await Inquiry.create({
      name: fullName,
      email: normalizedEmail,
      phone,
      inquiryType: 'AGENT_APPLICATION',
      message: message || (sponsor
        ? `Joined via invite from ${sponsorName} (${sponsor.employeeCode})`
        : 'Submitted public agent application'),
      experienceYears: experienceYears || '0-2 Years',
      status: 'NEW',
      source: sponsor ? 'AGENT_INVITE' : 'BECOME_AGENT_FORM'
    });

    // Fire-and-forget admin notification
    notifyAdmins({
      title: `New Agent Application — ${fullName}`,
      message: `${phone} · ${email}${sponsor ? ` · Referred by ${sponsorName}` : ' · Direct application'} · ${experienceYears || '0-2 Years'} exp`,
      category: 'AGENT',
      meta: { employeeCode: employee.employeeCode, fullName, phone, email, sponsorName }
    });

    res.status(201).json({
      message: '🎉 Application received successfully! Your agent credentials are pending Admin approval.',
      employeeCode: employee.employeeCode,
      inquiryId: inquiry._id
    });
  } catch (error) {
    next(error);
  }
};

// 5. Admin List Inquiries (Protected)
exports.getInquiries = async (req, res, next) => {
  try {
    const inquiries = await Inquiry.find()
      .populate('projectId', 'name code location')
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

// 6. Admin Update Inquiry Status (Protected)
exports.updateInquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedAgentId } = req.body;

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry lead not found' });

    if (status) {
      if (!Inquiry.schema.path('status').enumValues.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      inquiry.status = status;
    }
    if (assignedAgentId !== undefined) {
      if (assignedAgentId && !mongoose.Types.ObjectId.isValid(String(assignedAgentId))) {
        return res.status(400).json({ message: 'Invalid agent id' });
      }
      inquiry.assignedAgentId = assignedAgentId || null;
    }

    await inquiry.save();
    res.json({ message: 'Inquiry status updated successfully', inquiry });
  } catch (error) {
    next(error);
  }
};

// 7. Public Agents Listing
exports.getPublicAgents = async (req, res, next) => {
  try {
    const employees = await Employee.find({ employeeCode: { $exists: true, $ne: '' } })
      .populate('userId', 'fullName email phone avatar role isActive approvalStatus')
      .sort({ selfSalesCount: -1 })
      .lean();

    const formattedAgents = employees
      // Only live, approved agents belong on the public site — not pending/rejected applicants.
      .filter((emp) => emp.userId && emp.userId.isActive !== false && emp.userId.approvalStatus !== 'PENDING_APPROVAL' && emp.userId.approvalStatus !== 'REJECTED')
      .map((emp) => {
        const name = emp.userId.fullName || 'Sales Executive';
        const nameParts = name.trim().split(/\s+/);
        const initials = nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : name.slice(0, 2).toUpperCase();

        return {
          id: emp._id.toString(),
          slug: emp.employeeCode.toLowerCase(),
          name,
          initials,
          title: emp.currentRank || 'Senior Advisory Executive',
          location: 'Executive Desk',
          email: emp.userId.email || '',
          phone: emp.userId.phone || '+91 98765 43210',
          avatar: emp.userId.avatar || null,
          employeeCode: emp.employeeCode,
          totalSalesVolume: `${emp.selfSalesCount || 0} Plots Sold`,
          activeListingsCount: emp.teamSalesCount || 0,
          bio: `${name} is an active ${emp.currentRank || 'Business Executive'} managing downline plot inquiries, direct buyer consultations, and site tours for luxury township masterplans.`,
          rank: emp.currentRank
        };
      });

    res.json(formattedAgents);
  } catch (error) {
    next(error);
  }
};

// 8. Public Locations Listing (Aggregated dynamically from DB projects)
exports.getPublicLocations = async (req, res, next) => {
  try {
    const projects = await Project.find({ status: { $ne: 'DELETED' } }).lean();
    const plotCounts = await Plot.aggregate([
      { $match: { status: { $ne: 'DELETED' } } },
      { $group: { _id: "$projectId", totalPlots: { $sum: 1 }, availablePlots: { $sum: { $cond: [{ $eq: ["$status", "AVAILABLE"] }, 1, 0] } } } }
    ]);

    const projectStatsMap = {};
    plotCounts.forEach(pc => {
      if (pc._id) projectStatsMap[pc._id.toString()] = pc;
    });

    const locationsMap = {};

    projects.forEach((proj) => {
      const locName = proj.location || 'Prime Destination';
      const slug = locName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const pStats = projectStatsMap[proj._id.toString()] || { totalPlots: proj.totalPlots || 0, availablePlots: proj.totalPlots || 0 };

      if (!locationsMap[slug]) {
        locationsMap[slug] = {
          id: slug,
          slug,
          name: locName,
          state: 'India',
          tagline: `Prime Real Estate & Township Developments in ${locName}`,
          description: `Discover verified plots, masterplanned layouts, and high-appreciation land investments in ${locName}.`,
          cardImage: proj.bannerImage || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
          heroImage: proj.bannerImage || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
          activeListingsCount: pStats.availablePlots || proj.totalPlots || 0,
          totalProjectsCount: 1,
          avgPricePerSqft: `₹${proj.basePricePerSqft || 4500}/sq.ft`,
          yoyGrowth: '+18.5%',
          keyHighPoints: ['High Appreciation Zone', 'Clear Title Government Approved', 'Direct Highway & Metro Access'],
          projects: [proj]
        };
      } else {
        locationsMap[slug].activeListingsCount += (pStats.availablePlots || proj.totalPlots || 0);
        locationsMap[slug].totalProjectsCount += 1;
        locationsMap[slug].projects.push(proj);
      }
    });

    res.json(Object.values(locationsMap));
  } catch (error) {
    next(error);
  }
};


