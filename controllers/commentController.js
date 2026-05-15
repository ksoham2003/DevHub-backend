const Comment = require('../models/Comment');
const Project = require('../models/Project');
const Blog = require('../models/Blog');

exports.getComments = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const comments = await Comment.find({ targetType, targetId })
      .populate('author', 'username name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Comment.countDocuments({ targetType, targetId });
    res.json({ success: true, comments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};
exports.createComment = async (req, res, next) => {
  try {
    const { targetId, targetType, content } = req.body;
    const Model = targetType === 'project' ? Project : Blog;
    const target = await Model.findById(targetId);
    if (!target) return res.status(404).json({ success: false, message: `${targetType} not found` });
    const comment = await Comment.create({ author: req.user.id, targetId, targetType, content });
    target.commentsCount = (target.commentsCount || 0) + 1;
    await target.save();
    await comment.populate('author', 'username name avatar');
    res.status(201).json({ success: true, comment });
  } catch (error) { next(error); }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    const Model = comment.targetType === 'project' ? Project : Blog;
    await Model.findByIdAndUpdate(comment.targetId, { $inc: { commentsCount: -1 } });
    await Comment.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) { next(error); }
};
