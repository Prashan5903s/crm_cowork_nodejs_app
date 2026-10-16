const path = require("path");
const mongoose = require("mongoose")

const Amenity = require('../../model/Amenities')
const AmenityType = require("../../model/AmenityType")
const AmenityBooking = require('../../model/AmenityBooking')
const { successResponse, errorResponse } = require('../../util/response')

const STATUS_MAP = {
  active: true,
  inactive: false,
  true: true,
  false: false,
  1: true,
  2: false,
};

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const toMinutes = (value) => {
  const [h, m] = value.split(':').map(Number)

  return h * 60 + m
}

const toDateTime = (date, time) => new Date(`${date}T${time}:00`)

const slotMinutesOf = (amenity) => {
  const period = Number(amenity.slot_time_period) || 60
  const unit = String(amenity.slot_time_unit || 'minutes').toLowerCase()

  return unit.startsWith('hour') ? period * 60 : period
}

const slug = (v) => String(v).trim().toLowerCase().replace(/\s+/g, '_')

const toBool = (v) => v === true || v === 'true' || v === '1' || v === 1

const toArray = (v) => {

  if (v === undefined || v === null || v === '') return []
  if (Array.isArray(v)) return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (s.startsWith('[')) {
      try {
        return JSON.parse(s)
      } catch (e) {
        /* fall through to comma split */
      }
    }
    return s.split(',').map((x) => x.trim()).filter(Boolean)
  }
  return [v]
}


const mapFiles = (files = []) => {
  return files.map((file) => {
    const folder =
      file.fieldname === "images" ? "images" : "documents";

    return {
      name: file.originalname,
      url: path.posix.join(
        "uploads",
        "amenities",
        folder,
        file.filename
      ),
      mime_type: file.mimetype,
      size: file.size,
    };
  });
};

const buildPayload = (body = {}) => {
  const has = (k) => body[k] !== undefined
  const data = {}

  if (has('name')) data.title = String(body.name).trim()
  if (has('type')) data.type = slug(body.type)
  if (has("status")) {
    const status = String(body.status).trim().toLowerCase();

    data.status = STATUS_MAP[status];
  }

  if (has('slot_time_period')) data.slot_time_period = Number(body.slot_time_period)
  if (has('slot_time_unit')) data.slot_time_unit = slug(body.slot_time_unit)
  if (has('start_time')) data.start_time = body.start_time
  if (has('end_time')) data.end_time = body.end_time
  if (has('available_days')) data.available_days = toArray(body.available_days).map(slug)
  if (has('occupancy_per_slot')) data.occupancy_per_slot = Number(body.occupancy_per_slot)

  if (has('internal_booking_access')) {
    data.internal_booking_access = slug(body.internal_booking_access)
  }
  if (has('property_groups')) data.property_groups = toArray(body.property_groups)
  if (has('is_public_listing')) data.is_public_listing = toBool(body.is_public_listing)
  if (has('has_tenant_monthly_quota')) {
    data.has_tenant_monthly_quota = toBool(body.has_tenant_monthly_quota)
  }
  if (has('tenant_monthly_quota')) {
    data.tenant_monthly_quota =
      body.tenant_monthly_quota === '' || body.tenant_monthly_quota === null
        ? null
        : Number(body.tenant_monthly_quota)
  }

  if (has('description')) data.description = body.description
  if (has('linked_devices')) data.linked_devices = toArray(body.linked_devices)

  return data
}

const normalizeDependents = (target) => {
  if (target.internal_booking_access === 'all') {
    target.property_groups = []
  }
  if (target.has_tenant_monthly_quota === false) {
    target.tenant_monthly_quota = null
  }
  return target
}

exports.getAmenityAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId;

    if (!userId) {

      return errorResponse(res, "Unauthorized. User ID is missing.", {}, 401);
    }

    const amenities = await Amenity.find({
      created_by: userId,
    })
      .populate("type", "name")
      .sort({ created_at: -1 })
    // .populate("property_groups", "name title")
    // .lean();

    return successResponse(
      res,
      "Amenities fetched successfully",
      amenities
    );
  } catch (error) {
    next(error);
  }
};

