const Tower = require('../../model/Tower');
const { errorResponse, successResponse } = require('../../util/response');

exports.getTowerAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const tower = await Tower.find({ created_by: userId }).sort({ 'name': 1 })

        if (!tower) {
            return errorResponse(res, "Tower does not exist", {}, 404)
        }

        return successResponse(res, "Tower fetched successfull", tower)

    } catch (error) {
        next(error)
    }
}

exports.postTowerAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const { name } = req.body

        const tower = new Tower({
            name,
            status: true,
            created_by: userId
        })

        await tower.save();

        return successResponse(res, 'Tower added successfully')

    } catch (error) {
        next(error)
    }
}

exports.putTowerAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const { name } = req.body;

        const towerId = req.params.towerId;

        const towers = await Tower.findOne({ _id: towerId, created_by: userId })

        if (!towers) {
            return errorResponse(res, "Tower does not exist", {}, 404)
        }

        await Tower.findOneAndUpdate({ _id: towerId, created_by: userId }, {
            name
        })

        return successResponse(res, "Tower updated successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateTowerAPI = async (req, res, next) => {
    try {

    } catch (error) {
        next(error)
    }
}

exports.getCreateTowerAPI = async (req, res, next) => {
    try {

    } catch (error) {
        next(error)
    }
}