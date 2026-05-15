const User = require('../models/User');
const Follow = require('../models/Follow');

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    let isFollowing = false;
    if (req.user) {
      const follow = await Follow.findOne({
        follower: req.user.id,
        following: user._id
      });
      isFollowing = !!follow;
    }
    res.json({
      success: true,
      user,
      isFollowing
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'bio', 'title', 'location', 'skills', 'socialLinks', 'avatar', 'banner'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );
    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleFollow = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const existingFollow = await Follow.findOne({
      follower: req.user.id,
      following: targetUserId
    });
    if (existingFollow) {
      await Follow.deleteOne({ _id: existingFollow._id });
      await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });
      await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: -1 } });
      res.json({
        success: true,
        message: 'Unfollowed successfully',
        isFollowing: false
      });
    } else {
      await Follow.create({
        follower: req.user.id,
        following: targetUserId
      });
      await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } });
      await User.findByIdAndUpdate(req.user.id, { $inc: { followingCount: 1 } });
      res.json({
        success: true,
        message: 'Followed successfully',
        isFollowing: true
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.getFollowers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const follows = await Follow.find({ following: req.params.id })
      .populate('follower', 'username name avatar bio title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Follow.countDocuments({ following: req.params.id });
    res.json({
      success: true,
      users: follows.map(f => f.follower),
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

exports.getFollowing = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const follows = await Follow.find({ follower: req.params.id })
      .populate('following', 'username name avatar bio title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Follow.countDocuments({ follower: req.params.id });
    res.json({
      success: true,
      users: follows.map(f => f.following),
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

exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    let query = {};
    if (req.query.skills) {
      const skills = req.query.skills.split(',').map(s => s.trim());
      query.skills = { $in: skills };
    }
    const users = await User.find(query)
      .select('username name avatar bio title skills followersCount')
      .sort({ followersCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments(query);
    res.json({
      success: true,
      users,
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
