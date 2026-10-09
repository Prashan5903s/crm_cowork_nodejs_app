const AppConfig = require('../../model/AppConfig')
const SLAConfig = require('../../model/SLAConfig')
const Bill = require('../../model/Bill')
const User = require('../../model/User')
const Tower = require('../../model/Tower')
const Floor = require('../../model/Floor')
const mongoose = require('mongoose')
const TicketType = require('../../model/TicketType')
const Complain = require('../../model/Complain')
const UserBill = require('../../model/UserBill')
const Maintenance = require('../../model/Maintenance')
const { successResponse } = require('../../util/response')

exports.getGraphPaymentReport = async (req, res, next) => {
  try {
    const userId = req?.userId
    const type = req?.params?.type

    let monthlyTotals = Array(12).fill(0)

    if (type == 'All') {
      const bills = await Bill.find({
        created_by: userId
      }).populate('payments')

      bills.forEach(bill => {
        if (!bill.created_at) return

        const month = bill.created_at.getMonth()
        let totalPayments = 0

        if (bill.payments && bill.payments.length > 0) {
          totalPayments = bill.payments.reduce(
            (sum, p) => sum + (p.amount || 0),
            0
          )
        }

        monthlyTotals[month] += totalPayments / 1000
      })
    } else if (type == 'Utility') {
      const bills = await Bill.find({
        created_by: userId,
        bill_data_type: 'utilityBills'
      }).populate('payments')

      bills.forEach(bill => {
        if (!bill.created_at) return

        const month = bill.created_at.getMonth()
        let totalPayments = 0

        if (bill.payments && bill.payments.length > 0) {
          totalPayments = bill.payments.reduce(
            (sum, p) => sum + (p.amount || 0),
            0
          )
        }

        monthlyTotals[month] += totalPayments / 1000
      })
    } else if (type == 'Common Area') {
      const bills = await Bill.find({
        created_by: userId,
        bill_data_type: 'common-area-bill'
      }).populate('payments')

      bills.forEach(bill => {
        if (!bill.created_at) return

        const month = bill.created_at.getMonth()
        let totalPayments = 0

        if (bill.payments && bill.payments.length > 0) {
          totalPayments = bill.payments.reduce(
            (sum, p) => sum + (p.amount || 0),
            0
          )
        }

        monthlyTotals[month] += totalPayments / 1000
      })
    } else {
      const bills = await Bill.find({
        created_by: userId,
        bill_data_type: 'maintenance'
      }).populate('payments')

      bills.forEach(bill => {
        if (!bill.created_at) return

        const month = bill.created_at.getMonth()
        let totalPayments = 0

        if (bill.payments && bill.payments.length > 0) {
          totalPayments = bill.payments.reduce(
            (sum, p) => sum + (p.amount || 0),
            0
          )
        }

        monthlyTotals[month] += totalPayments / 1000
      })
    }

    return successResponse(
      res,
      'Graph report fetched successfully',
      monthlyTotals
    )
  } catch (error) {
    next(error)
  }
}

exports.getTablePaymentReport = async (req, res, next) => {
  try {
    const userId = req?.userId
    const type = req.params.type
    const start = req?.params?.start
    const end = req?.params?.end

    let bill

    if (type == 'all') {
      bill = await Bill.find({
        created_by: userId,
        created_at: {
          $gte: new Date(start),
          $lte: new Date(end)
        }
      })
        .populate('bill_type') // bill_type populate
        .populate({
          path: 'apartment_id',
          populate: {
            path: 'assigned_to', // Apartment → Assigned User
            model: 'users'
          }
        })
        .populate({
          path: 'payments',
          model: 'Payment',
          populate: {
            path: 'user_bill_id', // Payment → UserBill
            model: 'user_bill',
            populate: {
              path: 'user_id', // UserBill → User
              model: 'users'
            }
          }
        })
    } else {
      bill = await Bill.find({
        created_by: userId,
        bill_data_type: type,
        created_at: {
          $gte: new Date(start),
          $lte: new Date(end)
        }
      })
        .populate('bill_type') // bill_type populate
        .populate({
          path: 'apartment_id',
          populate: {
            path: 'assigned_to', // Apartment → Assigned User
            model: 'users'
          }
        })
        .populate({
          path: 'payments',
          model: 'Payment',
          populate: {
            path: 'user_bill_id', // Payment → UserBill
            model: 'user_bill',
            populate: {
              path: 'user_id', // UserBill → User
              model: 'users'
            }
          }
        })
    }

    return successResponse(
      res,
      'Table payment report fetched successfully',
      bill
    )
  } catch (error) {
    next(error)
  }
}

