const AppConfig = require('../../model/AppConfig')
const SLAConfig = require('../../model/SLAConfig')
const { successResponse } = require('../../util/response')

exports.getSLAConfigController = async (req, res, next) => {
  try {
    const userId = req?.userId

    let sla_breach_days = 2

    const sla_config = await SLAConfig.findOne({
      user_id: userId,
      created_by: userId
    })

    if (sla_config) {
      sla_breach_days = sla_config?.sla_breach_days
    } else {
      const app_config = await AppConfig.findOne({
        type: 'sla_breach_days_data'
      })

      sla_breach_days = app_config?.sla_breach_days
    }

    return successResponse(
      res,
      'SLA breach data fetched successfully',
      sla_breach_days
    )
  } catch (error) {
    next(error)
  }
}

exports.postSLABreachController = async (req, res, next) => {
  try {
    const { slaBreachDays } = req?.body
    const userId = req?.userId

    const sla_config = await SLAConfig.findOne({
      user_id: userId,
      created_by: userId
    })

    if (!sla_config) {
      await SLAConfig.create({
        user_id: userId,
        created_by: userId,
        sla_breach_days: slaBreachDays,
        created_at: Date.now()
      })
    } else {
      await SLAConfig.findOneAndUpdate(
        {
          user_id: userId
        },
        {
          user_id: userId,
          created_by: userId,
          sla_breach_days: slaBreachDays,
          updated_by: userId,
          updated_at: Date.now()
        }
      )
    }

    return successResponse(res, 'SLA config saved successfully')
  } catch (error) {
    next(error)
  }
}
