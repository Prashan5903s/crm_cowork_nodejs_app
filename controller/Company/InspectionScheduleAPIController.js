const mongoose = require('mongoose')
const User = require('../../model/User')
const Asset = require('../../model/Assets')
const { successResponse } = require('../../util/response')
const AssetCategory = require('../../model/AssetCategory')
const InspectionSchedule = require('../../model/InspectionSchedule')
const InspectionTemplate = require('../../model/InspectionTemplate')

exports.getInspectionScheduleAPI = async (req, res, next) => {
  try {
    const userId = req?.userId

    const asset = await Asset.find({
      created_by: userId
    }).select('_id name')

    const inspectionTemplate = await InspectionTemplate.find({
      created_by: userId
    }).select('_id name')

    const inspectionSchedule = await InspectionSchedule.find({
      assigned_by: userId
    })
      .populate('inspection_template_id', '_id name')
      .populate('assigned_to', '_id first_name last_name phone')
      .populate('asset_id', '_id name')

    const users = await User.aggregate([
      {
        $match: {
          created_by: mongoose.Types.ObjectId.createFromHexString(userId)
        }
      },
      {
        $lookup: {
          from: 'role_users',
          localField: '_id',
          foreignField: 'user_id',
          as: 'role_user'
        }
      },
      {
        $addFields: {
          isOfficeBearer: {
            $in: [
              mongoose.Types.ObjectId.createFromHexString(
                '68c01730556298d2b76244ac'
              ),
              '$role_user.role_id'
            ]
          }
        }
      },
      {
        $match: {
          isOfficeBearer: true
        }
      },
      {
        $project: {
          first_name: 1,
          last_name: 1,
          phone: 1
        }
      }
    ])

    const finalData = {
      inspectionTemplate,
      inspectionSchedule,
      users,
      asset
    }

    return successResponse(
      res,
      'Inpection schedule fetched successfully',
      finalData
    )
  } catch (error) {
    next(error)
  }
}

exports.postInspectionScheduleController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const {
      asset_id,
      assigned_to,
      due_date,
      frequency,
      inspection_template_id,
      remarks,
      scheduled_date,
      status
    } = req?.body

    await InspectionSchedule.create({
      assigned_to,
      asset_id,
      assigned_by: userId,
      remarks,
      scheduled_date,
      due_date,
      status,
      frequency,
      inspection_template_id
    })

    return successResponse(res, 'Inspection template saved successfully')
  } catch (error) {
    next(error)
  }
}

exports.putInspectionScheduleController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const { id } = req?.params

    const {
      asset_id,
      assigned_to,
      due_date,
      frequency,
      inspection_template_id,
      remarks,
      scheduled_date,
      status
    } = req?.body

    await InspectionSchedule.findOneAndUpdate(
      {
        assigned_by: userId,
        _id: id
      },
      {
        asset_id,
        assigned_to,
        remarks,
        scheduled_date,
        due_date,
        status,
        frequency,
        inspection_template_id
      }
    )

    return successResponse(res, 'Inspection updated succesfully')
  } catch (error) {
    next(error)
  }
}
