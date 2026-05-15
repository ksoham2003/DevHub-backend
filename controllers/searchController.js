const User = require('../models/User');
const Project = require('../models/Project');
const Blog = require('../models/Blog');

exports.search = async (req, res, next) => {
  try {
    const { q, type, techStack } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const results = {};

    if (!q && !techStack) {
      return res.status(400).json({ success: false, message: 'Search query or tech stack filter required' });
    }

    const searchRegex = q ? new RegExp(q, 'i') : null;

    if (!type || type === 'users') {
      let userQuery = {};
      if (searchRegex) userQuery = { $or: [{ username: searchRegex }, { name: searchRegex }, { bio: searchRegex }] };
      if (techStack) {
        const techs = techStack.split(',').map(t => new RegExp(t.trim(), 'i'));
        userQuery.skills = { $in: techs };
      }
      results.users = await User.find(userQuery)
        .select('username name avatar bio title skills followersCount')
        .sort({ followersCount: -1 }).skip(skip).limit(limit);
      results.usersTotal = await User.countDocuments(userQuery);
    }

    if (!type || type === 'projects') {
      let projQuery = {};
      if (searchRegex) projQuery = { $or: [{ title: searchRegex }, { description: searchRegex }] };
      if (techStack) {
        const techs = techStack.split(',').map(t => new RegExp(t.trim(), 'i'));
        projQuery.techStack = { $in: techs };
      }
      results.projects = await Project.find(projQuery)
        .populate('author', 'username name avatar')
        .sort({ likesCount: -1, createdAt: -1 }).skip(skip).limit(limit);
      results.projectsTotal = await Project.countDocuments(projQuery);
    }

    if (!type || type === 'blogs') {
      let blogQuery = { published: true };
      if (searchRegex) blogQuery.$or = [{ title: searchRegex }, { content: searchRegex }, { tags: searchRegex }];
      if (techStack) {
        const techs = techStack.split(',').map(t => new RegExp(t.trim(), 'i'));
        blogQuery.tags = { $in: techs };
      }
      results.blogs = await Blog.find(blogQuery)
        .populate('author', 'username name avatar')
        .sort({ createdAt: -1 }).skip(skip).limit(limit);
      results.blogsTotal = await Blog.countDocuments(blogQuery);
    }

    res.json({ success: true, ...results, pagination: { page, limit } });
  } catch (error) { next(error); }
};

exports.getTrending = async (req, res, next) => {
  try {
    const [projects, blogs, developers] = await Promise.all([
      Project.find().populate('author', 'username name avatar')
        .sort({ likesCount: -1, createdAt: -1 }).limit(6),
      Blog.find({ published: true }).populate('author', 'username name avatar')
        .sort({ views: -1, likesCount: -1 }).limit(6),
      User.find().select('username name avatar bio title skills followersCount')
        .sort({ followersCount: -1 }).limit(6)
    ]);
    res.json({ success: true, projects, blogs, developers });
  } catch (error) { next(error); }
};
