const ApiError = require('../exceptions/api-error');
const tokenService = require('../service/token-service');

module.exports = function (req, res, next) {
  // GET /api/users
  // this route is avialable only for authorized users
  try {
    // Bearer accessToken in Authorization header
    const authorizationHeader = req.headers.authorization;
    // console.log(authorizationHeader);
    // if no header implemented when make req throw error
    if (!authorizationHeader) {
      return next(ApiError.UnauthorizedError());
    }

    // from token split Bearer and other part of token
    const accessToken = authorizationHeader.split(' ')[1];
    // console.log(accessToken);
    // if no token throw error
    if (!accessToken) {
      return next(ApiError.UnauthorizedError());
    }

    // validate token
    const userData = tokenService.validateAccessToken(accessToken);
    // if error occurs while validation and userData is null throw error
    console.log(userData);
    if (!userData) {
      return next(ApiError.UnauthorizedError());
    }

    req.user = userData;
    next();
  } catch (e) {
    return next(ApiError.UnauthorizedError());
  }
};
