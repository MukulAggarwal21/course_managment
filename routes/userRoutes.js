const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validateRequest = require('../middlewares/validation');
const { createUserSchema, updateUserSchema } = require('../validations/userValidation');

router.post('/', validateRequest(createUserSchema), userController.createUser);

router.get('/', userController.getAllUsers);

router.get('/:id', userController.getUserById);

router.put('/:id', validateRequest(updateUserSchema), userController.updateUser);

router.delete('/:id', userController.deleteUser);

module.exports = router;
