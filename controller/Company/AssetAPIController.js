const Asset = require('../../model/Assets')
const Vendor = require('../../model/Vendor')
const User = require('../../model/User')
const AssetLocation = require('../../model/AssetLocation')
const AssetCategory = require('../../model/AssetCategory')
const { successResponse, errorResponse } = require('../../util/response')

exports.getAssetAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const assets = await Asset.find({
      created_by: userId
    })
      .populate('location_id', '_id name')
      .populate('asset_category_id', '_id name')

    if (!assets) {
      return errorResponse(res, 'Asset not found', {}, 404)
    }

    const assetLocation = await AssetLocation.find({
      created_by: userId
    })

    const assetCategory = await AssetCategory.find({
      created_by: userId
    })

    const vendor = await Vendor.find({
      created_by: userId
    })

    const users = await User.find({
      created_by: userId
    }).sort({
      first_name: 1
    })

    const finalData = {
      assets,
      category: assetCategory,
      location: assetLocation,
      vendor,
      users
    }

    return successResponse(res, 'Asset fetched successfully', finalData)
  } catch (error) {
    next(error)
  }
}

exports.postAssetAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const {
      asset_category_id,
      assigned_to,
      brand,
      condition,
      depreciationValue,
      description,
      location_id,
      model,
      name,
      purchase_cost,
      serial_number,
      status,
      vendor_id,
      warranty_end,
      warranty_start
    } = req?.body

    await Asset.create({
      name,
      asset_category_id,
      assigned_to,
      vendor_id,
      warranty_start,
      warranty_end,
      status,
      model,
      serial_number,
      brand,
      condition,
      depreciationValue,
      description,
      location_id,
      created_by: userId,
      createdAt: Date.now()
    })

    return successResponse(res, 'Asset saved successfully')
  } catch (error) {
    next(error)
  }
}

exports.putAssetAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const {
      asset_category_id,
      assigned_to,
      brand,
      condition,
      depreciationValue,
      description,
      location_id,
      model,
      name,
      purchase_cost,
      serial_number,
      status,
      vendor_id,
      warranty_end,
      warranty_start
    } = req?.body

    const { id } = req?.params

    await Asset.findOneAndUpdate(
      {
        _id: id,
        created_by: userId
      },
      {
        name,
        asset_category_id,
        assigned_to,
        vendor_id,
        warranty_start,
        warranty_end,
        status,
        model,
        serial_number,
        brand,
        condition,
        depreciationValue,
        description,
        location_id,
        updated_by: userId
      }
    )

    return successResponse(res, 'Asset saved successfully')
  } catch (error) {
    next(error)
  }
}
