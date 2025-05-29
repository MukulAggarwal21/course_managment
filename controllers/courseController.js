const Course = require('../models/Course');
const User = require('../models/User');
const { calculateLocalizedPrice } = require('../middlewares/locationPricing');
const { v4: uuidv4 } = require('uuid');

const courseController = {
  async createCourse(req, res, next) {
    try {
      const creator = await User.findById(req.body.creatorId);
      if (!creator) {
        return res.status(404).json({
          success: false,
          message: 'Creator not found'
        });
      }
      
      const courseData = {
        ...req.body,
        courseId: uuidv4()
      };
      
      const course = new Course(courseData);
      await course.save();
      
      // Populate creator information
      await course.populate('creatorId', 'name email location');
      
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllCourses(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        level, 
        creatorId, 
        minPrice, 
        maxPrice,
        search 
      } = req.query;
      
      const skip = (page - 1) * limit;
      
      // Build filter object
      const filter = { isActive: true };
      if (category) filter.category = category;
      if (level) filter.level = level;
      if (creatorId) filter.creatorId = creatorId;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      const courses = await Course.find(filter)
        .populate('creatorId', 'name email location')
        .select('-__v')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
      


      // Apply location-based pricing
      const coursesWithPricing = courses.map(course => {
        const courseObj = course.toObject();
        const pricing = calculateLocalizedPrice(courseObj.price, req.pricingConfig);
        
        return {
          ...courseObj,
          pricing: {
            ...pricing,
            location: req.userLocation
          }
        };
      });
      
      const total = await Course.countDocuments(filter);
      
      res.json({
        success: true,
        data: coursesWithPricing,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        },
        location: req.userLocation
      });
    } catch (error) {
      next(error);
    }
  },

  // Get course by ID
  async getCourseById(req, res, next) {
    try {
      const course = await Course.findById(req.params.id)
        .populate('creatorId', 'name email location profileImage')
        .select('-__v');
      
      if (!course || !course.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
      
      // Apply location-based pricing
      const courseObj = course.toObject();
      const pricing = calculateLocalizedPrice(courseObj.price, req.pricingConfig);
      
      const courseWithPricing = {
        ...courseObj,
        pricing: {
          ...pricing,
          location: req.userLocation
        }
      };
      
      res.json({
        success: true,
        data: courseWithPricing
      });
    } catch (error) {
      next(error);
    }
  },



  // Update course
  async updateCourse(req, res, next) {
    try {
      const course = await Course.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('creatorId', 'name email location').select('-__v');
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Course updated successfully',
        data: course
      });
    } catch (error) {
      next(error);
    }
  },



  async deleteCourse(req, res, next) {
    try {
      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getCoursesByCreator(req, res, next) {
    try {
      const { creatorId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      
      const courses = await Course.find({ 
        creatorId, 
        isActive: true 
      })
        .populate('creatorId', 'name email location')
        .select('-__v')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
      
      const total = await Course.countDocuments({ creatorId, isActive: true });
      
      res.json({
        success: true,
        data: courses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = courseController;
