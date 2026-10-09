const mongoose = require('mongoose')
const Visitor = require('../../model/Visitor')
const Apartment = require('../../model/Apartment')
const User = require('../../model/User')
const RoleUser = require('../../model/RoleUser')
const VisitorType = require('../../model/VisitorType')
const { errorResponse, successResponse } = require('../../util/response')

function generateSixDigitCode () {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function convertTo24Hour (timeStr) {
  if (!timeStr) return null

  // Normalize spacing and uppercase (handles inputs like "3:05pm" or "03:05  pm")
  timeStr = timeStr.trim().toUpperCase()

  const [time, modifier] = timeStr.split(' ')
  if (!time || !modifier) return timeStr // already in 24-hour format

  let [hours, minutes] = time.split(':').map(Number)

  if (modifier === 'PM' && hours !== 12) {
    hours += 12
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0
  }

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`
}

exports.getVisitorController = async (req, res, next) => {
  try {
    const userId = req.userId

    const roleUser = await RoleUser.find({
      user_id: userId
    })

    const hasRole = roleUser.some(
      r => r.role_id.toString() === '68cd0e38c2d476bd45384234'
    )

    const users = await User.findById(userId)
    const masterId = users?.created_by

    // Get all users created by master
    const userData = await User.find({
      created_by: masterId
    })
    const userIds = userData.map(user => user._id.toString())

    // ✅ Base filter
    const filter = {}
    filter.created_by = hasRole
      ? {
          $in: userIds
        }
      : userId

    const visitors = await Visitor.find(filter)
      .sort({
        _id: -1
      })
      .populate([
        {
          path: 'user_id',
          select: '_id first_name last_name email phone'
        },
        {
          path: 'category',
          select: '_id name'
        }
      ])
      .populate({
        path: 'apartment_id',
        select: '_id apartment_no apartment_area',
        populate: [
          {
            path: 'tower_id',
            select: '_id name'
          },
          {
            path: 'floor_id',
            select: '_id floor_name'
          },
          {
            path: 'assigned_to',
            select: '_id first_name last_name'
          }
        ]
      })

    if (!visitors) {
      return errorResponse(res, 'No visitors found', {}, 404)
    }

    const now = new Date()
    const bulkUpdates = []

    for (const visitor of visitors) {
      const {
        check_in_date,
        check_in_from_time,
        check_in_to_time,
        visitor_status
      } = visitor

      // If any field missing, skip this visitor
      if (!check_in_date || !check_in_from_time || !check_in_to_time) continue

      // Combine date + time into full Date objects
      const toFrom24 = convertTo24Hour(check_in_from_time)
      const fromDateTime = new Date(`${check_in_date}T${toFrom24}:00`)

      const toTime24 = convertTo24Hour(check_in_to_time)
      const toDateTime = new Date(`${check_in_date}T${toTime24}:00`)

      let visitorStatus = 1 // default - not started

      if (now > toDateTime && visitor_status == '1') {
        visitorStatus = 3 // expired
      } else if (visitor_status != '1') {
        visitorStatus = visitor_status
      }

      bulkUpdates.push({
        updateOne: {
          filter: {
            _id: visitor._id
          },
          update: {
            $set: {
              visitor_status: visitorStatus
            }
          }
        }
      })

      // Also update the in-memory object so the response is accurate
      visitor.visitor_status = visitorStatus
    }

    // Execute all updates together for better performance
    if (bulkUpdates.length > 0) {
      await Visitor.bulkWrite(bulkUpdates)
    }

    return successResponse(res, 'Visitors fetched successfully', visitors)
  } catch (error) {
    next(error)
  }
}

exports.getVisitorFilterController = async (req, res, next) => {
  try {
    const userId = req.userId
    const start = req?.params?.start || null // "2025-11-01"
    const end = req?.params?.end || null // "2025-11-10"

    const roleUser = await RoleUser.find({
      user_id: userId
    })

    const hasRole = roleUser.some(
      r => r.role_id.toString() === '68cd0e38c2d476bd45384234'
    )

    const users = await User.findById(userId)
    const masterId = users?.created_by

    // Get all users created by master
    const userData = await User.find({
      created_by: masterId
    })
    const userIds = userData.map(user => user._id.toString())

    // ✅ Base filter
    const filter = {}
    filter.created_by = hasRole
      ? {
          $in: userIds
        }
      : userId

    // ✅ Fixed date filter (compare as string, not Date)
    if (start && end) {
      filter.check_in_date = {
        $gte: start,
        $lte: end
      }
    } else if (start) {
      filter.check_in_date = {
        $gte: start
      }
    } else if (end) {
      filter.check_in_date = {
        $lte: end
      }
    }

    const visitors = await Visitor.find(filter)
      .populate([
        {
          path: 'user_id',
          select: '_id first_name last_name'
        },
        {
          path: 'category',
          select: '_id name'
        }
      ])
      .populate({
        path: 'apartment_id',
        select: '_id apartment_no apartment_area',
        populate: [
          {
            path: 'tower_id',
            select: '_id name'
          },
          {
            path: 'floor_id',
            select: '_id floor_name'
          },
          {
            path: 'assigned_to',
            select: '_id first_name last_name'
          }
        ]
      })

    if (!visitors) {
      return errorResponse(res, 'No visitors found', {}, 404)
    }

    const now = new Date()
    const bulkUpdates = []

    for (const visitor of visitors) {
      const {
        check_in_date,
        check_in_from_time,
        check_in_to_time,
        visitor_status
      } = visitor

      if (!check_in_date || !check_in_from_time || !check_in_to_time) continue

      const toFrom24 = convertTo24Hour(check_in_from_time)
      const fromDateTime = new Date(`${check_in_date}T${toFrom24}:00`)

      const toTime24 = convertTo24Hour(check_in_to_time)
      const toDateTime = new Date(`${check_in_date}T${toTime24}:00`)

      let visitorStatus = 1 // default: not started

      if (now > toDateTime && visitor_status == '1') {
        visitorStatus = 3 // expired
      } else if (visitor_status != '1') {
        visitorStatus = visitor_status
      }

      // Prepare bulk update
      bulkUpdates.push({
        updateOne: {
          filter: {
            _id: visitor._id
          },
          update: {
            $set: {
              visitor_status: visitorStatus
            }
          }
        }
      })

      visitor.visitor_status = visitorStatus
    }

    if (bulkUpdates.length > 0) {
      await Visitor.bulkWrite(bulkUpdates)
    }

    return successResponse(res, 'Visitor fetched successfully', visitors)
  } catch (error) {
    next(error)
  }
}

// exports.getVisitorFilterController = async (req, res, next) => {
//     try {

//         const userId = req.userId;
//         const start = req?.params?.start ? new Date(req.params.start) : null;
//         const end = req?.params?.end ? new Date(req.params.end) : null;

//         const roleUser = await RoleUser.find({
//             user_id: userId
//         });

//         const hasRole = roleUser.some(r => r.role_id.toString() === "68cd0e38c2d476bd45384234");

//         const users = await User.findById(userId);
//         const masterId = users?.created_by;

//         // Get all users created by master
//         const userData = await User.find({
//             created_by: masterId
//         });
//         const userIds = userData.map(user => user._id.toString());

//         // Base filter
//         const filter = {};

//         filter.created_by = hasRole ? {
//             $in: userIds
//         } : userId;

//         // Optional date filters
//         if (start && end) {
//             filter.check_in_date = {
//                 $gte: start,
//                 $lte: end
//             };
//         } else if (start) {
//             filter.check_in_date = {
//                 $gte: start
//             };
//         } else if (end) {
//             filter.check_in_date = {
//                 $lte: end
//             };
//         }

//         const visitors = await Visitor.find(filter)
//             .populate('user_id')
//             .populate('category')
//             .populate({
//                 path: 'apartment_id',
//                 populate: [{
//                         path: 'tower_id'
//                     },
//                     {
//                         path: 'floor_id'
//                     }
//                 ]
//             });

//         if (!visitors) {
//             return errorResponse(res, "No visitors found", {}, 404);
//         }

//         const now = new Date();
//         const bulkUpdates = [];

//         for (const visitor of visitors) {
//             const {
//                 check_in_date,
//                 check_in_from_time,
//                 check_in_to_time,
//                 status
//             } = visitor;

//             // If any field missing, skip this visitor
//             if (!check_in_date || !check_in_from_time || !check_in_to_time) continue;

//             const toFrom24 = convertTo24Hour(check_in_from_time);
//             const fromDateTime = new Date(`${check_in_date}T${toFrom24}:00`);

//             const toTime24 = convertTo24Hour(check_in_to_time);
//             const toDateTime = new Date(`${check_in_date}T${toTime24}:00`);

//             let visitorStatus = 1; // default - not started

//             if (status === true || status === "true") {
//                 visitorStatus = 4; // completed
//             } else if (now > toDateTime) {
//                 visitorStatus = 3; // expired
//             }

//             // Prepare bulk update
//             bulkUpdates.push({
//                 updateOne: {
//                     filter: {
//                         _id: visitor._id
//                     },
//                     update: {
//                         $set: {
//                             visitor_status: visitorStatus
//                         }
//                     },
//                 },
//             });

//             // Also update the in-memory object so the response is accurate
//             visitor.visitor_status = visitorStatus;
//         }

//         // Execute all updates together for better performance
//         if (bulkUpdates.length > 0) {
//             await Visitor.bulkWrite(bulkUpdates);
//         }

//         return successResponse(res, "Visitor fetched successfully", visitors);

//     } catch (error) {
//         next(error);
//     }
// };

exports.createVisitorController = async (req, res, next) => {
  try {
    const userId = req.userId

    const data = {}

    const users = await User.findById(userId)
    const masterId = users.created_by

    let apartment = {}

    const targetRoleId = '68cd0e38c2d476bd45384234'

    const roleExists = await RoleUser.exists({
      user_id: userId,
      role_id: targetRoleId
    })

    if (roleExists) {
      apartment = await Apartment.find({
        created_by: masterId,
        assigned_to: {
          $ne: null
        }
      })
        .select(
          '_id apartment_no apartment_area apartment_type tower_id floor_id assigned_to'
        ) // ✅ only include needed fields from Apartment
        .populate({
          path: 'assigned_to',
          select: '_id first_name last_name phone email' // adjust as needed
        })
        .populate({
          path: 'tower_id',
          select: '_id name'
        })
        .populate({
          path: 'floor_id',
          select: '_id floor_name'
        })
    } else {
      apartment = await Apartment.find({
        assigned_to: userId
      })
    }

    const visitorType = await VisitorType.find({
      created_by: masterId
    })

    if (!apartment || !visitorType) {
      return errorResponse(res, 'Apartment does not exist', {}, 404)
    }

    data['apartment'] = apartment
    data['visitorType'] = visitorType

    return successResponse(res, 'Apartment fetched successfully', data)
  } catch (error) {
    next(error)
  }
}

exports.postVisitorController = async (req, res, next) => {
  try {
    const userId = req.userId

    const imageUrl = req.file ? req.file.filename : ''

    const {
      visitor_name,
      visitor_contact,
      checkin_date,
      checkin_from_time,
      checkin_to_time,
      apartment_id,
      check_end_date,
      is_frequent,
      no_of_persons,
      vehicle_number,
      category,
      description
    } = req.body

    let apartmentId = null

    if (!apartment_id) {
      const apartments = await Apartment.findOne({
        assigned_to: userId
      })

      if (!apartments) {
        return errorResponse(res, 'User has no apartment assigned', {}, 500)
      } else {
        apartmentId = apartments._id
      }
    } else {
      apartmentId = apartment_id
    }

    const visitor = new Visitor({
      visitor_name,
      apartment_id: apartmentId,
      visitor_contact_no: visitor_contact,
      check_in_date: checkin_date,
      is_frequent,
      check_end_date,
      check_in_from_time: checkin_from_time,
      check_in_to_time: checkin_to_time,
      no_person: no_of_persons,
      vehicle_no: vehicle_number,
      photo: imageUrl,
      category,
      description,
      otp: generateSixDigitCode(),
      created_by: userId,
      user_id: userId
    })

    await visitor.save()

    return successResponse(res, 'Visitor created successfully')
  } catch (error) {
    next(error)
  }
}

exports.putVisitiorController = async (req, res, next) => {
  try {
    const id = req.params.id
    const userId = req.userId

    const imageUrl = req.file ? req.file.filename : ''

    const {
      visitor_name,
      visitor_contact,
      checkin_date,
      checkin_from_time,
      checkin_to_time,
      apartment_id,
      check_end_date,
      no_of_persons,
      vehicle_number,
      is_frequent,
      category,
      description
    } = req.body

    let apartmentId = null

    if (!apartment_id) {
      const apartments = await Apartment.findOne({
        assigned_to: userId
      })
      if (apartments) {
        apartmentId = apartments._id
      }
    } else {
      apartmentId = apartment_id
    }

    await Visitor.findOneAndUpdate(
      {
        _id: id,
        created_by: userId
      },
      {
        visitor_name,
        apartment_id: apartmentId,
        visitor_contact_no: visitor_contact,
        check_in_date: checkin_date,
        check_end_date,
        check_in_from_time: checkin_from_time,
        check_in_to_time: checkin_to_time,
        is_frequent,
        no_person: no_of_persons,
        photo: imageUrl,
        vehicle_no: vehicle_number,
        category,
        description
      }
    )

    return successResponse(res, 'Visitor updated successfully')
  } catch (error) {
    next(error)
  }
}

exports.allowGateInFunc = async (req, res, next) => {
  try {
    const id = req?.params?.id

    const status = req?.params?.status

    if (status == true || status == 'true') {
      await Visitor.findByIdAndUpdate(id, {
        status: true,
        visitor_status: '4',
        gate_entry_time: Date.now()
      })
    } else {
      await Visitor.findOneAndUpdate(
        {
          _id: id
        },
        {
          visitor_status: '2',
          gate_rejected_time: Date.now()
        }
      )
    }

    return successResponse(res, 'Visitor allowed successfully')
  } catch (error) {
    next(error)
  }
}

exports.getVisitorHappyCode = async (req, res, next) => {
  try {
    const userId = req?.userId

    const OTP = req?.params?.otp

    const user = await User.findById(userId)

    if (!user) {
      return errorResponse(res, 'User does not exist', {}, 404)
    }

    const masterId = user?.created_by

    const users = await User.find(
      {
        created_by: masterId
      },
      '_id'
    )

    const userIds = users.map(user => user._id)

    const visitor = await Visitor.findOne({
      created_by: {
        $in: userIds
      },
      otp: OTP
    })
      .select(
        '_id check_in_date check_in_from_time check_in_to_time no_person vehicle_no photo description visitor_status status otp visitor_name visitor_contact_no gate_entry_time gate_rejected_time gate_exit_time apartment_id category user_id'
      ) // only fetch needed fields
      .populate({
        path: 'apartment_id',
        select: '_id apartment_no tower_id floor_id',
        populate: [
          {
            path: 'tower_id',
            select: '_id name' // ✅ tower fields
          },
          {
            path: 'floor_id',
            select: '_id floor_name' // ✅ floor fields
          }
        ]
      })
      .populate({
        path: 'user_id',
        select: '_id first_name last_name email phone' // ✅ user fields
      })
      .populate({
        path: 'category',
        select: '_id name' // ✅ category fields
      })

    if (!visitor) {
      return successResponse(res, 'Visitor does not exist', {})
    }

    const checkDate = visitor?.check_in_date
    const checkInToTime = visitor?.check_in_to_time

    // Combine date + time into full Date objects

    const toTime24 = convertTo24Hour(checkInToTime)
    const toDateTime = new Date(`${checkDate}T${toTime24}:00`)

    const now = new Date()

    if (now > toDateTime) {
      return successResponse(res, 'Visitor time expired', visitor)
    } else {
      return successResponse(res, 'Visitor data fetched successfully', visitor)
    }
  } catch (error) {
    next(error)
  }
}

exports.getVisitorExitData = async (req, res, next) => {
  try {
    const userId = req?.userId
    const id = req?.params?.id

    // ✅ Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid visitor ID', {}, 400)
    }

    // ✅ Find roles for current user
    const roleUser = await RoleUser.find({
      user_id: userId
    })

    // ✅ Check if user has the specific role
    const hasRole = roleUser.some(
      r => r.role_id.toString() === '68cd0e38c2d476bd45384234'
    )

    // ✅ Find user and master
    const user = await User.findById(userId)
    const masterId = user?.created_by

    // ✅ Get all users created by the master (if applicable)
    const userData = await User.find({
      created_by: masterId
    })
    const userIds = userData.map(u => u._id.toString())

    // ✅ Build filter correctly
    const filter = {
      _id: id,
      created_by: hasRole
        ? {
            $in: userIds
          }
        : userId
    }

    // ✅ Check if visitor exists and status is valid
    const visitor = await Visitor.findOne(filter)

    if (!visitor) {
      return errorResponse(res, 'Visitor does not exist', {}, 404)
    }

    if (visitor.visitor_status !== '4') {
      return errorResponse(res, 'Visitor has not been checked in yet', {}, 400)
    }

    // ✅ Update visitor record safely
    const updatedVisitor = await Visitor.findOneAndUpdate(
      filter,
      {
        gate_exit_time: Date.now(),
        visitor_status: '5'
      },
      {
        new: true
      } // return updated doc
    )

    return successResponse(res, 'Visitor exited successfully', updatedVisitor)
  } catch (error) {
    next(error)
  }
}
