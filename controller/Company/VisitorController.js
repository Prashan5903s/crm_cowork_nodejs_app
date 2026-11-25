const mongoose = require('mongoose')

const User = require('../../model/User')
const RoleUser = require('../../model/RoleUser')
const Visitor = require('../../model/Visitor')
const Contact = require('../../model/Contact')

const {
  errorResponse,
  successResponse
} = require('../../util/response')

const MASTER_ROLE_ID = '68cd0e38c2d476bd45384234'

// Fields of the host/member (Contact) the frontend needs: memberName() reads these
const HOST_SELECT = '_id first_name last_name name full_name full_Name title email phone'

const HOST_POPULATE = {
  path: 'host_member',
  select: HOST_SELECT
}

// ---------------------------------------------------------------- helpers

function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Make sure no other visitor already holds this OTP
async function generateUniqueOtp() {
  for (let i = 0; i < 10; i++) {
    const code = generateSixDigitCode()
    const exists = await Visitor.exists({
      otp: code
    })

    if (!exists) return code
  }

  return generateSixDigitCode()
}

// Accepts "03:05 PM", "3:05pm", "03:05PM" or already-24h "15:05"
function convertTo24Hour(timeStr) {
  if (!timeStr) return null

  const match = String(timeStr)
    .trim()
    .toUpperCase()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/)

  if (!match) return null

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const modifier = match[3]

  if (modifier === 'PM' && hours !== 12) hours += 12
  if (modifier === 'AM' && hours === 12) hours = 0

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

// "2026-11-25" + "03:05 PM" -> Date (or null)
function buildDateTime(dateStr, timeStr) {
  const t = convertTo24Hour(timeStr)

  if (!dateStr || !t) return null

  const d = new Date(`${dateStr}T${t}:00`)

  return isNaN(d.getTime()) ? null : d
}

// Returns an error message, or null when the window is valid
function validateVisitWindow(date, fromTime, toTime) {
  const from = buildDateTime(date, fromTime)
  const to = buildDateTime(date, toTime)

  if (!from || !to) return 'Invalid visit date or time'
  if (to <= from) return 'End time must be later than start time'

  return null
}

// All users created by the same master as this user (the "team")
async function getTeamUserIds(userId) {
  const user = await User.findById(userId)
  const masterId = user?.created_by

  if (!masterId) return {
    user,
    ids: [String(userId)]
  }

  const team = await User.find({
    created_by: masterId
  }, '_id')

  return {
    user,
    ids: team.map(u => u._id.toString())
  }
}

// Master-role users see the whole team's records, everyone else only their own
async function getScopeFilter(userId) {
  const roleUser = await RoleUser.find({
    user_id: userId
  })
  const hasRole = roleUser.some(r => r.role_id.toString() === MASTER_ROLE_ID)

  if (!hasRole) return {
    created_by: userId
  }

  const {
    ids
  } = await getTeamUserIds(userId)

  return {
    created_by: {
      $in: ids
    }
  }
}

// Invited (1) visitors whose window has passed become Expired (3).
// Only writes when something actually changed.
async function syncVisitorStatuses(visitors) {
  const now = new Date()
  const ops = []

  for (const visitor of visitors) {
    if (String(visitor.visitor_status) !== '1') continue

    const end = buildDateTime(visitor.check_in_date, visitor.check_in_to_time)

    if (end && now > end) {
      visitor.visitor_status = '3'
      ops.push({
        updateOne: {
          filter: {
            _id: visitor._id
          },
          update: {
            $set: {
              visitor_status: '3'
            }
          }
        }
      })
    }
  }

  if (ops.length > 0) await Visitor.bulkWrite(ops)
}

// ---------------------------------------------------------------- list

exports.getVisitorController = async (req, res, next) => {
  try {
    const filter = await getScopeFilter(req.userId)

    const visitors = await Visitor.find(filter).sort({
      _id: -1
    }).populate(HOST_POPULATE)

    await syncVisitorStatuses(visitors)

    return successResponse(res, 'Visitors fetched successfully', visitors)
  } catch (error) {
    next(error)
  }
}

