const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../../model/BlacklistedToken');
const User = require('../../model/User')
const bcrypt = require('bcryptjs')
const {
    errorResponse,
    successResponse
} = require('../../util/response');
const jwtSecretKey = process.env.JWT_SECRET;

exports.getLogOutController = async (req, res, next) => {
    try {
        const authHeader = req.get('Authorization');
        if (!authHeader) {
            return errorResponse(res, "Not authenticated: Missing Authorization header", {}, 404)
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return errorResponse(res, "Not authenticated: Token missing", {}, 404)
        }

        // Verify token
        const decoded = jwt.verify(token, jwtSecretKey);

        // Save to blacklist
        const expiresAt = new Date(decoded.exp * 1000); // convert exp (seconds) to ms

        await BlacklistedToken.create({
            token,
            expiresAt
        });

        return successResponse(res, "User logged out successfully")

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, "Token already expired", {}, 404)
        }
        next(err);
    }
};

exports.changePasswordController = async (req, res, next) => {
    try {
        const {
            oldPassword,
            password,
            confirmPassword
        } = req.body;

        const userId = req?.userId;

        if (!oldPassword || !password || !confirmPassword) {
            return errorResponse(res, "All fields are required", {}, 404)
        }

        if (password !== confirmPassword) {
            return errorResponse(res, "Passwords do not match", {}, 500)
        }

        const user = await User.findById(userId);

        if (!user) {
            return errorResponse(res, "User not found", {}, 404)
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isMatch) {
            return errorResponse(res, "Old password is incorrect", {}, 500)
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        user.password = hashedPassword;

        await user.save();

        // 7. Respond success
        return successResponse(res, "Password changes successfully")

    } catch (err) {
        next(err)
    }
};

exports.getUserProfileData = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const user = await User.findById(userId)

        if (!user) {
            return errorResponse(res, "User does not exist", {}, 404)
        }

        return successResponse(res, "User data fetched successfully", user)

    } catch (error) {
        next(error)
    }
}