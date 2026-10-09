const Bill = require('../../model/Bill')
const User = require('../../model/User')
const Tower = require('../../model/Tower')
const Visitor = require('../../model/Visitor')
const UserBill = require('../../model/UserBill')
const Notice = require('../../model/Notice')
const Maintenance = require("../../model/Maintenance")
const Complain = require('../../model/Complain')
const Apartment = require('../../model/Apartment');
const {
    errorResponse,
    successResponse
} = require('../../util/response');

async function getComplainsByStatus(userIds, status) {
    return await Complain.aggregate([{
            $match: {
                created_by: {
                    $in: userIds
                } // expects array of ObjectIds
            }
        },
        {
            $lookup: {
                from: "complain_users",
                let: {
                    complainId: "$_id"
                },
                pipeline: [{
                        $match: {
                            $expr: {
                                $eq: ["$complain_id", "$$complainId"]
                            }
                        }
                    },
                    {
                        $sort: {
                            created_at: -1
                        }
                    },
                    {
                        $limit: 1
                    }
                ],
                as: "latest_complain_user"
            }
        },
        {
            $unwind: {
                path: "$latest_complain_user",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                "latest_complain_user.complaint_status": status
            }
        }
    ]);
}

exports.getDashboardDataAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const tower = await Tower.find({
            created_by: userId
        })

        const apartment = await Apartment.find({
            created_by: userId
        })

        const unsoldApartment = await Apartment.find({
            created_by: userId,
            status: false
        })

        const owner = await User.find({
            created_by: userId,
            user_type: {
                $ne: "4"
            }
        })

        const user = await User.find({
            created_by: userId,
            user_type: {
                $ne: "4"
            }
        }).select('_id');

        const userIds = user.map(o => o._id); // Keep as ObjectId, don't convert to string

        const pendingComplain = await getComplainsByStatus(userIds, "1");
        const inProgressComplain = await getComplainsByStatus(userIds, "4");
        const resolvedComplain = await getComplainsByStatus(userIds, "3");

        const paidCommanAreaBill = await Bill.find({
            status: true,
            bill_data_type: "common-area-bill",
            created_by: userId
        }).populate('apartment_id').populate('bill_type').populate({
            path: "payments",
            model: "Payment"
        });

        const unpaidCommanAreaBill = await Bill.find({
                status: false,
                bill_data_type: "common-area-bill",
                created_by: userId
            })
            .populate('apartment_id')
            .populate('bill_type')
            .populate({
                path: "payments",
                model: "Payment"
            });


        const utilityBill = await Bill.find({
            created_by: userId,
            bill_data_type: "utilityBills"
        }).populate('apartment_id').populate('bill_type').populate({
            path: "payments",
            model: "Payment"
        });

        const paidUtilityBill = await Bill.find({
            created_by: userId,
            status: true,
            bill_data_type: "utilityBills"
        }).populate('apartment_id').populate('bill_type').populate({
            path: "payments",
            model: "Payment"
        });
        const unpaidUtilityBill = await Bill.find({
            created_by: userId,
            status: false,
            bill_data_type: "utilityBills"
        }).populate('apartment_id').populate('bill_type').populate({
            path: "payments",
            model: "Payment"
        });

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const visitor = await Visitor.find({
                created_by: {
                    $in: userIds
                },
                created_at: {
                    $gte: startOfToday,
                    $lte: endOfToday
                }
            })
            .populate('user_id')
            .populate({
                path: 'apartment_id',
                populate: [{
                        path: 'tower_id'
                    },
                    {
                        path: 'floor_id'
                    }
                ]
            });

        const bills = await Bill.find({
            bill_data_type: "maintenance",
            created_by: userId
        }).select('_id');
        
        const billsId = bills.map(b => b._id.toString())

        const userBill = await UserBill.find({
                user_id: {
                    $in: userIds
                },
                bill_id: {
                    $in: billsId
                }
            })
            .populate('bill_id')
            .populate('apartment_id')
            .populate('user_id')
            .populate('payments');

        let maintenance = await Maintenance.findOne({
            status: true,
            created_by: userId,
        });

        if (!maintenance) {
            maintenance = await Maintenance.findOne({
                created_by: userId,
                status: true,
            });
        }

        const fixedCost = maintenance?.fixed_data?.length > 0 ? maintenance?.fixed_data : maintenance?.unit_type || [];

        const notice = await Notice.find({
            created_by: userId,
        });

        if (!fixedCost || !maintenance || !userBill || !visitor || !tower || !apartment || !unsoldApartment || !owner || !pendingComplain || !resolvedComplain || !inProgressComplain || !paidCommanAreaBill || !unpaidCommanAreaBill || !unpaidUtilityBill || !paidUtilityBill || !utilityBill || !notice) {
            return errorResponse(res, "Dashboard data does not exist", {}, 404)
        }

        const data = {
            fixedCost,
            userBill,
            visitor,
            tower,
            apartment,
            unsoldApartment,
            owner,
            pendingComplain,
            resolvedComplain,
            inProgressComplain,
            paidCommanAreaBill,
            unpaidCommanAreaBill,
            paidUtilityBill,
            unpaidUtilityBill,
            utilityBill,
            notice
        }


        return successResponse(res, "Dashboard data does not exist", data)


    } catch (error) {
        next(error)
    }
}