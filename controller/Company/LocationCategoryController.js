const AssetCategory = require('../../model/AssetCategory')
const AssetLocation = require('../../model/AssetLocation')
const { successResponse, errorResponse } = require('../../util/response')

exports.getLocationCategoryController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const assetLocation = await AssetLocation.find({
      created_by: userId
    })

    const assetCategory = await AssetCategory.find({
      created_by: userId
    })

    if (!assetLocation || !assetCategory) {
      return errorResponse(res, 'Data not found', {}, 404)
    }

    const finalData = {
      location: assetLocation,
      category: assetCategory
    }

    return successResponse(res, 'Data fetched successfully', finalData)
  } catch (error) {
    next(error)
  }
}

exports.postCategoryController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const { name, description } = req?.body

    await AssetCategory.create({
      name,
      description,
      created_by: userId,
      createdAt: Date.now()
    })

    return successResponse(res, 'Asset category fetched successfully')
  } catch (error) {
    next(error)
  }
}

exports.putCategoryController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const { id } = req?.params

    const { name, description } = req?.body

    await AssetCategory.findOneAndUpdate(
      {
        _id: id,
        created_by: userId
      },
      {
        name,
        description,
        updated_by: userId
      }
    )

    return successResponse(res, 'Asset category fetched successfully')
  } catch (error) {
    next(error)
  }
}

exports.postLocationController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const { name, description } = req?.body

    await AssetLocation.create({
      name,
      description,
      created_by: userId,
      createdAt: Date.now()
    })

    return successResponse(res, 'Asset location fetched successfully')
  } catch (error) {
    next(error)
  }
}

exports.putLocationController = async (req, res, next) => {
  try {
    const userId = req?.userId
    const { id } = req?.params

    const { name, description } = req?.body

    await AssetLocation.findOneAndUpdate(
      {
        _id: id,
        created_by: userId
      },
      {
        name,
        description,
        updated_by: userId
      }
    )

    return successResponse(res, 'Asset location fetched successfully')
  } catch (error) {
    next(error)
  }
}
