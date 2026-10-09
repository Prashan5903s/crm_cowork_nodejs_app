const RoleUser = require('../../model/RoleUser')
const Complain = require('../../model/Complain')
const User = require('../../model/User')
const Tower = require('../../model/Tower')
const Floor = require('../../model/Floor')
const EscalateComplain = require('../../model/EscalateComplain')
const TicketType = require('../../model/TicketType')
const ComplainUser = require('../../model/ComplainUser')
const { errorResponse, successResponse } = require('../../util/response')

const mongoose = require('mongoose')
const { pipeline } = require('nodemailer/lib/xoauth2')

exports.getComplainController = async (req, res, next) => {
  try {
    const userId = req.userId

    const users = await User.find({
      created_by: userId,
      user_type: {
        $ne: '4'
      }
    }).select('_id')

    const userIds = users.map(u => u._id)

    const status = req?.params.status

    const complain = await Complain.aggregate([
      {
        $match: {
          created_by: {
            $in: userIds
          }
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
                created_at: -1,
                _id: -1
              }
            }
          ],
          as: 'complain_users'
        }
      },
      {
        $addFields: {
          all_complain_users: '$complain_users',
          latest_complain_user: {
            $last: '$complain_users'
          }
        }
      },
      {
        $match: {
          'latest_complain_user.complaint_status': status
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
        $sort: {
          created_at: -1
        }
      },
      {
        $project: {
          complain_users: 0 // hide full complain_users array
        }
      }
    ])

    if (!complain) {
      return errorResponse(res, 'Complain does not exist', {}, 404)
    }

    return successResponse(res, 'Complain fetched successfully', complain)
  } catch (error) {
    next(error)
  }
}

exports.createComplainController = async (req, res, next) => {
  try {
    const userId = req.userId

    const roleId = '68c01730556298d2b76244ac'

    // 1. Find all role_user entries with the specific role
    const roleUsers = await RoleUser.find({
      role_id: roleId
    }).select('user_id')

    // 2. Extract user_ids
    const userIds = roleUsers.map(r => r.user_id)

    // 3. Fetch users created by userId and in role_user
    const users = await User.find({
      _id: {
        $in: userIds
      },
      user_type: {
        $ne: '4'
      },
      created_by: userId
    })

    if (!users) {
      return errorResponse(res, 'User does not exist', {}, 404)
    }

    return successResponse(res, 'User create data', users)
  } catch (error) {
    next(error)
  }
}

exports.postComplainController = async (req, res, next) => {
  try {
    const userId = req.userId

    const id = req.params.id
    const code = req.params.code

    const { status, user, remark } = req.body

    const complain = await Complain.findById(id)

    if (!complain) {
      return errorResponse(res, 'Complain does not exist', {}, 404)
    }

    if (code == 1) {
      await Complain.findByIdAndUpdate(id, {
        assigned_to: {
          user,
          remark
        }
      })

      const complain_user = await ComplainUser.findOne({
        complain_id: complain._id
      })

      if (!complain_user) {
        const complainUser = new ComplainUser({
          complain_id: complain._id,
          complaint_status: '2',
          created_by: userId,
          created_at: Date.now()
        })

        await complainUser.save()
      } else {
        const typeStatus = complain_user?.complaint_status

        if (typeStatus != '2') {
          const complainUser = new ComplainUser({
            complain_id: complain._id,
            complaint_status: '2',
            created_by: userId,
            created_at: Date.now()
          })

          await complainUser.save()
        }
      }
    } else {
      const complainUser = new ComplainUser({
        complain_id: complain._id,
        complaint_status: status,
        created_by: userId,
        remark,
        created_at: Date.now()
      })

      await complainUser.save()
    }

    return successResponse(res, 'Complain updated successfully')
  } catch (error) {
    next(error)
  }
}

