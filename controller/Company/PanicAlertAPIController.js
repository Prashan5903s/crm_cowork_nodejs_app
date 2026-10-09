const User = require('../../model/User')
const UserPushNotification = require('../../model/UserPushNotify')
const AppConfig = require('../../model/AppConfig')
const Role = require('../../model/Role')
const { sendNotification } = require('../../util/sendPushNotification')
const { successResponse } = require('../../util/response')

exports.getPanicALertAPI = async (req, res, next) => {
  try {
    const userId = req?.userId

    const users = await User.find({ created_by: userId }).select('_id')
    const userIds = users.map(u => u._id)

    const userNotify = await UserPushNotification.find({
      user_id: {
        $in: userIds
      }
    })
      .populate('user_id')
      .sort({ created_at: -1 })

    return successResponse(
      res,
      'Push notification pushed successfully',
      userNotify
    )
  } catch (error) {
    next(error)
  }
}

exports.getPanicCreateAPI = async (req, res, next) => {
  try {
    const userId = req?.userId

    const userType = await Role.find({
      created_by: { $in: [userId, '68bc14b6b297142d6bfe639c'] }
    }).select('name')

    const appConfig = await AppConfig.findOne({
      type: 'notification_type_data'
    })

    const notificationType = appConfig?.notification_type_data

    const user = await User.find({ created_by: userId })
      .select('_id first_name last_name')
      .populate({
        path: 'roles',
        select: '_id role_id',
        populate: {
          path: 'role_id',
          model: 'roles',
          select: '_id name'
        }
      })

    return successResponse(res, 'Panic create data fetched successfully', {
      user,
      notificationType,
      userType
    })
  } catch (error) {
    next(error)
  }
}

exports.postPanicController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const { description, notification_type_id, title, user_id, user_type_id } =
      req.body

    await Promise.all(
      user_id.map(async u => {
        try {
          const user = await User.findById(u).select('_id fcm_token')

          if (!user) return

          if (!user.fcm_token) {
            console.log(`No FCM token for user ${user._id}`)

            return
          }

          await sendNotification(
            user.fcm_token,
            title,
            description,
            title,
            String(userId),
            'high'
          )

          const userNotifyPush = new UserPushNotification({
            user_id: user._id,
            fcm_token: user.fcm_token,
            screen: 'panic_alert',
            priority: 'high',
            title,
            description,
            notification_type_id,
            user_type_id,
            created_by: userId,
            created_at: new Date()
          })

          await userNotifyPush.save()
        } catch (err) {
          console.error(`Notification failed for user ${u}`, err.message)
        }
      })
    )

    return successResponse(res, 'Panic sent successfully')
  } catch (error) {
    next(error)
  }
}
