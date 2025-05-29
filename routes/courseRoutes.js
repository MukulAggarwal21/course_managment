const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const validateRequest = require('../middlewares/validation');
const { applyLocationPricing } = require('../middlewares/locationPricing');
const { createCourseSchema, updateCourseSchema } = require('../validations/courseValidation');

router.use(applyLocationPricing);

router.post('/', validateRequest(createCourseSchema), courseController.createCourse);

router.get('/', courseController.getAllCourses);

router.get('/creator/:creatorId', courseController.getCoursesByCreator);

router.get('/:id', courseController.getCourseById);

router.put('/:id', validateRequest(updateCourseSchema), courseController.updateCourse);

router.delete('/:id', courseController.deleteCourse);

module.exports = router;
