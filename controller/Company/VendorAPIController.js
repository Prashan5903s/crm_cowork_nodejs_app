const Vendor = require('../../model/Vendor')
const Country = require('../../model/Country')
const VendorCategory = require('../../model/VendorCategory')
const { successResponse, errorResponse } = require('../../util/response')

const getRelativeImagePath = (file, uploadDir) => {
  if (!file) return undefined

  const relative =
    file.relativePath || // set by your createUpload middleware
    `${uploadDir || ''}/${file.filename}`

  return relative
    .replace(/\\/g, '/') // backslashes -> forward slashes
    .replace(/\/{2,}/g, '/') // collapse double slashes
    .replace(/^\/+/, '') // no leading slash
}

const buildVendorData = (body = {}, file, uploadDir) => {
  const map = {
    company_Name: body.name ?? body.company_Name,
    vendor_category_id: body.category ?? body.vendor_category_id,
    gst_no: body.taxNumber ?? body.gst_no,
    contact_name: body.contactName ?? body.contact_name,
    email: body.email,
    country_code: body.countryCode ?? body.country_code,
    phone: body.mobileNumber ?? body.phone,
    city: body.city,
    state: body.state,
    country: body.country,
    address: body.address
  }

  const data = {}
  for (const [key, value] of Object.entries(map)) {
    if (value !== undefined) data[key] = typeof value === 'string' ? value.trim() : value
  }

  if (body.status !== undefined) {
    data.status = body.status === true || body.status === 'true'
  }

  if (file) data.image = getRelativeImagePath(file, uploadDir)

  return data
}

exports.getVendorAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const vendor = await Vendor
      .find({ created_by: userId })
      .populate("vendor_category_id")

    return successResponse(res, 'Vendor fetched successfully', vendor)
  } catch (error) {
    next(error)
  }
}

exports.getVendorCreateAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const vendorCategory = await VendorCategory.find({ created_by: userId })
    const country = await Country.find()

    return successResponse(res, 'Vendor create fetched successfully', {
      country,
      vendorCategory
    })
  } catch (error) {
    next(error)
  }
}

exports.getVendorEditData = async (req, res, next) => {
  try {

    const userId = req?.userId;
    const { id } = req?.params;

    const vendor = await Vendor.findOne({
      created_by: userId,
      _id: id
    })

    if (!vendor) {
      return errorResponse(res, "Vendor not found", {}, 404)
    }

    return successResponse(res, "Vendor edit fetched successfully", vendor)

  } catch (error) {
    next(error)
  }
}

exports.postVendorAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const data = buildVendorData(req?.body, req?.file, req?.uploadPath)

    await Vendor.create({
      ...data,
      created_by: userId
    })

    return successResponse(res, 'Vendor saved successfully')
  } catch (error) {
    next(error)
  }
}

exports.putVendorAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId
    const { id } = req?.params

    const vendor = await Vendor.findById(id)

    if (!vendor) {
      return errorResponse(res, 'Vendor not found', {}, 404)
    }

    // set() + save() runs schema validation, trimming and casting
    vendor.set({
      ...buildVendorData(req?.body, req?.file, req?.uploadPath),
      updated_by: userId
    })
    await vendor.save()

    return successResponse(res, 'Vendor updated successfully')
  } catch (error) {
    next(error)
  }
}