const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const validateRequest = require('../middlewares/validation');
const { applyLocationPricing } = require('../middlewares/locationPricing');
const { createPackageSchema } = require('../validations/packageValidation');

router.use(applyLocationPricing);

router.post('/create', validateRequest(createPackageSchema), packageController.createPackage);

router.post('/auto-create', packageController.autoCreatePackages);

router.get('/', packageController.getAllPackages);

router.get('/creator/:creatorId', packageController.getPackagesByCreator);

router.get('/:id', packageController.getPackageById);

router.put('/:id', packageController.updatePackage);

router.delete('/:id', packageController.deletePackage);

module.exports = router;
