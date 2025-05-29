const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title must not exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description must not exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: [0, 'Price must be a positive number'],
    max: [10000, 'Price must not exceed $10,000']
  },
  image: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Course image must be a valid URL'
    }
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: ['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other']
  },
  duration: {
    type: Number, // in hours
    min: [0.5, 'Duration must be at least 0.5 hours'],
    max: [500, 'Duration must not exceed 500 hours']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
courseSchema.index({ creatorId: 1, price: 1 });
courseSchema.index({ category: 1, level: 1 });

module.exports = mongoose.model('Course', courseSchema);
