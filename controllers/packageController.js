const Package = require('../models/Package');
const Course = require('../models/Course');
const User = require('../models/User');
const { calculateLocalizedPrice } = require('../middlewares/locationPricing');
const { v4: uuidv4 } = require('uuid');

const packageController = {
  // Create a new package
  async createPackage(req, res, next) {
    try {
      const { courses: courseIds, creatorId, title, image, discount = 0 } = req.body;
      
      // Verify creator exists
      const creator = await User.findById(creatorId);
      if (!creator) {
        return res.status(404).json({
          success: false,
          message: 'Creator not found'
        });
      }
      
      // Verify all courses exist and belong to the creator
      const courses = await Course.find({
        _id: { $in: courseIds },
        creatorId,
        isActive: true
      });
      
      if (courses.length !== courseIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some courses not found or do not belong to the creator'
        });
      }
      
      // Calculate total price
      const totalPrice = courses.reduce((sum, course) => sum + course.price, 0);
      const discountedPrice = totalPrice * (1 - discount / 100);
      
      const packageData = {
        packageId: uuidv4(),
        title,
        courses: courseIds,
        creatorId,
        image,
        totalPrice: discountedPrice,
        discount
      };
      
      const newPackage = new Package(packageData);
      await newPackage.save();
      
      // Populate the package with course and creator details
      await newPackage.populate([
        {
          path: 'courses',
          select: 'title description price category level image'
        },
        {
          path: 'creatorId',
          select: 'name email location'
        }
      ]);
      
      res.status(201).json({
        success: true,
        message: 'Package created successfully',
        data: newPackage
      });
    } catch (error) {
      next(error);
    }
  },

  // Auto-create packages based on similar pricing
  async autoCreatePackages(req, res, next) {
    try {
      const { creatorId } = req.body;
      
      // Verify creator exists
      const creator = await User.findById(creatorId);
      if (!creator) {
        return res.status(404).json({
          success: false,
          message: 'Creator not found'
        });
      }
      
      // Get all courses by creator
      const courses = await Course.find({ 
        creatorId, 
        isActive: true 
      }).sort({ price: 1 });
      
      if (courses.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Creator must have at least 2 courses to create packages'
        });
      }
      
      // Group courses by price ranges
      const basicCourses = courses.filter(course => course.price <= 25);
      const premiumCourses = courses.filter(course => course.price > 25 && course.price <= 75);
      const exclusiveCourses = courses.filter(course => course.price > 75);
      
      const packagesCreated = [];
      
      // Create Basic Pack
      if (basicCourses.length >= 2) {
        const basicPackage = new Package({
          packageId: uuidv4(),
          title: 'Basic Pack',
          courses: basicCourses.map(c => c._id),
          creatorId,
          totalPrice: basicCourses.reduce((sum, c) => sum + c.price, 0) * 0.9, // 10% discount
          discount: 10
        });
        await basicPackage.save();
        packagesCreated.push(basicPackage);
      }
      
      // Create Premium Pack
      if (premiumCourses.length >= 2) {
        const premiumPackage = new Package({
          packageId: uuidv4(),
          title: 'Premium Pack',
          courses: premiumCourses.map(c => c._id),
          creatorId,
          totalPrice: premiumCourses.reduce((sum, c) => sum + c.price, 0) * 0.85, // 15% discount
          discount: 15
        });
        await premiumPackage.save();
        packagesCreated.push(premiumPackage);
      }
      
      // Create Exclusive Pack
      if (exclusiveCourses.length >= 2) {
        const exclusivePackage = new Package({
          packageId: uuidv4(),
          title: 'Exclusive Pack',
          courses: exclusiveCourses.map(c => c._id),
          creatorId,
          totalPrice: exclusiveCourses.reduce((sum, c) => sum + c.price, 0) * 0.8, // 20% discount
          discount: 20
        });
        await exclusivePackage.save();
        packagesCreated.push(exclusivePackage);
      }
      
      // Populate packages
      for (let pkg of packagesCreated) {
        await pkg.populate([
          {
            path: 'courses',
            select: 'title description price category level image'
          },
          {
            path: 'creatorId',
            select: 'name email location'
          }
        ]);
      }
      
      res.status(201).json({
        success: true,
        message: `${packagesCreated.length} packages created successfully`,
        data: packagesCreated
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllPackages(req, res, next) {
    try {
      const { page = 1, limit = 10, creatorId, title } = req.query;
      const skip = (page - 1) * limit;
      
      const filter = { isActive: true };
      if (creatorId) filter.creatorId = creatorId;
      if (title) filter.title = title;
      
      const packages = await Package.find(filter)
        .populate([
          {
            path: 'courses',
            select: 'title description price category level image'
          },
          {
            path: 'creatorId',
            select: 'name email location'
          }
        ])
        .select('-__v')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
      
      const packagesWithPricing = packages.map(pkg => {
        const packageObj = pkg.toObject();
        const pricing = calculateLocalizedPrice(packageObj.totalPrice, req.pricingConfig);
        
        return {
          ...packageObj,
          pricing: {
            ...pricing,
            location: req.userLocation
          }
        };
      });
      
      const total = await Package.countDocuments(filter);
      
      res.json({
        success: true,
        data: packagesWithPricing,
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

  // Get package by ID
  async getPackageById(req, res, next) {
    try {
      const package = await Package.findById(req.params.id)
        .populate([
          {
            path: 'courses',
            select: 'title description price category level image duration'
          },
          {
            path: 'creatorId',
            select: 'name email location profileImage'
          }
        ])
        .select('-__v');
      
      if (!package || !package.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }
      
      // Apply location-based pricing
      const packageObj = package.toObject();
      const pricing = calculateLocalizedPrice(packageObj.totalPrice, req.pricingConfig);
      
      const packageWithPricing = {
        ...packageObj,
        pricing: {
          ...pricing,
          location: req.userLocation
        }
      };
      
      res.json({
        success: true,
        data: packageWithPricing
      });
    } catch (error) {
      next(error);
    }
  },

  // Update package
  async updatePackage(req, res, next) {
    try {
      const { courses: courseIds, discount } = req.body;
      
      let updateData = { ...req.body };
      
      // If courses are being updated, recalculate total price
      if (courseIds) {
        const courses = await Course.find({
          _id: { $in: courseIds },
          isActive: true
        });
        
        if (courses.length !== courseIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Some courses not found'
          });
        }
        
        const totalPrice = courses.reduce((sum, course) => sum + course.price, 0);
        const discountAmount = discount || 0;
        updateData.totalPrice = totalPrice * (1 - discountAmount / 100);
      }
      
      const package = await Package.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate([
          {
            path: 'courses',
            select: 'title description price category level image'
          },
          {
            path: 'creatorId',
            select: 'name email location'
          }
        ])
        .select('-__v');
      
      if (!package) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Package updated successfully',
        data: package
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete package
  async deletePackage(req, res, next) {
    try {
      const package = await Package.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      
      if (!package) {
        return res.status(404).json({
          success: false,
          message: 'Package not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Package deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get packages by creator
  async getPackagesByCreator(req, res, next) {
    try {
      const { creatorId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      
      const packages = await Package.find({ 
        creatorId, 
        isActive: true 
      })
        .populate([
          {
            path: 'courses',
            select: 'title description price category level image'
          },
          {
            path: 'creatorId',
            select: 'name email location'
          }
        ])
        .select('-__v')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
      
      const total = await Package.countDocuments({ creatorId, isActive: true });
      
      res.json({
        success: true,
        data: packages,
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

module.exports = packageController;