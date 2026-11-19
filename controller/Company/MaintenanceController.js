const Maintenance = require('../../model/Maintenance');
const ApartmentType = require('../../model/PropertyType');
const {
    errorResponse,
    successResponse
} = require('../../util/response');

exports.getMaintenanceAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        let finalData;

        const maintenance = await Maintenance.find({
            created_by: userId,
        })

        if (!maintenance) {
            finalData = {}
        } else {
            finalData = maintenance
        }

        return successResponse(res, "Maintenance fetched successfully", finalData)

    } catch (error) {
        next(error)
    }
}

exports.createApartmentTypeController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const apartmentType = await ApartmentType.find({
            created_by: userId
        });

        if (!apartmentType) {
            return errorResponse(res, "Apartment type does not exist", {}, 404)
        }

        return successResponse(res, "Apartment fetched successfully", apartmentType)

    } catch (error) {
        next(error)
    }
}

exports.postMaintenanceAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const {
            unit_data
        } = req.body;

        const type = req.params.type;

        const maintenance = await Maintenance.findOne({
            created_by: userId,
            cost_type: type
        })

        const oldMaintenance = await Maintenance.findOne({
            created_by: userId,
            cost_type: (type == "2" || type == 2) ? "1" : "2"
        })

        if (type == "1") {

            const result = Object.entries(unit_data).map(([key, value]) => ({
                apartment_type: String(key),
                unit_value: String(value)
            }));

            if (!maintenance) {

                const maintenances = new Maintenance({
                    fixed_data: result,
                    created_by: userId,
                    cost_type: type,
                    status: true
                })

                await maintenances.save()

            } else {

                await Maintenance.findOneAndUpdate({
                    created_by: userId,
                    cost_type: type
                }, {
                    fixed_data: result,
                    status: true
                })

            }

        } else {

            if (!maintenance) {

                const maintenances = new Maintenance({
                    unit_type: unit_data,
                    created_by: userId,
                    cost_type: type,
                    status: true
                })

                await maintenances.save()

            } else {

                await Maintenance.findOneAndUpdate({
                    created_by: userId,
                    cost_type: type,
                }, {
                    unit_type: unit_data,
                    status: true,
                })

            }
        }

        if (oldMaintenance) {
            await Maintenance.findOneAndUpdate({
                created_by: userId,
                cost_type: (type == "2" || type == 2) ? "1" : "2"
            }, {
                status: false
            })
        }

        return successResponse(res, "Maintenance setting updated successfully")


    } catch (error) {
        next(error)
    }
}