exports.getVisitorFilterController = async (req, res, next) => {
  try {
    const start = req?.params?.start || null // "2025-11-01"
    const end = req?.params?.end || null // "2025-11-10"

    const filter = await getScopeFilter(req.userId)

    // check_in_date is stored as "YYYY-MM-DD", so string comparison works
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

    const visitors = await Visitor.find(filter).sort({
      _id: -1
    }).populate(HOST_POPULATE)

    await syncVisitorStatuses(visitors)

    return successResponse(res, 'Visitors fetched successfully', visitors)
  } catch (error) {
    next(error)
  }
}

// ---------------------------------------------------------------- form data (host / member dropdown)

exports.createVisitorController = async (req, res, next) => {
  try {
    const filter = await getScopeFilter(req.userId)

    const contact = await Contact.find(filter).select(HOST_SELECT).sort({
      _id: -1
    })

    return successResponse(res, 'Visitor form data fetched successfully', {
      contact
    })
  } catch (error) {
    next(error)
  }
}

// ---------------------------------------------------------------- create

exports.postVisitorController = async (req, res, next) => {
  try {
    const userId = req.userId

    const {
      visitor_name,
      visitor_contact,
      email,
      company,
      purpose,
      host_member,
      checkin_date,
      checkin_from_time,
      checkin_to_time,
      id_proof_type,
      vehicle_number
    } = req.body

    const windowError = validateVisitWindow(checkin_date, checkin_from_time, checkin_to_time)

    if (windowError) return errorResponse(res, windowError, {}, 400)

    // Host must be a contact the user is allowed to see
    const scope = await getScopeFilter(userId)
    const hostExists = await Contact.exists({
      _id: host_member,
      ...scope
    })

    if (!hostExists) return errorResponse(res, 'Host / member does not exist', {}, 404)

    const visitor = new Visitor({
      visitor_name,
      visitor_contact_no: visitor_contact,
      email: email || '',
      company: company || '',
      purpose,
      host_member,
      check_in_date: checkin_date,
      check_in_from_time: checkin_from_time,
      check_in_to_time: checkin_to_time,
      id_proof_type: id_proof_type || '',
      id_proof: req.file ? req.file.filename : '',
      vehicle_no: vehicle_number ? String(vehicle_number).toUpperCase() : '',
      otp: await generateUniqueOtp(),
      visitor_status: '1',
      created_by: userId
    })

    await visitor.save()

    return successResponse(res, 'Visitor created successfully', visitor)
  } catch (error) {
    next(error)
  }
}

// ---------------------------------------------------------------- update

exports.putVisitiorController = async (req, res, next) => {
  try {
    const id = req.params.id
    const userId = req.userId

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid visitor ID', {}, 400)
    }

    const {
      visitor_name,
      visitor_contact,
      email,
      company,
      purpose,
      host_member,
      checkin_date,
      checkin_from_time,
      checkin_to_time,
      id_proof_type,
      vehicle_number
    } = req.body

    const visitor = await Visitor.findOne({
      _id: id,
      created_by: userId
    })

    if (!visitor) return errorResponse(res, 'Visitor does not exist', {}, 404)

    // Only Invited (1) or Expired (3) visits can be edited
    if (!['1', '3'].includes(String(visitor.visitor_status))) {
      return errorResponse(res, 'This visitor can no longer be edited', {}, 400)
    }

    const windowError = validateVisitWindow(checkin_date, checkin_from_time, checkin_to_time)

    if (windowError) return errorResponse(res, windowError, {}, 400)

    const scope = await getScopeFilter(userId)
    const hostExists = await Contact.exists({
      _id: host_member,
      ...scope
    })

    if (!hostExists) return errorResponse(res, 'Host / member does not exist', {}, 404)

    visitor.visitor_name = visitor_name
    visitor.visitor_contact_no = visitor_contact
    visitor.email = email || ''
    visitor.company = company || ''
    visitor.purpose = purpose
    visitor.host_member = host_member
    visitor.check_in_date = checkin_date
    visitor.check_in_from_time = checkin_from_time
    visitor.check_in_to_time = checkin_to_time
    visitor.id_proof_type = id_proof_type || ''
    visitor.vehicle_no = vehicle_number ? String(vehicle_number).toUpperCase() : ''

    // Only replace the ID proof when a new file was uploaded
    // (the old code overwrote the photo with '' on every edit)
    if (req.file) visitor.id_proof = req.file.filename

    // Rescheduled visit -> invited again (the list endpoint re-expires it if the window is already past)
    visitor.visitor_status = '1'

    await visitor.save()

    return successResponse(res, 'Visitor updated successfully', visitor)
  } catch (error) {
    next(error)
  }
}

