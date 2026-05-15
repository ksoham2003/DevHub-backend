const Project = require('../models/Project');

// @desc    Create project
// @route   POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const project = await Project.create({
      ...req.body,
      author: req.user.id
    });

    await project.populate('author', 'username name avatar');

    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects
// @route   GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let query = {};
    let sort = { createdAt: -1 };

    // Filter by tech stack
    if (req.query.techStack) {
      const techs = req.query.techStack.split(',').map(t => t.trim());
      query.techStack = { $in: techs.map(t => new RegExp(t, 'i')) };
    }

    // Filter by author
    if (req.query.author) {
      query.author = req.query.author;
    }

    // Sort options
    if (req.query.sort === 'popular') {
      sort = { likesCount: -1, createdAt: -1 };
    } else if (req.query.sort === 'oldest') {
      sort = { createdAt: 1 };
    }

    const projects = await Project.find(query)
      .populate('author', 'username name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('author', 'username name avatar bio title skills');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check ownership
    if (project.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

    const allowedFields = ['title', 'description', 'techStack', 'githubUrl', 'liveUrl', 'thumbnail', 'images'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    project = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'username name avatar');

    res.json({
      success: true,
      project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project'
      });
    }

    await Project.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Project deleted'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/unlike project
// @route   POST /api/projects/:id/like
exports.toggleLike = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const likeIndex = project.likes.indexOf(req.user.id);

    if (likeIndex > -1) {
      project.likes.splice(likeIndex, 1);
      project.likesCount = project.likes.length;
    } else {
      project.likes.push(req.user.id);
      project.likesCount = project.likes.length;
    }

    await project.save();

    res.json({
      success: true,
      liked: likeIndex === -1,
      likesCount: project.likesCount
    });
  } catch (error) {
    next(error);
  }
};
