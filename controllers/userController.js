const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const userController = {
  async createUser(req, res, next) {
    try {
      const userData = {
        ...req.body,
        userId: uuidv4()
      };
      
      const user = new User(userData);
      await user.save();
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all users
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, location } = req.query;
      const skip = (page - 1) * limit;
      
      const filter = location ? { location } : {};
      
      const users = await User.find(filter)
        .select('-__v')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
      
      const total = await User.countDocuments(filter);
      
      res.json({
        success: true,
        data: users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  async getUserById(req, res, next) {
    try {
      const user = await User.findById(req.params.id).select('-__v');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user
  async updateUser(req, res, next) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).select('-__v');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete user
  async deleteUser(req, res, next) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;