exports.getFinancialReport = async (req, res, next) => {
  try {
    const userId = req?.userId
    const type = req?.params?.type
    const start = req?.params?.start
    const end = req?.params?.end

    let data = []

    if (type == 'common-area-bill' || type == 'utilityBills') {
      const bills = await Bill.find({
        bill_data_type: type,
        created_by: userId,
        created_at: {
          $gte: new Date(start),
          $lte: new Date(end)
        }
      })
        .populate('bill_type') // bill_type populate
        .populate({
          path: 'apartment_id',
          populate: {
            path: 'assigned_to', // Apartment → Assigned User
            model: 'users'
          }
        })
        .populate({
          path: 'payments',
          model: 'Payment',
          populate: {
            path: 'user_bill_id', // Payment → UserBill
            model: 'user_bill',
            populate: {
              path: 'user_id', // UserBill → User
              model: 'users'
            }
          }
        })

      data = bills
    } else if (type == 'maintenance') {
      let datas = {}

      const bills = await Bill.find({
        bill_data_type: type,
        created_by: userId,
        created_at: {
          $gte: new Date(start),
          $lte: new Date(end)
        }
      }).select('_id')

      const billsId = bills.map(b => b._id.toString())

      const userBill = await UserBill.find({
        bill_id: {
          $in: billsId
        }
      })
        .populate('bill_id') // Bill details
        .populate({
          path: 'apartment_id',
          populate: {
            path: 'assigned_to', // Apartment → Assigned User
            model: 'users'
          }
        })
        .populate('user_id') // Direct user of UserBill
        .populate({
          path: 'payments',
          model: 'Payment',
          populate: {
            path: 'user_bill_id', // Payment → UserBill
            model: 'user_bill',
            populate: {
              path: 'user_id', // UserBill → User
              model: 'users'
            }
          }
        })

      const maintenance = await Maintenance.findOne({
        status: true,
        created_by: userId
      })

      let finalValue

      const fixedCost = maintenance.fixed_data

      if (fixedCost.length == 0) {
        finalValue = maintenance.unit_type
      } else {
        finalValue = fixedCost
      }

      if (!userBill) {
        return errorResponse(res, 'User bill does not exist', {}, 404)
      }

      datas['userBill'] = userBill

      datas['fixedCost'] = finalValue

      data = datas
    } else {
      let datas = {}

      const user_bill = await Bill.find({
        created_by: userId,
        bill_data_type: {
          $ne: 'maintenance'
        },
        created_at: {
          $gte: new Date(start),
          $lte: new Date(end)
        }
      })
        .populate('bill_type') // bill_type populate
        .populate({
          path: 'apartment_id',
          populate: {
            path: 'assigned_to', // Apartment → Assigned User
            model: 'users'
          }
        })
        .populate({
          path: 'payments',
          model: 'Payment',
          populate: {
            path: 'user_bill_id', // Payment → UserBill
            model: 'user_bill',
            populate: {
              path: 'user_id', // UserBill → User
              model: 'users'
            }
          }
        })

      const bills = await Bill.find({
        created_by: userId,
        bill_data_type: 'maintenance',
        created_at: {
          $gte: new Date(start),
          $lte: new Date(end)
        }
      }).select('_id')

      const billsId = bills.map(b => b._id.toString())

      const userBill = await UserBill.find({
        bill_id: {
          $in: billsId
        }
      })
        .populate('bill_id') // Bill details
        .populate({
          path: 'apartment_id',
          populate: {
            path: 'assigned_to', // Apartment → Assigned User
            model: 'users'
          }
        })
        .populate('user_id') // Direct user of UserBill
        .populate({
          path: 'payments',
          model: 'Payment',
          populate: {
            path: 'user_bill_id', // Payment → UserBill
            model: 'user_bill',
            populate: {
              path: 'user_id', // UserBill → User
              model: 'users'
            }
          }
        })

      const maintenance = await Maintenance.findOne({
        status: true,
        created_by: userId
      })

      let finalValue

      const fixedCost = maintenance.fixed_data

      if (fixedCost.length == 0) {
        finalValue = maintenance.unit_type
      } else {
        finalValue = fixedCost
      }

      if (!userBill) {
        return errorResponse(res, 'User bill does not exist', {}, 404)
      }

      datas['userBill'] = [...userBill, ...user_bill]

      datas['fixedCost'] = finalValue

      data = datas
    }

    return successResponse(res, 'Financial report fetched successfully', data)
  } catch (error) {
    next(error)
  }
}