exports.getAmenityToggleAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId;
    const { id } = req?.params;

    // Pipeline-style update: status = !status, done in a single DB operation
    const amenity = await Amenity.findOneAndUpdate(
      { _id: id, created_by: userId },
      [{ $set: { status: { $not: '$status' } } }],
      { new: true }
    );

    if (!amenity) {
      return res.status(404).json({ success: false, message: 'Amenity not found' });
    }

    return successResponse(
      res,
      `Amenity ${amenity.status ? 'activated' : 'deactivated'} successfully`,
      amenity
    );
  } catch (error) {
    next(error);
  }
};

exports.getAmenityCreateAPIController = async (req, res, next) => {
  try {

    const userId = req?.userId

    const amenityType = await AmenityType.find({
      created_by: userId
    })

    return successResponse(res, "Amenity created fetched", amenityType)

  } catch (error) {
    next(error)
  }
}

exports.postAmenityAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId;

    if (!userId) {
      return errorResponse(res, "Unauthorized", {}, 401);
    }

    const data = normalizeDependents(buildPayload(req.body));

    await Amenity.create({
      ...data,
      images: mapFiles(req.files?.images),
      documents: mapFiles(req.files?.documents),
      created_by: userId,
    });

    return successResponse(res, "Amenity saved successfully");
  } catch (error) {
    next(error);
  }
};

exports.getEditAmenityAPIController = async (req, res, next) => {
  try {

    const userId = req?.userId;
    const { id } = req?.params

    const amenity = await Amenity.findOne({
      created_by: userId,
      _id: id
    })
      .populate("type", "name")
      .sort({ created_at: -1 })

    if (!amenity) {

      return errorResponse(res, "Amenity not found", {}, 404)
    }

    return successResponse(res, "Amenity fetched successfully", amenity)

  } catch (error) {
    next(error)
  }
}

exports.putAmenityAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId
    const { id } = req?.params

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse(res, 'Invalid amenity id', {}, 400)
    }

    // One query: finds the amenity AND checks ownership (as your old update filter did)
    const amenity = await Amenity.findOne({ _id: id, created_by: userId })

    if (!amenity) {
      return errorResponse(res, 'Amenity not found', {}, 404)
    }

    // Apply changed fields
    amenity.set(buildPayload(req.body))
    normalizeDependents(amenity)

    // Remove files the user deleted in the edit form
    const removeImages = new Set(toArray(req.body.remove_image_ids).map(String))
    const removeDocs = new Set(toArray(req.body.remove_document_ids).map(String))
    if (removeImages.size) {
      amenity.images = amenity.images.filter((f) => !removeImages.has(String(f._id)))
    }
    if (removeDocs.size) {
      amenity.documents = amenity.documents.filter((f) => !removeDocs.has(String(f._id)))
    }

    // Append newly uploaded files with relative URLs
    amenity.images.push(...mapFiles(req.files?.images));
    amenity.documents.push(...mapFiles(req.files?.documents));

    amenity.updated_by = userId;

    await amenity.save();

    return successResponse(res, "Amenity updated successfully");
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
      .populate('amenity_id')

    return successResponse(
      res,
      'Amenity booking fetched successfully',
      amenityBooking
    )
  } catch (error) {
    next(error)
  }
}

