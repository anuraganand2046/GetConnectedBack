const express= require('express');
const router= express.Router();
const User= require('../models/user');
const isAuth= require('../middleware/is-auth');
const {body}= require('express-validator/check');
const authController= require('../controllers/auth');
router.put('/signup', [
    body('email').isEmail().withMessage('Please enter a valid email.')
    .custom((value, {req})=>{//this checks that the email is new or already taken.
        return User.findOne({email: value}).then(userDoc=>{//we are checking the db if that user exist or is new one.
            if(userDoc){
                return Promise.reject('Email-Address already exists!!');//rejects the email signup req with the given message.
            }
        })
    }).normalizeEmail(),
    body('password').trim().isLength({min: 5}),
    body('name').trim().not().isEmpty()//write not() if the next properties should be false
], authController.signup);
router.post('/login', authController.login);
router.get('/status', isAuth, authController.getUserStatus);
router.patch('/status', isAuth, [
    body('status').trim().not().isEmpty()
], authController.updateUserStatus);
module.exports= router;



//array of validation related middleware.