const LearningModule = require('../models/LearningModule');
const User = require('../models/User');

// @desc    Get all published learning modules
// @route   GET /api/modules
// @access  Public
exports.getModules = async (req, res, next) => {
  try {
    const { category, difficulty, sort = '-createdAt', limit = 10, page = 1 } = req.query;

    const query = { published: true };

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    const skip = (page - 1) * limit;

    const modules = await LearningModule.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');

    const total = await LearningModule.countDocuments(query);

    res.json({
      success: true,
      count: modules.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: modules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get learning module by slug
// @route   GET /api/modules/:slug
// @access  Public
exports.getModuleBySlug = async (req, res, next) => {
  try {
    const module = await LearningModule.findOne({ 
      slug: req.params.slug,
      published: true 
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Learning module not found'
      });
    }

    // Increment view count
    module.views = (module.views || 0) + 1;
    await module.save();

    res.json({
      success: true,
      data: module
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new learning module
// @route   POST /api/modules
// @access  Private (Admin/Moderator)
exports.createModule = async (req, res, next) => {
  try {
    const moduleData = {
      ...req.body,
      createdBy: req.user._id
    };

    const module = await LearningModule.create(moduleData);

    res.status(201).json({
      success: true,
      message: 'Learning module created successfully',
      data: module
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A module with this slug already exists'
      });
    }
    next(error);
  }
};

// @desc    Update learning module
// @route   PUT /api/modules/:id
// @access  Private (Admin/Moderator)
exports.updateModule = async (req, res, next) => {
  try {
    const module = await LearningModule.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Learning module not found'
      });
    }

    const updatedModule = await LearningModule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Learning module updated successfully',
      data: updatedModule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete learning module
// @route   DELETE /api/modules/:id
// @access  Private (Admin)
exports.deleteModule = async (req, res, next) => {
  try {
    const module = await LearningModule.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Learning module not found'
      });
    }

    await module.deleteOne();

    res.json({
      success: true,
      message: 'Learning module deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get modules by category
// @route   GET /api/modules/category/:category
// @access  Public
exports.getModulesByCategory = async (req, res, next) => {
  try {
    const modules = await LearningModule.find({
      category: req.params.category,
      published: true
    }).sort('-createdAt');

    res.json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular learning modules
// @route   GET /api/modules/popular
// @access  Public
exports.getPopularModules = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const modules = await LearningModule.find({ published: true })
      .sort('-views -rating')
      .limit(limit);

    res.json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommended modules
// @route   GET /api/modules/recommended/:moduleId
// @access  Public
exports.getRecommendedModules = async (req, res, next) => {
  try {
    const currentModule = await LearningModule.findById(req.params.moduleId);

    if (!currentModule) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const modules = await LearningModule.find({
      _id: { $ne: req.params.moduleId },
      category: currentModule.category,
      published: true
    })
      .sort('-rating')
      .limit(3);

    res.json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark module as completed
// @route   POST /api/modules/:id/complete
// @access  Private
exports.completeModule = async (req, res, next) => {
  try {
    const module = await LearningModule.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Learning module not found'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user.completedModules) {
      user.completedModules = [];
    }

    if (!user.completedModules.includes(req.params.id)) {
      user.completedModules.push(req.params.id);
      module.completions = (module.completions || 0) + 1;
      
      await user.save();
      await module.save();
    }

    res.json({
      success: true,
      message: 'Module marked as completed',
      data: {
        moduleId: req.params.id,
        completedModules: user.completedModules
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate a learning module
// @route   POST /api/modules/:id/rate
// @access  Public
exports.rateModule = async (req, res, next) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rating between 1 and 5'
      });
    }

    const module = await LearningModule.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Learning module not found'
      });
    }

    // Calculate new rating
    const currentRating = module.rating || 0;
    const currentCount = module.ratingCount || 0;
    const newCount = currentCount + 1;
    const newRating = ((currentRating * currentCount) + rating) / newCount;

    module.rating = newRating;
    module.ratingCount = newCount;

    await module.save();

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: module.rating,
        ratingCount: module.ratingCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's module progress
// @route   GET /api/modules/progress
// @access  Private
exports.getModuleProgress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('completedModules', 'title slug category');

    res.json({
      success: true,
      data: {
        completedModules: user.completedModules || [],
        totalCompleted: (user.completedModules || []).length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search learning modules
// @route   GET /api/modules/search
// @access  Public
exports.searchModules = async (req, res, next) => {
  try {
    const { q, category, difficulty } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    const query = {
      published: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    const modules = await LearningModule.find(query)
      .sort('-rating -views')
      .limit(20);

    res.json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    next(error);
  }
};
