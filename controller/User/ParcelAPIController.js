const User = require('../../model/User')
const Floor = require('../../model/Floor')
const Parcel = require('../../model/Parcel')
const ParcelLog = require('../../model/ParcelLog')
const { successResponse, errorResponse } = require('../../util/response')
const UserPushNotification = require('../../model/UserPushNotify')
const validate = require('../../util/validation')
const { sendNotification } = require('../../util/sendPushNotification')

exports.getParcelAPIController = async (req, res, next) => {
  try {
    const userId = req.userId

    const user = await User.findById(userId)

    if (!user) {
      throw new Error('User not found')
    }

    const masterId = user.created_by || user._id

    const residents = await User.find({
      created_by: masterId
    }).select('_id')

    const residentIds = residents.map(item => item._id)

    const parcels = await Parcel.find({
      resident_id: {
        $in: residentIds
      }
    })
      .populate('resident_id', 'first_name last_name phone')
      .populate('floor_id', 'floor_name')
      .populate('securityGuardId', 'first_name last_name')
      .sort({ createdAt: -1 })

    return successResponse(res, 'Parcel data fetched successfully', parcels)
  } catch (error) {
    next(error)
  }
}

exports.getCreateAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId
    const user = await User.findById(userId)
    const masterId = user?.created_by

    const users = await User.find({
      created_by: masterId,
      _id: {
        $ne: userId
      }
    }).select('_id first_name last_name phone')

    const floor = await Floor.find({
      created_by: masterId,
      status: true
    })
      .populate('tower_id')
      .select('tower_id floor_name status')
      .lean();

    floor.sort((a, b) => {
      const towerCompare = (a.tower_id?.name || '').localeCompare(
        b.tower_id?.name || '',
        undefined,
        { numeric: true, sensitivity: 'base' }
      );

      if (towerCompare !== 0) return towerCompare;

      return (a.floor_name || '').localeCompare(
        b.floor_name || '',
        undefined,
        { numeric: true, sensitivity: 'base' }
      );
    });

    const courierData = [
      { title: 'Amazon', value: '1' },
      { value: '2', title: 'Flipkart' },
      { value: '3', title: 'Bluedart' },
      { value: '4', title: 'DHL/FedEx' },
      { value: '5', title: 'Quick Commerce (Zepto/Instamart)' },
      { value: '6', title: 'Other' }
    ]

    const finalData = {
      users,
      floor,
      courierData
    }

    return successResponse(res, 'Create data fetched successfully', finalData)
  } catch (error) {
    next(error)
  }
}

exports.postParcelAPIController = async (req, res, next) => {
  try {
    if (!validate(req, res)) return

    const userId = req.userId

    const {
      floor_id,
      resident_id,
      courier_company,
      tracking_number,
      notes,
      product_name
    } = req.body

    if (
      !floor_id ||
      !resident_id ||
      !courier_company ||
      !product_name ||
      !tracking_number
    ) {
      throw new Error('Missing required fields')
    }

    const user = await User.findById(resident_id)

    const otp = Math.floor(1000 + Math.random() * 9000).toString()

    const parcel = await Parcel.create({
      floor_id,
      product_name,
      resident_id,
      courier_company_id: courier_company,
      trackingNumber: tracking_number,
      notes,
      otp,
      securityGuardId: userId
    })

    const populatedParcel = await parcel.populate([
      { path: 'resident_id', select: 'first_name last_name phone' },
      { path: 'floor_id', select: 'floor_name' }
    ])

    await ParcelLog.create({
      parcelId: parcel._id,
      action: '1', // Created
      performedBy: userId,
      details: 'Parcel received at security gate'
    })

    await sendNotification(
      user.fcm_token,
      'Parcel Received',
      `Your parcel ${product_name} has been received and is ready for collection. Please visit the reception at your convenience.`,
      String(resident_id),
      'high'
    )

    const userNotifyPush = new UserPushNotification({
      user_id: user._id,
      fcm_token: user.fcm_token,
      screen: 'panic_alert', // Change if you have a parcel screen
      priority: 'high',
      title: 'Parcel Received',
      description: `Your parcel ${product_name} has been  received and is ready for collection. Please visit the reception at your convenience.`,
      notification_type_id: '6a59dad036aa96e6ba56a80b',
      user_type_id: '68cd0e38c2d476bd45384234',
      created_by: userId,
      created_at: new Date()
    })

    await userNotifyPush.save()

    return successResponse(res, 'Parcel logged successfully', populatedParcel)
  } catch (err) {
    next(err)
  }
}

// Mark parcel delivered — verifies OTP server-side
exports.putParcelAPIController = async (req, res, next) => {
  try {
    const { otp } = req.body

    const parcel = await Parcel.findById(req.params.id)

    if (!parcel) {
      return errorResponse(res, 'Parcel not found', {}, 404)
    }

    if (parcel.status === '3') {
      return errorResponse(
        res,
        'Parcel is already marked as delivered',
        {},
        400
      )
    }

    if (parcel.otp !== otp) {
      return errorResponse(res, 'Invalid OTP', {}, 400)
    }

    parcel.status = '3'
    parcel.deliveredAt = new Date()

    await parcel.save()

    const populatedParcel = await parcel.populate([
      { path: 'resident_id', select: 'first_name last_name phone' },
      { path: 'floor_id', select: 'floor_name' }
    ])

    await ParcelLog.create({
      parcelId: parcel._id,
      action: '3',
      performedBy: req.userId,
      details: 'Parcel delivered'
    })

    return successResponse(
      res,
      'Parcel delivered successfully',
      populatedParcel
    )
  } catch (err) {
    next(err)
  }
}

// NEW: Mark parcel as "Left at Gate"
exports.leaveAtGateAPIController = async (req, res, next) => {
  try {
    const parcel = await Parcel.findById(req.params.id)

    if (!parcel) throw new Error('Parcel not found')

    if (parcel.status === '3') {
      throw new Error('Parcel is already delivered, cannot leave at gate')
    }

    parcel.status = '2'

    await parcel.save()

    const populatedParcel = await parcel.populate([
      { path: 'resident_id', select: 'first_name last_name phone' },
      { path: 'floor_id', select: 'floor_name' }
    ])

    await ParcelLog.create({
      parcelId: parcel._id,
      action: '2',
      performedBy: req.userId,
      details: 'Parcel left at gate'
    })

    return successResponse(
      res,
      'Parcel marked as left at gate',
      populatedParcel
    )
  } catch (err) {
    next(err)
  }
}

exports.getResidentParcelInfo = async (req, res, next) => {
  try {
    const userId = req?.userId

    const parcelData = await Parcel.find({
      resident_id: userId
    })
      .sort({ createdAt: -1 })
      .select(
        'product_name trackingNumber notes otp status gateStation createdAt deliveredAt courier_company_id'
      )
      .populate('parcel_log', 'details action timestamp ')
      .populate('securityGuardId', 'first_name last_name phone')

    if (!parcelData) {
      return errorResponse(res, 'Parcel does not exist', {}, 404)
    }

    return successResponse(res, 'Parcel data recieved successfully', parcelData)
  } catch (error) {
    next(error)
  }
}
