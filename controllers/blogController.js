const Blog = require('../models/Blog');

exports.createBlog = async (req, res, next) => {
  try {
    const blog = await Blog.create({
      ...req.body,
      author: req.user.id
    });
    await blog.populate('author', 'username name avatar');
    res.status(201).json({
      success: true,
      blog
    });
  } catch (error) {
    next(error);
  }
};

exports.getBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    let query = { published: true };
    let sort = { createdAt: -1 };
    if (req.query.tag) {
      query.tags = { $in: [new RegExp(req.query.tag, 'i')] };
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.author) {
      query.author = req.query.author;
    }
    if (req.query.sort === 'popular') {
      sort = { likesCount: -1, views: -1, createdAt: -1 };
    } else if (req.query.sort === 'views') {
      sort = { views: -1, createdAt: -1 };
    }
    const blogs = await Blog.find(query)
      .populate('author', 'username name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    const total = await Blog.countDocuments(query);
    res.json({
      success: true,
      blogs,
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

exports.getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate('author', 'username name avatar bio title skills');
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    blog.views += 1;
    await blog.save();
    res.json({
      success: true,
      blog
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBlog = async (req, res, next) => {
  try {
    let blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }
    const allowedFields = ['title', 'content', 'excerpt', 'coverImage', 'tags', 'category', 'published'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'username name avatar');
    res.json({
      success: true,
      blog
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }
    await Blog.deleteOne({ _id: req.params.id });
    res.json({
      success: true,
      message: 'Blog deleted'
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    const likeIndex = blog.likes.indexOf(req.user.id);
    if (likeIndex > -1) {
      blog.likes.splice(likeIndex, 1);
      blog.likesCount = blog.likes.length;
    } else {
      blog.likes.push(req.user.id);
      blog.likesCount = blog.likes.length;
    }
    await blog.save();
    res.json({
      success: true,
      liked: likeIndex === -1,
      likesCount: blog.likesCount
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const blogs = await Blog.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Blog.countDocuments({ author: req.user.id });
    res.json({
      success: true,
      blogs,
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
