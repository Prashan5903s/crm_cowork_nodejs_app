const AMCLog = require('../../model/AMCLog')
const Asset = require('../../model/Assets')
const Vendor = require('../../model/Vendor')
const { successResponse } = require('../../util/response')

exports.getAMCAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const vendors = await Vendor.find({
      created_by: userId
    })

    const assets = await Asset.find({
      created_by: userId
    })

    const amcLog = await AMCLog.find({
      created_by: userId
    })
      .populate('asset_id', '_id name')
      .populate('vendor_id', '_id company_Name')

    const finalData = {
      amc: amcLog,
      assets,
      vendors
    }

    return successResponse(res, 'AMC fetched successfully', finalData)
  } catch (error) {
    next(error)
  }
}

exports.postAMCController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const {
      amount,
      asset_id,
      contact_no,
      end_date,
      service_frequency,
      start_date,
      status,
      vendor_id
    } = req?.body

    await AMCLog.create({
      amount,
      asset_id,
      vendor_id,
      contact_no,
      end_date,
      status,
      start_date,
      service_frequency,
      created_by: userId
    })

    return successResponse(res, 'AMC saved successfully')
  } catch (error) {
    next(error)
  }
}

exports.putAMCController = async (req, res, next) => {
  try {
    const userId = req?.userId
    const { id } = req?.params

    const {
      amount,
      asset_id,
      contact_no,
      end_date,
      service_frequency,
      start_date,
      status,
      vendor_id
    } = req?.body

    await AMCLog.findOneAndUpdate(
      {
        _id: id,
        created_by: userId
      },
      {
        amount,
        asset_id,
        vendor_id,
        contact_no,
        end_date,
        status,
        start_date,
        service_frequency,
        updated_by: userId
      }
    )

    await successResponse(res, 'AMC updated successfully')
  } catch (error) {
    next(error)
  }
}