// ---------------------------------------------------------------- gate in (accept / reject)

exports.allowGateInFunc = async (req, res, next) => {
  try {
    const id = req?.params?.id
    const status = req?.params?.status

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid visitor ID', {}, 400)
    }

    const scope = await getScopeFilter(req.userId)
    const visitor = await Visitor.findOne({
      _id: id,
      ...scope
    })

    if (!visitor) return errorResponse(res, 'Visitor does not exist', {}, 404)

    if (String(visitor.visitor_status) !== '1') {
      return errorResponse(res, 'Visitor is not awaiting gate approval', {}, 400)
    }

    if (status == true || status == 'true') {
      visitor.status = true
      visitor.visitor_status = '4'
      visitor.gate_entry_time = Date.now()
    } else {
      visitor.visitor_status = '2'
      visitor.gate_rejected_time = Date.now()
    }

    await visitor.save()

    return successResponse(res, 'Visitor updated successfully', visitor)
  } catch (error) {
    next(error)
  }
}

// ---------------------------------------------------------------- OTP / QR lookup (guard)

exports.getVisitorHappyCode = async (req, res, next) => {
  try {
    const OTP = req?.params?.otp

    const {
      user,
      ids
    } = await getTeamUserIds(req?.userId)

    if (!user) return errorResponse(res, 'User does not exist', {}, 404)

    const visitor = await Visitor.findOne({
        created_by: {
          $in: ids
        },
        otp: OTP
      })
      .sort({
        _id: -1
      })
      .select(
        '_id visitor_name visitor_contact_no email company purpose host_member check_in_date check_in_from_time check_in_to_time id_proof_type id_proof vehicle_no visitor_status status otp gate_entry_time gate_rejected_time gate_exit_time'
      )
      .populate(HOST_POPULATE)

    if (!visitor) return successResponse(res, 'Visitor does not exist', {})

    const end = buildDateTime(visitor.check_in_date, visitor.check_in_to_time)

    if (end && new Date() > end) {
      return successResponse(res, 'Visitor time expired', visitor)
    }

    return successResponse(res, 'Visitor data fetched successfully', visitor)
  } catch (error) {
    next(error)
  }
}

// ---------------------------------------------------------------- gate out

exports.getVisitorExitData = async (req, res, next) => {
  try {
    const id = req?.params?.id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid visitor ID', {}, 400)
    }

    const scope = await getScopeFilter(req.userId)
    const filter = {
      _id: id,
      ...scope
    }

    const visitor = await Visitor.findOne(filter)

    if (!visitor) return errorResponse(res, 'Visitor does not exist', {}, 404)

    if (String(visitor.visitor_status) !== '4') {
      return errorResponse(res, 'Visitor has not been checked in yet', {}, 400)
    }

    const updatedVisitor = await Visitor.findOneAndUpdate(
      filter, {
        gate_exit_time: Date.now(),
        visitor_status: '5'
      }, {
        new: true
      }
    )

    return successResponse(res, 'Visitor exited successfully', updatedVisitor)
  } catch (error) {
    next(error)
  }
}