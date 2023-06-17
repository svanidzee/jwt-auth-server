const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./email-service');

class UserService {
  async registration(email, password) {
    // check if user exists
    const candidate = await UserModel.findOne({ email });
    // if there is no user throw error
    if (candidate) {
      throw new Error(`Username with this email:${email} exists`);
    }

    // hash password
    const hashPassword = await bcrypt.hash(password, 3);

    // generate activation link(random unique string via uuid)
    const activationLink = uuid.v4();

    // create user with email,password and activationlink
    const user = await UserModel.create({ email, password: hashPassword, activationLink });

    // send to user activation link we created
    await mailService.sendActivationMail(email, activationLink);
  }
}

module.exports = new UserService();
