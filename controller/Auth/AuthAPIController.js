require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../model/User');
const jwtSecretKey = process.env.JWT_SECRET;
const validate = require('../../util/validation');
const expireTime = process.env.token_expire_time;
const PermissionUtil = require("../../util/perArr");
const {
    errorResponse
} = require('../../util/response');

exports.postAPILogIn = async (req, res, next) => {
    try {
        //  Validate request body
        if (!validate(req, res)) return;

        const {
            email,
            password,
            fcm_token,
            isNotMobile = false
        } = req.body;

        //  Ensure email is trimmed & lowercase (case-insensitive login)
        const normalizedEmail = email;

        //  Find user (no decrypt — your DB stores plain emails)
        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                status: "Failure",
                statusCode: 401,
                message: "A user with this email cannot be found!"
            });
        }

        //  Check account status
        if (!user.status) {
            return res.status(400).json({
                status: "Failure",
                statusCode: 400,
                message: "Your account is deactivated!"
            });
        }

        //  Compare password
        const isEqual = await bcrypt.compare(password, user.password);

        if (!isEqual) {

            return res.status(401).json({
                status: "Failure",
                statusCode: 401,
                message: "Wrong password!"
            });
        }


        if (!isNotMobile) {

            const perms_arr = await PermissionUtil(user._id)

            const finalPer = perms_arr?.data;

            if (finalPer?.["notUser"]) {

                return errorResponse(res, "Only user allowed", {}, 404)
            }

        }


        // Update FCM token (optional)
        if (fcm_token && fcm_token.trim() !== "") {
            user.fcm_token = fcm_token.trim();
            await user.save().catch(err => console.error("⚠️ FCM token update failed:", err));
        }

        const formatted = user?.apartment_data?.map(item => ({
            apartment_no: item.apartment_id?.apartment_no || null,
            floor_name: item.floor_id?.floor_name || null,
            tower_name: item.tower_id?.name || null,
        }));

        //  Generate JWT token
        const expiresInSeconds = expireTime * 60 * 60; // convert hours → seconds
        const expirationTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;

        const token = jwt.sign({
            email: user.email,
            userId: user._id.toString(),
        },
            jwtSecretKey, {
            expiresIn: `${expireTime}h`
        }
        );

        //  Success response
        return res.status(200).json({
            status: "Success",
            statusCode: 200,
            message: "User logged in successfully!",
            token: token,
            expiresAt: expirationTimestamp,
            userId: user._id.toString(),
            email: user.email,
            no_of_members: (!user.no_of_members || user.no_of_members === "null") ?
                0 :
                Number(user.no_of_members),
            vehicle_data: user.vehicle_data || [],
            apartment_data: formatted || [],
            photo: user.photo || "",
            no_of_pets: (!user.no_of_pets || user.no_of_pets === "null") ?
                0 :
                Number(user.no_of_pets),
            vehicle_count: user?.vehicle_data?.length || 0,
            neighbour_data: user.neighbour_data || [],
            friend_data: user.friend_relative_data || [],
            name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        });

    } catch (err) {

        console.error("❌ Login error:", err);

        return res.status(500).json({
            status: "Failure",
            statusCode: 500,
            message: "An internal server error occurred.",
            error: err.message,
        });
    }
};