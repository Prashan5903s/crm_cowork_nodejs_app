const Bill = require('../../model/Bill')
const Complain = require('../../model/Complain')
const User = require('../../model/User')
const Event = require('../../model/Event')
const Visitor = require('../../model/Visitor')
const RoleUser = require('../../model/RoleUser')
const Notice = require('../../model/Notice')
const mongoose = require('mongoose')
const UserBill = require('../../model/UserBill')
const Maintenance = require('../../model/Maintenance')
const {
    successResponse,
    errorResponse
} = require('../../util/response')

async function getComplainsByStatus(userId, status) {
    return await Complain.aggregate([{
            $match: {
                created_by: new mongoose.Types.ObjectId(userId)
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
                    }, // latest first
                    {
                        $limit: 1
                    } // केवल latest record
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

        const user = await User.findById(userId)

        const masterId = user.created_by;

        const camera = user.cameras;

        // Use like this:
        const pendingComplain = await getComplainsByStatus(userId, "1"); // pending
        const inProgressComplain = await getComplainsByStatus(userId, "4"); // in-progress
        const resolvedComplain = await getComplainsByStatus(userId, "3"); // resolved

        const paidCommanAreaBill = await Bill.find({
                status: true,
                bill_data_type: "common-area-bill",
                created_by: masterId
            })
            .populate({
                path: "apartment_id",
                select: "_id apartment_no apartment_type apartment_area",
                populate: [{
                        path: "tower_id",
                        select: "_id name"
                    },
                    {
                        path: "floor_id",
                        select: "_id floor_name"
                    },
                    {
                        path: "assigned_to",
                        select: "_id first_name last_name"
                    }
                ]
            })
            .populate({
                path: 'bill_type',
                select: "-created_at -created_by" // exclude these two fields
            })
            .populate({
                path: "payments",
                select: "-created_at -created_by",
                model: "Payment"
            });

        const unpaidCommanAreaBill = await Bill.find({
                status: false,
                bill_data_type: "common-area-bill",
                created_by: masterId
            })
            .populate({
                path: "apartment_id",
                select: "_id apartment_no apartment_type apartment_area",
                populate: [{
                        path: "tower_id",
                        select: "_id name"
                    },
                    {
                        path: "floor_id",
                        select: "_id floor_name"
                    },
                    {
                        path: "assigned_to",
                        select: "_id first_name last_name"
                    }
                ]
            })
            .populate({
                path: 'bill_type',
                select: "-created_at -created_by" // exclude these two fields
            })
            .populate({
                path: "payments",
                select: "-created_at -created_by",
                model: "Payment"
            });

        const utilityBill = await Bill.find({
                user_id: userId,
                bill_data_type: "utilityBills"
            })
            .populate({
                path: "apartment_id",
                select: "_id apartment_no apartment_type apartment_area",
                populate: [{
                        path: "tower_id",
                        select: "_id name"
                    },
                    {
                        path: "floor_id",
                        select: "_id floor_name"
                    },
                    {
                        path: "assigned_to",
                        select: "_id first_name last_name"
                    }
                ]
            })
            .populate({
                path: 'bill_type',
                select: "-created_at -created_by" // exclude these two fields
            })
            .populate({
                path: "payments",
                select: "-created_at -created_by",
                model: "Payment"
            });

        const paidUtilityBill = await Bill.find({
                user_id: userId,
                status: true,
                bill_data_type: "utilityBills"
            })
            .populate({
                path: "apartment_id",
                select: "_id apartment_no apartment_type apartment_area",
                populate: [{
                        path: "tower_id",
                        select: "_id name"
                    },
                    {
                        path: "floor_id",
                        select: "_id floor_name"
                    },
                    {
                        path: "assigned_to",
                        select: "_id first_name last_name"
                    }
                ]
            })
            .populate({
                path: 'bill_type',
                select: "-created_at -created_by" // exclude these two fields
            })
            .populate({
                path: "payments",
                select: "-created_at -created_by",
                model: "Payment"
            });

        const unpaidUtilityBill = await Bill.find({
                user_id: userId,
                status: false,
                bill_data_type: "utilityBills"
            })
            .populate({
                path: "apartment_id",
                select: "_id apartment_no apartment_type apartment_area",
                populate: [{
                        path: "tower_id",
                        select: "_id name"
                    },
                    {
                        path: "floor_id",
                        select: "_id floor_name"
                    },
                    {
                        path: "assigned_to",
                        select: "_id first_name last_name"
                    }
                ]
            })
            .populate({
                path: 'bill_type',
                select: "-created_at -created_by" // exclude these two fields
            })
            .populate({
                path: "payments",
                select: "-created_at -created_by",
                model: "Payment"
            });

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const visitor = await Visitor.find({
                created_by: userId,
                created_at: {
                    $gte: startOfToday,
                    $lte: endOfToday
                }
            })
            .populate([{
                path: "user_id",
                select: "_id first_name last_name email phone"
            }])
            .populate({
                path: "apartment_id",
                select: "_id apartment_no apartment_type apartment_area",
                populate: [{
                        path: "tower_id",
                        select: "_id name"
                    },
                    {
                        path: "floor_id",
                        select: "_id floor_name"
                    },
                    {
                        path: "assigned_to",
                        select: "_id first_name last_name"
                    }
                ]
            });

        const roleUser = await RoleUser.find({
            user_id: userId
        }).select('role_id')

        if (!user || !roleUser) {
            return errorResponse(res, "Data does not exist", {}, 404)
        }

        const roleIds = roleUser.map(r => r.role_id.toString())

        const event = await Event.find({
            created_by: masterId,
            $or: [{
                    user_id: userId
                },
                {
                    role_id: {
                        $in: roleIds
                    }
                }
            ]
        }).select("-created_at -created_by");

        const bills = await Bill.find({
            bill_data_type: "maintenance",
            created_by: masterId
        }).select('_id');

        const billsId = bills.map(b => b._id.toString())

        const userBill = await UserBill.find({
                user_id: userId,
                bill_id: {
                    $in: billsId
                }
            })
            .populate({
                path: "bill_id",
                select: "-created_at -created_by"
            })
            .populate({
                path: "apartment_id",
                select: "_id apartment_no apartment_type apartment_area",
                populate: [{
                        path: "tower_id",
                        select: "_id name"
                    },
                    {
                        path: "floor_id",
                        select: "_id floor_name"
                    },
                    {
                        path: "assigned_to",
                        select: "_id first_name last_name"
                    }
                ]
            })
            .populate([{
                path: "user_id",
                select: "_id first_name last_name email phone"
            }])
            .populate({
                path: "payments",
                select: "-created_at -created_by"
            })

        const maintenance = await Maintenance.findOne({
            cost_type: "1",
            created_by: masterId
        })

        const fixedCost = maintenance.fixed_data;

        const notice = await Notice.find({
            created_by: masterId,
            role_id: {
                $elemMatch: {
                    $in: (roleIds)
                }
            }
        });

        if (!camera || !fixedCost || !maintenance || !userBill || !visitor || !unpaidCommanAreaBill || !paidCommanAreaBill || !paidUtilityBill || !unpaidUtilityBill, !pendingComplain || !resolvedComplain || !user || !roleUser || !notice) {
            return errorResponse(res, "Data does not exist", {}, 404)
        }

        const finalData = {
            fixedCost,
            userBill,
            visitor,
            event,
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

        return successResponse(res, "Dashboard data fetched successfully", finalData)

    } catch (error) {
        next(error)
    }
}