exports.getComplainReportDataAPI = async (req, res, next) => {
  try {
    const userId = req.userId

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
      {
        title: 'Pending',
        value: '1'
      },
      {
        title: 'Assigned',
        value: '2'
      },
      {
        title: 'Resolved',
        value: '3'
      },
      {
        title: 'In progress',
        value: '4'
      }
    ]

    const priorityData = [
      {
        title: 'High',
        value: '1'
      },
      {
        title: 'Medium',
        value: '2'
      },
      {
        title: 'Low',
        value: '3'
      }
    ]

    const matchStage = {
      created_by: {
        $in: users.map(user => user._id)
      }
    }

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
          // Treat null/missing priority as Low
          matchStage.$or = [
            {
              priority: '3'
            },
            {
              priority: null
            },
            {
              priority: {
                $exists: false
              }
            }
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

    const pipeline = [
      {
        $match: matchStage
      },
      {
        $addFields: {
          priority: {
            $ifNull: ['$priority', '3']
          }
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

                // Required for tower/floor filtering
                apartment_data: 1,

                // Existing direct fields, if required elsewhere
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
          from: 'complain_feedback_log',
          localField: '_id',
          foreignField: 'complain_id',
          pipeline: [
            {
              $project: {
                rating: 1
              }
            }
          ],
          as: 'feedbackLog'
        }
      },
      {
        $unwind: {
          path: '$feedbackLog',
          preserveNullAndEmptyArrays: true
        }
      }
    ]

    if (tower && mongoose.Types.ObjectId.isValid(tower)) {
      pipeline.push({
        $match: {
          'created_by.apartment_data': {
            $elemMatch: {
              tower_id: new mongoose.Types.ObjectId(tower)
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
              floor_id: new mongoose.Types.ObjectId(floor)
            }
          }
        }
      })
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
                      {
                        $ifNull: ['$created_by.first_name', '']
                      },
                      ' ',
                      {
                        $ifNull: ['$created_by.last_name', '']
                      }
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

    pipeline.push(
      {
        $lookup: {
          from: 'towers',
          localField: 'tower',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1
              }
            }
          ],
          as: 'tower'
        }
      },
      {
        $unwind: {
          path: '$tower',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'floors',
          localField: 'floor',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                floor_name: 1
              }
            }
          ],
          as: 'floor'
        }
      },

      {
        $unwind: {
          path: '$floor',
          preserveNullAndEmptyArrays: true
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
      },
      {
        $addFields: {
          nature_data: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ['$nature', 1]
                  },
                  then: {
                    value: 1,
                    title: 'Normal'
                  }
                },
                {
                  case: {
                    $eq: ['$nature', 2]
                  },
                  then: {
                    value: 2,
                    title: 'Urgent'
                  }
                },
                {
                  case: {
                    $eq: ['$nature', 3]
                  },
                  then: {
                    value: 3,
                    title: 'Emergency'
                  }
                }
              ],
              default: {
                value: 0,
                title: 'Unknown'
              }
            }
          }
        }
      },
      {
        $addFields: {
          complain_status_data: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ['$complain_status', 1]
                  },
                  then: {
                    value: 1,
                    title: 'Active'
                  }
                },
                {
                  case: {
                    $eq: ['$complain_status', 0]
                  },
                  then: {
                    value: 0,
                    title: 'Inactive'
                  }
                }
              ],
              default: {
                value: -1,
                title: 'Unknown'
              }
            }
          }
        }
      }
    )

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

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'assigned_to.user',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                first_name: 1,
                last_name: 1,
                email: 1,
                phone: 1
              }
            }
          ],
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
        $sort: {
          created_at: -1
        }
      },
      {
        $project: {
          complain_users: 0,
          __v: 0
        }
      }
    )

    const complain = await Complain.aggregate(pipeline)

    const finalData = {
      compLen: complain.length,
      complain,
      towers,
      floors,
      statusData,
      priorityData,
      users,
      category: ticketType
    }

    return successResponse(
      res,
      'Complain report data fetched successfully',
      finalData
    )
  } catch (error) {
    console.error('getComplainReportDataAPI error:', error)

    next(error)
  }
}