exports.postAmenityBookingController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const {
      amenity_id,
      booked_for = 'self',
      tenant_id = null,
      date,
      slots,
      remarks = '',
      no_of_person = 1
    } = req?.body || {}

    if (!mongoose.isValidObjectId(amenity_id)) {
      throw new HttpError(400, 'A valid amenity_id is required')
    }

    if (!['self', 'tenant'].includes(booked_for)) {
      throw new HttpError(400, 'booked_for must be "self" or "tenant"')
    }

    if (booked_for === 'tenant' && !mongoose.isValidObjectId(tenant_id)) {
      throw new HttpError(400, 'A valid tenant_id is required when booking for a tenant')
    }

    if (typeof date !== 'string' || !DATE_RE.test(date)) {
      throw new HttpError(400, 'date must be in YYYY-MM-DD format')
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      throw new HttpError(400, 'Select at least one time slot')
    }

    const persons = Number(no_of_person)

    if (!Number.isInteger(persons) || persons < 1) {
      throw new HttpError(400, 'no_of_person must be a positive whole number')
    }

    for (const s of slots) {
      if (!TIME_RE.test(s?.start_time || '') || !TIME_RE.test(s?.end_time || '')) {
        throw new HttpError(400, 'Each slot needs start_time and end_time in HH:mm format')
      }
    }

    const amenity = await Amenity.findById(amenity_id).lean()

    if (!amenity) throw new HttpError(404, 'Amenity not found')
    if (amenity.status === false) throw new HttpError(400, 'This amenity is not active')

    const capacity = Number(amenity.occupancy_per_slot) || 1

    if (persons > capacity) {
      throw new HttpError(400, `Only ${capacity} person(s) are allowed per slot`)
    }

    // Day of week
    const dayKey = DAY_KEYS[toDateTime(date, '00:00').getDay()]

    if (!(amenity.available_days || []).includes(dayKey)) {

      return errorResponse(res, 'This amenity is not available on the selected day', {}, 400)
    }

    const slotMinutes = slotMinutesOf(amenity)
    const openAt = toMinutes(amenity.start_time)
    const closeAt = toMinutes(amenity.end_time)
    const now = new Date()
    const seen = new Set()

    const normalizedSlots = slots
      .map((s) => ({
        start_time: s.start_time,
        end_time: s.end_time,
        start_at: toDateTime(date, s.start_time),
        end_at: toDateTime(date, s.end_time)
      }))
      .sort((a, b) => a.start_at - b.start_at)

    for (const s of normalizedSlots) {
      const start = toMinutes(s.start_time)
      const end = toMinutes(s.end_time)

      if (seen.has(s.start_time)) {

        return errorResponse(res, `Duplicate slot ${s.start_time}`, {}, 400)
      }

      seen.add(s.start_time)

      const aligned =
        end - start === slotMinutes &&
        start >= openAt &&
        end <= closeAt &&
        (start - openAt) % slotMinutes === 0

      if (!aligned) {

        return errorResponse(res, `Slot ${s.start_time} - ${s.end_time} is not a valid slot for this amenity`, {}, 400)
      }

      if (s.start_at <= now) {

        return errorResponse(res, `Slot ${s.start_time} - ${s.end_time} has already started`, {}, 400)
      }
    }

    const dayBookings = await AmenityBooking.find({
      amenity_id,
      date,
      status: 'confirmed'
    })
      .select('slots no_of_person')
      .lean()

    for (const s of normalizedSlots) {
      const taken = dayBookings.reduce((sum, b) => {
        const overlaps = b.slots.some((x) => x.start_time === s.start_time)

        return overlaps ? sum + (b.no_of_person || 1) : sum
      }, 0)

      if (taken + persons > capacity) {

        return errorResponse(res, `Slot ${s.start_time} - ${s.end_time} is fully booked`, {}, 409)
      }
    }

    if (booked_for === 'tenant' && amenity.has_tenant_monthly_quota) {
      const [y, m] = date.split('-').map(Number)
      const monthStart = new Date(y, m - 1, 1)
      const monthEnd = new Date(y, m, 1)

      const monthBookings = await AmenityBooking.find({
        amenity_id,
        tenant_id,
        status: 'confirmed',
        booking_start_time: { $gte: monthStart, $lt: monthEnd }
      })
        .select('slots')
        .lean()

      const used = monthBookings.reduce((sum, b) => sum + b.slots.length, 0)
      const quota = Number(amenity.tenant_monthly_quota) || 0

      if (used + normalizedSlots.length > quota) {

        return errorResponse(res, `Monthly quota exceeded. Used ${used} of ${quota} slots, requested ${normalizedSlots.length}.`, {}, 400)
      }
    }

    const booking = await AmenityBooking.create({
      amenity_id,
      booked_for,
      tenant_id: booked_for === 'tenant' ? tenant_id : null,
      date,
      slots: normalizedSlots,
      no_of_person: persons,
      remarks,
      created_by: userId
    })

    return successResponse(res, "Amenity booked successfully", booking)

  } catch (error) {
    if (error instanceof HttpError) {

      return errorResponse(res, error.message, {}, error.status)
    }

    if (error?.name === 'ValidationError') {

      return errorResponse(res, error.message, {}, 400)
    }

    return next(error)
  }
}
