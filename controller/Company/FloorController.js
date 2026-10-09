const Floor = require('../../model/Floor');
const Tower = require('../../model/Tower');
const { successResponse, errorResponse } = require('../../util/response');

exports.getFloorAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const floor = await Floor.find({ created_by: userId }).sort({ "floor_name": 1 }).populate('tower_id')

        if (!floor) {
            return errorResponse(res, "Floor does not exist", {}, 404)
        }

        return successResponse(res, "FLoor fetched successfully", floor)


    } catch (error) {
        next(error)
    }
}

exports.getCreateAPI = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const tower = await Tower.find({ created_by: userId })

        if (!tower) {
            return errorResponse(res, "Tower does not exist", {}, 404)
        }

        return successResponse(res, "Tower data fetched successfully", tower)

    } catch (error) {
        next(error)
    }
}

exports.postFloorController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name, tower_id } = req.body;

        const floor = new Floor({
            floor_name: name,
            tower_id,
            created_by: userId,
            status: true
        })

        await floor.save()

        return successResponse(res, "Floor created successfully", floor)

    } catch (error) {
        next(error)
    }
}

exports.updateFloorAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const floorId = req.params.floorId;

        const { name, tower_id } = req.body;

        const floor = await Floor.findOne({ created_by: userId, _id: floorId })

        if (!floor) {
            return errorResponse(res, "Floor does not exist", {}, 404)
        }

        await Floor.findByIdAndUpdate(floorId, {
            floor_name: name,
            tower_id,
            created_by: userId
        })

        return successResponse(res, "Floor fetched successfully")

    } catch (error) {
        next(error)
    }
}