exports.getEscalatedComplainController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const users = await User.find({
      created_by: userId
    }).select('_id')

    const userIds = users.map(u => u._id)

    const escalateComplain = await EscalateComplain.aggregate([
      {
        $match: {
          resident_id: {
            $in: userIds.map(id => new mongoose.Types.ObjectId(id))
          }
        }
      },

      {
        $lookup: {
          from: 'complains',
          localField: 'complain_id',
          foreignField: '_id',
          as: 'complains'
        }
      },
      {
        $unwind: {
          path: '$complains',
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $lookup: {
          from: 'users',
          localField: 'resident_id',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                first_name: 1,
                last_name: 1,
                phone: 1
              }
            }
          ],
          as: 'resident'
        }
      },
      {
        $unwind: {
          path: '$resident',
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $lookup: {
          from: 'complain_users',
          localField: 'complain_id',
          foreignField: 'complain_id',
          pipeline: [
            {
              $sort: {
                created_at: -1
              }
            }
          ],
          as: 'all_complain_users'
        }
      },
      {
        $lookup: {
          from: 'complain_users',
          let: {
            complainId: '$complain_id'
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
                created_at: -1,
                _id: -1
              }
            }
          ],
          as: 'complain_users'
        }
      },
      {
        $addFields: {
          all_complain_users: '$complain_users',
          latest_complain_user: {
            $last: '$complain_users'
          }
        }
      },
      {
        $lookup: {
          from: 'app_config',
          pipeline: [
            {
              $match: {
                type: 'escalation_data'
              }
            }
          ],
          as: 'config'
        }
      },
      {
        $unwind: {
          path: '$config',
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $addFields: {
          escalation_reason: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$config.escalation_data.escalation_reason_data',
                  as: 'reason',
                  cond: {
                    $eq: [
                      { $toString: '$$reason._id' },
                      '$escalation_reason_id'
                    ]
                  }
                }
              },
              0
            ]
          },
          escalation_status: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$config.escalation_data.escalation_status_data',
                  as: 'status',
                  cond: {
                    $eq: ['$$status._id', '$escalation_status_id']
                  }
                }
              },
              0
            ]
          }
        }
      },

      {
        $sort: {
          created_at: -1
        }
      },

      {
        $project: {
          config: 0
        }
      }
    ])

    return successResponse(
      res,
      'Escalated complain fetched successfully',
      escalateComplain
    )
  } catch (error) {
    next(error)
  }
}

exports.postEscalatedComplainController = async (req, res, next) => {
  try {
    const userId = req.userId

    const code = req.params.code

    const { status, user, remark, complainId, escalateId } = req.body

    const complain = await Complain.findById(complainId)

    if (!complain) {
      return errorResponse(res, 'Complain does not exist', {}, 404)
    }

    if (code == 1) {
      await Complain.findByIdAndUpdate(complainId, {
        escalated_assigned_to: {
          user,
          remark,
          escalate_id: escalateId
        }
      })

      const complain_user = await ComplainUser.findOne({
        complain_id: complainId,
        escalate_id: escalateId
      })

      if (!complain_user) {
        const complainUser = new ComplainUser({
          complain_id: complainId,
          escalate_id: escalateId,
          complaint_status: '2',
          created_by: userId,
          created_at: Date.now()
        })

        await complainUser.save()
      } else {
        const typeStatus = complain_user?.complaint_status

        if (typeStatus != '2') {
          const complainUser = new ComplainUser({
            complain_id: complainId,
            complaint_status: '2',
            created_by: userId,
            created_at: Date.now()
          })

          await complainUser.save()
        }
      }
    } else {
      
      const complainUser = new ComplainUser({
        complain_id: complainId,
        complaint_status: status,
        created_by: userId,
        remark,
        created_at: Date.now()
      })

      await complainUser.save()
    }

    return successResponse(res, 'Complain updated successfully')
  } catch (error) {
    next(error)
  }
}
