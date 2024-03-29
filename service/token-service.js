const jwt = require('jsonwebtoken');
const tokenModel = require('../models/token-model');

class TokenService {
  // generate jwt access and refresh tokens:
  // refresh token has life time about 1 or 2 months.
  // access token has expire time about 10 to 15 minutes.
  // when ever this access token expire.we don't ask user to login again to get new access token instead we
  // send refresh token to the server here we verify that token and send new access token to the client.
  // with this method user don't have to login again and again.
  // this makes user experience much more easier to user

  // access token
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '35m' });
    return { accessToken, refreshToken };
  }

  validateAccessToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      return userData;
    } catch (e) {
      return null;
    }
  }

  validateRefreshToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      return userData;
    } catch (e) {
      return null;
    }
  }

  // save refresh token in db
  async saveToken(userId, refreshToken) {
    const tokenData = await tokenModel.findOne({ user: userId });
    if (tokenData) {
      tokenData.refreshToken = refreshToken;
      return tokenData.save(); // update refresh token in db
    }

    // logic if user registers first time(refresh token does not exists)
    const token = await tokenModel.create({ user: userId, refreshToken });
    return token;
  }

  async removeToken(refreshToken) {
    const tokenData = await tokenModel.deleteOne({ refreshToken });
    return tokenData;
  }

  async findToken(refreshToken) {
    const tokenData = await tokenModel.findOne({ refreshToken });
    return tokenData;
  }
}

module.exports = new TokenService();
