const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  packageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Package title is required'],
    trim: true,
    enum: ['Basic Pack', 'Premium Pack', 'Exclusive Pack']
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }],
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  image: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Package image must be a valid URL'
    }
  },
  totalPrice: {
    type: Number,
    min: [0, 'Total price must be positive']
  },
  discount: {
    type: Number,
    min: [0, 'Discount must be positive'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0
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

packageSchema.index({ creatorId: 1 });

module.exports = mongoose.model('Package', packageSchema);