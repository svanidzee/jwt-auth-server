const UserModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const mailService = require('./email-service');
const tokenService = require('./token-service');
const UserDto = require('../dtos/user-dto');
const ApiError = require('../exceptions/api-error');

class UserService {
  async registration(email, password) {
    // check if user exists
    const candidate = await UserModel.findOne({ email });
    // if there is no user throw error
    if (candidate) {
      throw ApiError.BadRequest(`User with ${email} email exists`);
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

  async login(email, password) {
    // check if user exists
    const user = await UserModel.findOne({ email });
    // if no throw error
    if (!user) {
      throw ApiError.BadRequest('User not found');
    }

    // compare password
    const isPassEquals = await bcrypt.compare(password, user.password);
    if (!isPassEquals) {
      throw ApiError.BadRequest('Incorrect password');
    }

    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });

    await tokenService.saveToken(userDto.id, tokens.refreshToken);
    return { ...tokens, user: userDto };
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }

    // validate refresh token
    const userData = tokenService.validateRefreshToken(refreshToken);

    // find in db refresh token
    const tokenFromDb = await tokenService.findToken(refreshToken);

    // if not throw error
    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }

    const user = await UserModel.findById(userData.id);
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });

    await tokenService.saveToken(userDto.id, tokens.refreshToken);
    return { ...tokens, user: userDto };
  }
}

module.exports = new UserService();
