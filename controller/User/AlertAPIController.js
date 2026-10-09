const mongoose = require('mongoose')

const User = require('../../model/User')
const AppConfig = require('../../model/AppConfig')
const UserPushNotification = require('../../model/UserPushNotify')

const SendUserMail = require('../../util/sendMail')
const { successResponse } = require('../../util/response')
const { sendNotification } = require('../../util/sendPushNotification')

exports.getAlertController = async (req, res, next) => {
  try {
    const userId = req.userId

    const appConfig = await AppConfig.findOne({
      type: 'panic_mail_data'
    })

    const mailSubject = appConfig?.panic_data?.mail_subject || 'Emergency Alert'

    const mailBody = appConfig?.panic_data?.mail_body || ''

    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $unwind: {
          path: '$apartment_data',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'towers',
          localField: 'apartment_data.tower_id',
          foreignField: '_id',
          as: 'tower'
        }
      },
      {
        $lookup: {
          from: 'apartments',
          localField: 'apartment_data.apartment_id',
          foreignField: '_id',
          as: 'apartment'
        }
      },
      {
        $addFields: {
          'apartment_data.tower': {
            $arrayElemAt: ['$tower', 0]
          },
          'apartment_data.apartment': {
            $arrayElemAt: ['$apartment', 0]
          }
        }
      },
      {
        $project: {
          tower: 0,
          apartment: 0
        }
      },
      {
        $group: {
          _id: '$_id',
          user: {
            $first: '$$ROOT'
          },
          apartment_data: {
            $push: '$apartment_data'
          }
        }
      },
      {
        $addFields: {
          'user.apartment_data': '$apartment_data'
        }
      },
      {
        $replaceRoot: {
          newRoot: '$user'
        }
      }
    ])

    if (!user.length) {
      throw new Error('User not found')
    }

    const currentUser = user[0]

    const apartment = currentUser.apartment_data
      .map(item => item.apartment?.apartment_no)
      .filter(Boolean)
      .join(', ')

    const tower = currentUser.apartment_data
      .map(item => item.tower?.name)
      .filter(Boolean)
      .join(', ')

    const ownerName =
      `${currentUser.first_name} ${currentUser.last_name}`.trim()

    const contactNo = currentUser.phone

    const masterId = currentUser.created_by

    const alertTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date())

    const masterUser = await User.findById(masterId)

    if (!masterUser) {
      throw new Error('Master user not found')
    }

    const finalMailBody = mailBody
      .replace(/{{owner_name}}/g, ownerName)
      .replace(/{{apartment_number}}/g, apartment)
      .replace(/{{tower_name}}/g, tower)
      .replace(/{{alert_time}}/g, alertTime)
      .replace(/{{contact_number}}/g, contactNo)

    const guards = await User.aggregate([
      {
        $match: {
          created_by: masterId
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
          isSecurityGuard: {
            $in: [
              mongoose.Types.ObjectId.createFromHexString(
                '68cd0e38c2d476bd45384234'
              ),
              '$role_user.role_id'
            ]
          }
        }
      },
      {
        $match: {
          isSecurityGuard: true
        }
      }
    ])

    const notificationUsers = [...guards]

    if (!notificationUsers.some(user => user._id.equals(masterUser._id))) {
      notificationUsers.push(masterUser)
    }

    const finalEmails = [
      ...new Set(notificationUsers.map(user => user.email).filter(Boolean))
    ]

    await Promise.all(
      notificationUsers.map(async notifyUser => {
        if (!notifyUser.fcm_token || typeof notifyUser.fcm_token !== 'string') {
          return
        }

        const phoneNumber = notifyUser?.phone

        try {
          await sendNotification(
            notifyUser.fcm_token,
            'Emergency Alert',
            `${ownerName} has triggered a panic alert. Contact: ${phoneNumber}.`,
            'panic_alert',
            String(userId),
            'high'
          )

          await UserPushNotification.create({
            title: 'Emergency Alert',
            description: `${ownerName} has triggered a panic alert.`,
            screen: 'panic_alert',
            created_by: userId,
            user_id: notifyUser._id,
            fcm_token: notifyUser.fcm_token,
            priority: 'high',
            created_at: new Date()
          })

          console.log(
            `✅ Notification sent to ${notifyUser.email || notifyUser._id}`
          )
        } catch (err) {
          console.error(
            `❌ Failed to send notification to ${
              notifyUser.email || notifyUser._id
            }`
          )
          console.error(err)

          // Remove invalid FCM tokens
          if (
            err.code === 'messaging/registration-token-not-registered' ||
            err.code === 'messaging/invalid-registration-token'
          ) {
            try {
              await User.findByIdAndUpdate(notifyUser._id, {
                $unset: {
                  fcm_token: 1
                }
              })

              console.log(
                `🗑 Removed invalid FCM token for ${
                  notifyUser.email || notifyUser._id
                }`
              )
            } catch (updateErr) {
              console.error('Error removing invalid FCM token:', updateErr)
            }
          }
        }
      })
    )

    try {
      const info = await SendUserMail(
        finalEmails,
        mailSubject,
        finalMailBody,
        userId
      )

      console.log('✅ Mail sent:', info?.messageId || info)
    } catch (mailError) {
      console.error('❌ Error sending mail:', mailError)
    }

    return successResponse(res, 'Alert sent successfully', {
      emails: finalEmails,
      totalNotifications: notificationUsers.length
    })
  } catch (error) {
    console.error('getAlertController Error:', error)
    next(error)
  }
}
