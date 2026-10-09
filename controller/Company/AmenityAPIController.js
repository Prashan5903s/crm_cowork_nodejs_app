const Amenity = require('../../model/Amenities')
const AmenityBooking = require('../../model/AmenityBooking')
const BookingLog = require('../../model/BookingLog')
const User = require('../../model/User')
const { successResponse, errorResponse } = require('../../util/response')

exports.getAmenityAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const amenity = await Amenity.find({
      created_by: userId
    })

    return successResponse(res, 'Amenities fetched successfully', amenity)
  } catch (error) {
    next(error)
  }
}

exports.postAmenityAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const {
      amenity_name,
      amenity_status,
      booking_required,
      end_time,
      multiple_bookings,
      persons_allowed,
      start_time,
      time_diffrence
    } = req?.body

    await Amenity.create({
      title: amenity_name,
      status: amenity_status,
      is_booking_required: booking_required,
      is_multiple_booking_allowed: multiple_bookings,
      no_of_person: persons_allowed,
      time_diffrence,
      start_time,
      end_time,
      created_by: userId,
      created_at: Date.now()
    })

    return successResponse(res, 'Amenity saved successfully')
  } catch (error) {
    next(error)
  }
}

exports.putAmenityAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const { id } = req?.params

    const {
      amenity_name,
      amenity_status,
      booking_required,
      end_time,
      multiple_bookings,
      persons_allowed,
      time_diffrence,
      start_time
    } = req?.body

    const amenity = await Amenity.findById(id)

    if (!amenity) {
      return errorResponse(res, 'Amenity not found', {}, 404)
    }

    await Amenity.findOneAndUpdate(
      {
        _id: id,
        created_by: userId
      },
      {
        title: amenity_name,
        status: amenity_status,
        is_booking_required: booking_required,
        time_diffrence,
        is_multiple_booking_allowed: multiple_bookings,
        no_of_person: persons_allowed,
        start_time,
        end_time,
        updated_by: userId,
        updated_at: Date.now()
      }
    )

    return successResponse(res, 'Amenity saved successfully')
  } catch (error) {
    next(error)
  }
}

exports.getAmenityBookingListController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const amenityBooking = await AmenityBooking.find({
      created_by: userId
    })
      .populate('bookingLog')
      .populate({
        path: 'amenity_id',
        select: 'title booking_start_time booking_end_time'
      })

    return successResponse(
      res,
      'Amenity booking fetched successfully',
      amenityBooking
    )
  } catch (error) {
    next(error)
  }
}

exports.getCreateAmenityBookingController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const amenity = await Amenity.find({
      created_by: userId
    }).select(
      'title start_time end_time is_multiple_booking_allowed no_of_person time_diffrence'
    )

    const users = await User.find({
      created_by: userId
    })
      .select('_id first_name last_name phone')
      .sort({
        first_name: 1,
        last_name: 1
      })

    const finalData = {
      amenity,
      users
    }

    return successResponse(
      res,
      'Amenity booking fetched successfully',
      finalData
    )
  } catch (error) {
    next(error)
  }
}

exports.postAmenityBookingController = async (req, res, next) => {
  try {
    const userId = req?.userId
    const {
      amenity,
      booking_start_time,
      booking_end_time,
      booking_time,
      booking_type,
      persons_allowed,
      user_id
    } = req?.body

    const amenity_booking = await AmenityBooking.create({
      amenity_id: amenity,
      booking_type: Number(booking_type),
      booking_start_time,
      booking_end_time,
      custom_time: booking_time,
      no_of_person: persons_allowed,
      created_by: userId,
      created_at: Date.now()
    })

    await Promise.all(
      user_id.map(uId =>
        BookingLog.create({
          user_id: uId,
          booking_id: amenity_booking._id,
          created_by: userId,
          created_at: Date.now()
        })
      )
    )

    return successResponse(res, 'Booking created successfully')
  } catch (error) {
    next(error)
  }
}

exports.putAmenityBookingController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const { id } = req?.params

    const {
      amenity,
      booking_start_time,
      booking_end_time,
      booking_time,
      booking_type,
      persons_allowed,
      user_id
    } = req?.body

    await BookingLog.deleteMany({
      booking_id: id,
      created_by: userId
    })

    await AmenityBooking.findOneAndUpdate(
      {
        _id: id
      },
      {
        amenity_id: amenity,
        booking_type: Number(booking_type),
        booking_start_time,
        booking_end_time,
        custom_time: booking_time,
        no_of_person: persons_allowed,
        created_by: userId,
        created_at: Date.now()
      }
    )

    await Promise.all(
      user_id.map(uId =>
        BookingLog.create({
          user_id: uId,
          booking_id: id,
          created_by: userId,
          created_at: Date.now()
        })
      )
    )

    return successResponse(res, 'Booking updated successfully')
  } catch (error) {
    next(error)
  }
}
