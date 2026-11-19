const AppConfig = require('../../model/AppConfig')
const EscalationLog = require('../../model/EscalateComplain')
const { successResponse } = require('../../util/response')

exports.getEscalationCreate = async (req, res, next) => {
  try {
    const appConfig = await AppConfig.findOne({
      type: 'escalation_data'
    })

    const escalationData = appConfig?.escalation_data

    return successResponse(
      res,
      'Escalation fetched successfully',
      escalationData
    )
  } catch (error) {
    next(error)
  }
}

exports.postEscalateAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const {
      complain_id,
      escalation_reason,
      escalation_status,
      resident_remarks
    } = req?.body

    const escalationLog = await EscalationLog.create({
      escalation_status_id: escalation_status,
      escalation_reason_id: escalation_reason,
      resident_remarks,
      complain_id,
      resident_id: userId,
      created_by: userId,
      created_at: Date.now()
    })

    return successResponse(
      res,
      'Complain escalated successfully',
      escalationLog
    )
  } catch (error) {
    next(error)
  }
}