exports.getSLAReportController = async (req, res, next) => {
  try {
    const userId = req?.userId

    let slaBreachDays = 0

    const {
      tower = '',
      floor = '',
      category = '',
      nature = '',
      status = '',
      assignedTo = '',
      resident = '',
      priority = ''
    } = req.query

    const [towers, floors, ticketType, users] = await Promise.all([
      Tower.find({
        created_by: userId,
        status: true
      })
        .select('_id name')
        .lean(),

      Floor.find({
        created_by: userId,
        status: true
      })
        .select('_id name floor_name')
        .lean(),

      TicketType.find({
        created_by: userId
      })
        .select('_id name')
        .lean(),

      User.find({
        created_by: userId,
        user_type: {
          $ne: '4'
        }
      })
        .select('_id first_name last_name email phone apartment_data')
        .lean()
    ])

    const statusData = [
      { title: 'Pending', value: '1' },
      { title: 'Assigned', value: '2' },
      { title: 'Resolved', value: '3' },
      { title: 'In progress', value: '4' }
    ]

    const priorityData = [
      { title: 'High', value: '1' },
      { title: 'Medium', value: '2' },
      { title: 'Low', value: '3' }
    ]

    const slaBreachData = [
      { title: 'SLA Breached', value: false },
      { title: 'Not Breached', value: true }
    ]

    const slaConfig = await SLAConfig.findOne({
      user_id: userId,
      created_by: userId
    })

    if (slaConfig) {
      slaBreachDays = slaConfig.sla_breach_days
    } else {
      const appConfig = await AppConfig.findOne({
        type: 'sla_breach_days_data'
      })

      slaBreachDays = appConfig ? appConfig.sla_breach_days : 0
    }

    const userIds = users.map(u => u._id)

    const pipeline = [
      {
        $match: {
          created_by: {
            $in: userIds
          }
        }
      }
    ]

    const matchStage = {}

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      matchStage.category =
        mongoose.Types.ObjectId.createFromHexString(category)
    }

    if (nature !== '') {
      const natureValue = Number(nature)

      if ([1, 2, 3].includes(natureValue)) {
        matchStage.nature = natureValue
      }
    }

    if (priority !== '') {
      const priorityValue = String(priority)

      if (['1', '2', '3'].includes(priorityValue)) {
        if (priorityValue === '3') {
          matchStage.$or = [
            { priority: '3' },
            { priority: null },
            { priority: { $exists: false } }
          ]
        } else {
          matchStage.priority = priorityValue
        }
      }
    }

    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      matchStage['assigned_to.user'] =
        mongoose.Types.ObjectId.createFromHexString(assignedTo)
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage })
    }

    if (tower && mongoose.Types.ObjectId.isValid(tower)) {
      pipeline.push({
        $match: {
          'created_by.apartment_data': {
            $elemMatch: {
              tower_id: mongoose.Types.ObjectId.createFromHexString(tower)
            }
          }
        }
      })
    }

    if (floor && mongoose.Types.ObjectId.isValid(floor)) {
      pipeline.push({
        $match: {
          'created_by.apartment_data': {
            $elemMatch: {
              floor_id: mongoose.Types.ObjectId.createFromHexString(floor)
            }
          }
        }
      })
    }


    if (resident && resident.trim() !== '') {
      const escapedResident = resident
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      pipeline.push({
        $match: {
          $or: [
            {
              'created_by.first_name': {
                $regex: escapedResident,
                $options: 'i'
              }
            },
            {
              'created_by.last_name': {
                $regex: escapedResident,
                $options: 'i'
              }
            },
            {
              $expr: {
                $regexMatch: {
                  input: {
                    $concat: [
                      { $ifNull: ['$created_by.first_name', ''] },
                      ' ',
                      { $ifNull: ['$created_by.last_name', ''] }
                    ]
                  },
                  regex: escapedResident,
                  options: 'i'
                }
              }
            },
            {
              'created_by.phone': {
                $regex: escapedResident,
                $options: 'i'
              }
            }
          ]
        }
      })
    }

    // NOTE: Status check removed from here because 'latest_complain_user' isn't populated yet.

    pipeline.push(
      {
        $lookup: {
          from: 'complain_users',
          let: {
            complainId: '$_id'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$complain_id', '$$complainId']
                }
              }
            },
            {
              $sort: {
                created_at: 1,
                _id: 1
              }
            }
          ],
          as: 'complain_users'
        }
      },
      {
        $addFields: {
          priority: {
            $ifNull: ['$priority', '3']
          }
        }
      },
      {
        $addFields: {
          all_complain_users: '$complain_users'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'created_by',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                first_name: 1,
                last_name: 1,
                email: 1,
                phone: 1,
                apartment_data: 1,
                tower_id: 1,
                floor_id: 1,
                apartment_id: 1
              }
            }
          ],
          as: 'created_by'
        }
      },
      {
        $unwind: {
          path: '$created_by',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assigned_to.user',
          foreignField: '_id',
          as: 'assigned_user'
        }
      },
      {
        $unwind: {
          path: '$assigned_user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          start_time: '$created_at',
          end_time: {
            $dateAdd: {
              startDate: '$created_at',
              unit: 'day',
              amount: slaBreachDays
            }
          }
        }
      },
      {
        $addFields: {
          oldestStatus3: {
            $first: {
              $filter: {
                input: '$all_complain_users',
                as: 'item',
                cond: {
                  $eq: ['$$item.complaint_status', '3']
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          sla_breached: {
            $cond: [
              {
                $lte: ['$$NOW', '$end_time']
              },
              false,
              {
                $cond: [
                  {
                    $eq: ['$oldestStatus3', null]
                  },
                  true,
                  {
                    $cond: [
                      {
                        $and: [
                          {
                            $gte: ['$oldestStatus3.created_at', '$start_time']
                          },
                          {
                            $lte: ['$oldestStatus3.created_at', '$end_time']
                          }
                        ]
                      },
                      false,
                      true
                    ]
                  }
                ]
              }
            ]
          }
        }
      }
    )

    // --- Place this immediately AFTER the $addFields stage that calculates `sla_breached` ---

    const { isSlaBreached = '' } = req.query // Extract it here or above

    if (isSlaBreached !== '') {
      const isBreached = String(isSlaBreached).toLowerCase() === 'true'
      pipeline.push({
        $match: {
          sla_breached: isBreached
        }
      })
    }

    pipeline.push(
      {
        $addFields: {
          nature_data: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$nature', 1] },
                  then: { value: 1, title: 'Normal' }
                },
                {
                  case: { $eq: ['$nature', 2] },
                  then: { value: 2, title: 'Urgent' }
                },
                {
                  case: { $eq: ['$nature', 3] },
                  then: { value: 3, title: 'Emergency' }
                }
              ],
              default: { value: 0, title: 'Unknown' }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'ticket_types',
          localField: 'category',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1
              }
            }
          ],
          as: 'category'
        }
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: {
          created_at: -1
        }
      },
      {
        $lookup: {
          from: 'complain_users',
          let: {
            complainId: '$_id'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$complain_id', '$$complainId']
                }
              }
            },
            {
              $sort: {
                created_at: -1
              }
            }
          ],
          as: 'complain_users'
        }
      },
      {
        $addFields: {
          latest_complain_user: {
            $arrayElemAt: ['$complain_users', 0]
          }
        }
      }
    )

    // MOVED STATUS FILTER HERE: Now 'latest_complain_user' is fully available
    if (status !== '') {
      pipeline.push({
        $match: {
          $expr: {
            $eq: [
              {
                $toString: '$latest_complain_user.complaint_status'
              },
              String(status)
            ]
          }
        }
      })
    }

    pipeline.push({
      $project: {
        all_complain_users: 0,
        start_time: 0,
        end_time: 0,
        complain_users: 0,
        oldestStatus3: 0
      }
    })

    const complain = await Complain.aggregate(pipeline)

    const finalData = {
      compLen: complain.length,
      complain,
      towers,
      floors,
      statusData,
      priorityData,
      slaBreachData,
      users,
      category: ticketType
    }

    return successResponse(res, 'Complain fetched successfully', finalData)
  } catch (error) {
    next(error)
  }
}
