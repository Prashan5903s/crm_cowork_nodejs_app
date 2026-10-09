const InspectionSchedule = require('../../model/InspectionSchedule')
const WorkOrder = require('../../model/WorkOrder')
const InspectionResult = require('../../model/InspectionResult')
const { successResponse, errorResponse } = require('../../util/response')

exports.getInspectionResultAPI = async (req, res, next) => {
  try {
    const userId = req.userId

    const inspectionSchedule = await InspectionSchedule.find({
      assigned_to: userId,
      status: { $in: ['Pending', 'In Progress'] },
      is_active: true
    })
      .populate({
        path: 'asset_id',
        populate: [
          {
            path: 'location_id',
            select: 'name'
          },
          {
            path: 'asset_category_id',
            select: 'name'
          }
        ]
      })
      .populate({
        path: 'inspection_template_id',
        select: 'name checklist'
      })
      .sort({ due_date: 1 })

    return successResponse(res, 'Inspection schedule fetched successfully', {
      inspectionSchedule
    })
  } catch (error) {
    next(error)
  }
}

exports.postInspectionResultAPI = async (req, res, next) => {
  try {
    const userId = req.userId

    const {
      inspection_schedule_id,
      overall_status,
      responses,
      remarks,
      images
    } = req.body

    // Find Schedule
    const schedule = await InspectionSchedule.findById(
      inspection_schedule_id
    ).populate('inspection_template_id')

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Inspection schedule not found.'
      })
    }

    // Already Completed
    if (schedule.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Inspection already completed.'
      })
    }

    // Create Inspection Result
    const inspectionResult = await InspectionResult.create({
      inspection_schedule_id,
      asset_id: schedule.asset_id,
      template_id: schedule.inspection_template_id._id,
      inspected_by: userId,
      inspection_date: new Date(),
      overall_status,
      responses,
      remarks,
      images,
      created_by: userId
    })

    // Update Schedule
    schedule.status = 'Completed'
    schedule.completed_date = new Date()

    await schedule.save()

    // Optional Auto Work Order
    if (overall_status === 'Needs Repair' || overall_status === 'Fail') {
      await WorkOrder.create({
        asset_id: schedule.asset_id,
        inspection_result_id: inspectionResult._id,
        type: 'Repair',
        priority: 'Medium',
        status: 'Open',
        description: remarks || 'Auto-generated from failed inspection.',
        created_by: userId
      })
    }

    return successResponse(
      res,
      'Inspection submitted successfully.',
      inspectionResult
    )
  } catch (error) {
    next(error)
  }
}
