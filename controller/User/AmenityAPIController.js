const BookingLog = require('../../model/BookingLog')
const { successResponse } = require('../../util/response')

exports.getAmenityAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const currentDate = new Date()

    const bookingLog = await BookingLog.find({
      user_id: userId
    })
      .populate({
        path: 'booking_id',
        populate: {
          path: 'amenity_id' // populate amenity
        }
      })
      .select('booking_id user_id')

    const activeBookings = bookingLog.filter(item => {
      if (!item.booking_id) return false

      return (
        new Date(item.booking_id.booking_start_time) <= currentDate &&
        new Date(item.booking_id.booking_end_time) >= currentDate
      )
    })

    return successResponse(
      res,
      'Amenity history fetched successfully',
      activeBookings
    )
  } catch (error) {
    next(error)
  }
}
