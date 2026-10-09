const Vendor = require('../../model/Vendor')
const { successResponse, errorResponse } = require('../../util/response')

exports.getVendorAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId
    const vendor = await Vendor.find({ created_by: userId })

    return successResponse(res, 'Vendor fetched successfully', vendor)
  } catch (error) {
    next(error)
  }
}

exports.postVendorAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const { company_Name, phone, email, address, gst_no, status } = req?.body

    await Vendor.create({
      company_Name,
      phone,
      email,
      address,
      status,
      gst_no,
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

    const { company_Name, phone, email, address, gst_no, status } = req?.body

    const vendor = await Vendor.findById(id)

    if (!vendor) {
      return errorResponse(res, 'Vendor not found', {}, 404)
    }

    await Vendor.findByIdAndUpdate(id, {
      company_Name,
      phone,
      email,
      address,
      status,
      gst_no,
      updated_by: userId
    })

    return successResponse(res, 'Vendor updated successfully')
  } catch (error) {
    next(error)
  }
}
