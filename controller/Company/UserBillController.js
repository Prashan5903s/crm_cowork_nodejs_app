const Apartment = require('../../model/Apartment')
const UserBill = require('../../model/UserBill');
const Bill = require('../../model/Bill')
const Counter = require('../../model/Counter')
const User = require('../../model/User')
const Payment = require('../../model/Payment');
const Maintenance = require('../../model/Maintenance')
const mongoose = require('mongoose')

const {
    errorResponse,
    successResponse
} = require('../../util/response');

exports.getUserBillController = async (req, res, next) => {
    try {

        const billId = req.params.billId;

        const userId = req.userId;

        let data = {};

        const userBills = await UserBill.find({
            bill_id: billId
        }).select('apartment_id');

        const apartmentIds = userBills.map(b => b.apartment_id);

        const apartments = await Apartment.aggregate([{
                $match: {
                    created_by: new mongoose.Types.ObjectId(userId),
                    status: true,
                    assigned_to: {
                        $ne: null
                    },
                    _id: {
                        $in: apartmentIds.map(id => new mongoose.Types.ObjectId(id))
                    }
                }
            },

            // bring user bills
            {
                $lookup: {
                    from: "user_bills",
                    localField: "_id",
                    foreignField: "apartment_id",
                    as: "user_bills"
                }
            },
            {
                $addFields: {
                    user_bills: {
                        $filter: {
                            input: "$user_bills",
                            as: "ub",
                            cond: {
                                $eq: ["$$ub.bill_id", new mongoose.Types.ObjectId(billId)]
                            }
                        }
                    }
                }
            },

            // bring bill details
            {
                $lookup: {
                    from: "bills",
                    localField: "user_bills.bill_id",
                    foreignField: "_id",
                    as: "bill_details"
                }
            },
            {
                $addFields: {
                    user_bills: {
                        $map: {
                            input: "$user_bills",
                            as: "ub",
                            in: {
                                $mergeObjects: [
                                    "$$ub",
                                    {
                                        bill: {
                                            $arrayElemAt: [{
                                                    $filter: {
                                                        input: "$bill_details",
                                                        as: "bd",
                                                        cond: {
                                                            $eq: ["$$bd._id", "$$ub.bill_id"]
                                                        }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    bill_details: 0
                }
            },

            // bring payments related to user_bills
            {
                $lookup: {
                    from: "payments",
                    let: {
                        userBillIds: "$user_bills._id"
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $in: ["$user_bill_id", "$$userBillIds"]
                            }
                        }
                    }],
                    as: "payments"
                }
            },
            {
                $addFields: {
                    user_bills: {
                        $map: {
                            input: "$user_bills",
                            as: "ub",
                            in: {
                                $mergeObjects: [
                                    "$$ub",
                                    {
                                        payments: {
                                            $filter: {
                                                input: "$payments",
                                                as: "p",
                                                cond: {
                                                    $eq: ["$$p.user_bill_id", "$$ub._id"]
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    payments: 0
                }
            },

            // bring assigned user details
            {
                $lookup: {
                    from: "users",
                    localField: "assigned_to",
                    foreignField: "_id",
                    as: "assigned_user"
                }
            },
            {
                $unwind: {
                    path: "$assigned_user",
                    preserveNullAndEmptyArrays: true
                }
            },

            // ✅ bring tower details
            {
                $lookup: {
                    from: "towers",
                    localField: "tower_id",
                    foreignField: "_id",
                    as: "tower"
                }
            },
            {
                $unwind: {
                    path: "$tower",
                    preserveNullAndEmptyArrays: true
                }
            },

            // ✅ bring floor details
            {
                $lookup: {
                    from: "floors",
                    localField: "floor_id",
                    foreignField: "_id",
                    as: "floor"
                }
            },
            {
                $unwind: {
                    path: "$floor",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Optional: clean projection
            {
                $project: {
                    "tower.created_by": 0,
                    "tower.__v": 0,
                    "floor.created_by": 0,
                    "floor.__v": 0,
                }
            }
        ]);

        let maintenance = await Maintenance.findOne({
            created_by: userId,
            status: true,
        });

        if (!maintenance) {
            maintenance = await Maintenance.findOne({
                created_by: userId,
                status: true,
            });
        }

        const fixedCost = maintenance?.fixed_data.length > 0 ? maintenance?.fixed_data : maintenance?.unit_type || [];

        if (!apartments || !fixedCost) {
            return errorResponse(res, 'User bill does not exist', {}, 404)
        }

        data['userBill'] = apartments;

        data['fixedCost'] = fixedCost;

        return successResponse(res, 'User bill fetched successfully', data)

    } catch (error) {
        next(error)
    }
}

exports.postUserBillController = async (req, res, next) => {
    try {
        const userId = req.userId;

        const {
            bank_name,
            amount,
            status,
            billId,
            apartment_id,
            userBillId,
            paid_remark,
            payment_mode,
            cheque_no,
            cheque_date,
            demand_draft_no,
            demand_draft_date,
            neft_no,
            neft_date,
        } = req.body;

        const payment = new Payment({
            bank_name,
            amount: Number(amount),
            cheque_no,
            user_bill_id: userBillId,
            created_by: userId,
            bill_id: billId,
            cheque_date,
            demand_draft_no,
            payment_mode: payment_mode,
            demand_draft_date,
            paid_remark,
            neft_no,
            neft_date,
            status,
        });

        await payment.save();

        return successResponse(res, "Payment saved successfully");
    } catch (error) {
        next(error);
    }
};