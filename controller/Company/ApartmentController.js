const Tower = require('../../model/Tower')
const Apartment = require('../../model/Apartment');
const ApartmentType = require('../../model/PropertyType');
const { errorResponse, successResponse } = require('../../util/response');

exports.getApartmentAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const apartment = await Apartment.find({ created_by: userId })
            .populate('tower_id')
            .populate('floor_id')
            .populate('assigned_to', '_id first_name last_name')
            .populate('apartment_type')
            .sort({ "apartment_no": 1 })

        if (!apartment) {
            return errorResponse(res, "Apartment does not exist", {}, 404)
        }

        return successResponse(res, "Apartment fetched successfully", apartment)

    } catch (error) {
        next(error)
    }
}

exports.createApartmentAPI = async (req, res, next) => {
    try {
        const userId = req.userId;

        const data = {}

        const apartmentType = await ApartmentType.find({ created_by: userId })

        const towers = await Tower.find({ created_by: userId }).sort({ "name": 1 }).populate('floors');

        if (!towers || !apartmentType) {
            return errorResponse(res, "Apartment does not exist", {}, 404)
        }

        data['towers'] = towers
        data['apartmentType'] = apartmentType

        return successResponse(res, "Apartment fetched successfully", data)

    } catch (error) {
        next(error)
    }
}

exports.postApartmentAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const { tower, floor, apartmentNumber, area, apartmentType, status } = req.body

        const apartment = new Apartment({
            tower_id: tower,
            floor_id: floor,
            apartment_no: apartmentNumber,
            apartment_area: area,
            apartment_type: apartmentType,
            status: status == 'active',
            created_by: userId

        })

        await apartment.save()

        return successResponse(res, 'Apartment created successfully')

    } catch (error) {
        next(error)
    }
}

exports.updateApartmentAPI = async (req, res, next) => {
    try {

        const userId = req.userId;
        const apartmentId = req.params.apartmentId;

        const { tower, floor, apartmentNumber, area, apartmentType, status } = req.body

        const apartment = await Apartment.findOne({ created_by: userId, _id: apartmentId })

        if (!apartment) {
            return errorResponse(res, "Apartment does not exist", {}, 404)
        }

        await Apartment.findOneAndUpdate({ created_by: userId, _id: apartmentId }, {
            tower_id: tower,
            floor_id: floor,
            apartment_no: apartmentNumber,
            apartment_area: area,
            apartment_type: apartmentType,
            status: status == 'active',
            created_by: userId
        })

        return successResponse(res, "Apartment updated successfully")

    } catch (error) {
        next(error)
    }
}