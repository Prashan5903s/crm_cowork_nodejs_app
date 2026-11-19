const Bill = require('../../model/Bill')
const User = require('../../model/User')
const BillType = require('../../model/BillType')
const UserBill = require('../../model/UserBill')
const Apartment = require('../../model/Apartment')
const Maintenance = require('../../model/Maintenance')
const {
    errorResponse,
    successResponse
} = require('../../util/response')

exports.getBillData = async (req, res, next) => {
    try {

        const userId = req.userId;

        const type = req.params.type;

        const bills = await Bill.find({
                created_by: userId,
                bill_data_type: type
            })
            .populate({
                path: 'apartment_id',
                select: 'apartment_no tower_id floor_id apartment_area assigned_to',
                populate: [{
                        path: 'assigned_to'
                    },
                    {
                        path: 'tower_id',
                        select: 'name'
                    }, // Tower fields
                    {
                        path: 'floor_id',
                        select: 'floor_name'
                    } // Floor fields
                ]
            })

            .populate('bill_type')
            .populate({
                path: 'payments',
            });

        if (!bills) {
            return errorResponse(res, "Bill does not exist", {}, 404)
        }

        return successResponse(res, "Bill data fetched successfully", bills)

    } catch (error) {
        next(error)
    }
}

exports.getCreateBill = async (req, res, next) => {
    try {

        const userId = req.userId;

        const data = {};

        const apartment = await Apartment.find({
            created_by: userId,
            status: true,
            assigned_to: {
                $exists: true,
                $ne: null
            }
        }).populate('tower_id').populate('floor_id').populate('assigned_to');

        const billType = await BillType.find();

        if (!apartment || !billType) {
            return errorResponse(res, "Create data does not exist", {}, 404);
        }

        data.apartment = apartment;
        data.billType = billType;

        return successResponse(res, "Data fetched successfully", data, 200);

    } catch (error) {
        next(error)
    }
}

exports.postBillController = async (req, res, next) => {
    try {
        const userId = req.userId;

        let additional_cost;

        let {
            apartment_id,
            bill_type,
            bill_amount,
            bill_date,
            bill_due_date,
            payment_due_date,
            month,
            addtional_cost,
            type,
            year
        } = req.body;

        if (type !== "utilityBills" && type !== "common-area-bill" && type !== 'maintenance') {
            return errorResponse(res, "Type does not exist", {}, 404);
        }

        const file = req.file;

        let user_id = null;

        // If bill is linked to a single apartment
        if (apartment_id) {
            const apartment = await Apartment.findById(apartment_id);
            if (apartment) {
                user_id = apartment.assigned_to;
            }
        }

        // ✅ Normalize additional_cost (always array)
        if (addtional_cost) {
            if (typeof addtional_cost === "string") {
                try {
                    additional_cost = JSON.parse(addtional_cost);
                } catch (e) {
                    additional_cost = addtional_cost;
                }
            }
        } else {
            additional_cost = addtional_cost
        }

        // Create Bill
        const bill = new Bill({
            bill_data_type: type,
            user_id,
            apartment_id: apartment_id || null,
            bill_type: bill_type || null,
            bill_amount,
            bill_date,
            bill_due_date,
            doc_data: file?.filename || null,
            payment_due_date,
            month,
            year,
            additional_cost,
            created_by: userId
        });

        await bill.save();

        // ✅ If type =  3, auto-create UserBills
        if (type == 'maintenance') {
            const users = await User.find({
                created_by: userId,
                user_type: {
                    $ne: "4"
                }
            }).select('_id');
            const userIds = users.map(user => user._id);

            const maintenance = await Maintenance.findOne({
                created_by: userId,
                cost_type: "1"
            })

            if (!maintenance) {
                return errorResponse(res, "Maintenance does not exist", {}, 500)
            }

            const fixedData = maintenance.fixed_data;

            const apartments = await Apartment.find({
                assigned_to: {
                    $in: userIds
                }
            });

            await Promise.all(
                
                apartments.map(item => {

                    const apartmentType = item?.apartment_type;

                    const apartTypAmnt = fixedData.find(
                        item => item.apartment_type.toString() === apartmentType.toString()
                    )?.unit_value ?? null;

                    const userBill = new UserBill({
                        apartment_id: item._id,
                        user_id: item.assigned_to,
                        bill_id: bill._id,
                        amount: apartTypAmnt,
                        created_by: userId
                    });
                    return userBill.save();
                })
            );
        }

        return successResponse(res, "Bill created successfully", {
            bill
        });
    } catch (error) {
        next(error);
    }
};

exports.putBillController = async (req, res, next) => {
    try {
        const userId = req.userId;
        const billId = req.params.billId;

        if (!req.body) {
            return errorResponse(res, "Request body is missing", {}, 400);
        }

        const bill = await Bill.findOne({
            _id: billId,
            created_by: userId
        });
        if (!bill) {
            return errorResponse(res, "Bill does not exist", {}, 404);
        }

        let {
            apartment_id,
            bill_type,
            bill_amount,
            bill_date,
            bill_due_date,
            payment_due_date,
            month,
            addtional_cost,
            type,
            year
        } = req.body;

        if (type !== "utilityBills" && type !== "common-area-bill" && type !== 'maintenance') {
            return errorResponse(res, "Type does not exist", {}, 404);
        }

        //  Parse additional_cost same as in POST
        if (addtional_cost && typeof addtional_cost === "string") {
            try {
                addtional_cost = JSON.parse(addtional_cost);
            } catch (e) {
                addtional_cost = [];
            }
        }

        let user_id = null;

        if (apartment_id) {
            const apartment = await Apartment.findById(apartment_id);
            user_id = apartment.assigned_to;
        }

        await Bill.findByIdAndUpdate(
            billId, {
                bill_data_type: type,
                apartment_id: apartment_id || null,
                bill_type: bill_type || null,
                bill_amount,
                bill_date,
                user_id,
                bill_due_date,
                payment_due_date,
                month,
                year,
                additional_cost: addtional_cost,
                updated_at: new Date(),
                created_by: userId
            }, {
                new: true
            }
        );

        return successResponse(res, "Bill updated successfully");
    } catch (error) {
        next(error);
    }
};