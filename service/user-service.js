const UserModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./email-service');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');

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
    await mailService.sendActivationMail(
      email,
      `${process.env.API_URL}/api/activate/${activationLink}`,
    );

    const userDto = new UserDto(user); // id, email, isActivated
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return { ...tokens, user: userDto };
  }

  async activate(activationLink) {
    const user = await UserModel.findOne({ activationLink });
    if (!user) {
      throw ApiError.BadRequest('Invalid activation link');
    }
    user.isActivated = true;
    await user.save();
  }
}

module.exports = new UserService();
