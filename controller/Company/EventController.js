const Event = require('../../model/Event');
const Role = require('../../model/Role')
const User = require('../../model/User')
const {
    errorResponse,
    successResponse
} = require('../../util/response');

exports.getEventAPIController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const event = await Event.find({
            created_by: userId
        })

        if (!event) {
            return errorResponse(res, "Event does not exist", {}, 404)
        }

        return successResponse(res, "Event fetched successfully", event)

    } catch (error) {
        next(error)
    }
}

exports.createEventController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const role = await Role.find({
                created_by: {
                    $in: [userId, "68bc14b6b297142d6bfe639c"]
                }
            })
            .select('type name description status permissions created_by')
            .populate('company_id', 'first_name last_name email');

        const user = await User.find({
            created_by: userId,
            user_type: {
                $ne: "4"
            }
        })

        if (!role || !user) {
            return errorResponse(res, "Data does not exist", {}, 404)
        }

        const data = {
            role,
            user
        }

        return successResponse(res, "Create data fetched successfully", data)

    } catch (error) {
        next(error)
    }
}

exports.postEventControllerAPI = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const imageUrl = req.file ? req.file.filename : '';

        const {
            event_name,
            description,
            end_on_date,
            end_on_time,
            role_id,
            role_or_user,
            start_on_date,
            start_on_time,
            status,
            user_id,
            venue
        } = req.body;

        const event = new Event({
            event_name,
            description,
            end_on_date,
            end_on_time,
            image_url: imageUrl,
            role_id,
            user_id,
            start_on_date,
            start_on_time,
            venue,
            created_by: userId,
            status
        })

        await event.save()

        return successResponse(res, "Event saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateEventControllerAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const id = req.params.id;

        const imageUrl = req.file ? req.file.filename : '';

        const {
            event_name,
            description,
            end_on_date,
            end_on_time,
            role_id,
            role_or_user,
            start_on_date,
            start_on_time,
            status,
            user_id,
            venue
        } = req.body;

        await Event.findOneAndUpdate(({
            created_by: userId,
            _id: id
        }), ({
            event_name,
            description,
            end_on_date,
            end_on_time,
            image_url: imageUrl,
            role_id,
            user_id,
            start_on_date,
            start_on_time,
            venue,
            created_by: userId,
            status
        }))

        return successResponse(res, "Event updated successfully")

    } catch (error) {
        next(error)
    }
}