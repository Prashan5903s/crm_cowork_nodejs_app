const InspectionTemplate = require('../../model/InspectionTemplate')
const AssetCategory = require('../../model/AssetCategory')
const { successResponse } = require('../../util/response')

exports.getInpectionTemplateData = async (req, res, next) => {
  try {
    const userId = req?.userId

    const inspectionTemplate = await InspectionTemplate.find({
      created_by: userId
    }).populate('category')

    const assetCategory = await AssetCategory.find({
      created_by: userId
    })

    const finalData = {
      inspection: inspectionTemplate,
      category: assetCategory
    }

    return successResponse(
      res,
      'Inspection template fetched successfully',
      finalData
    )
  } catch (error) {
    next(error)
  }
}

exports.postInspectionTemplateController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const { category, checklist, name } = req?.body

    await InspectionTemplate.create({
      name,
      category,
      checklist,
      created_by: userId
    })

    return successResponse(res, 'Inspection template saved successfully')
  } catch (error) {
    next(error)
  }
}

exports.putInspectionTemplateController = async (req, res, next) => {
  try {
    const userId = req.userId
    const { id } = req.params
    const { category, checklist, name } = req.body

    const inspectionTemplate = await InspectionTemplate.findOneAndUpdate(
      {
        _id: id,
        created_by: userId
      },
      {
        $set: {
          name,
          category,
          checklist,
          updated_by: userId
        }
      },
      {
        new: true,
        runValidators: true
      }
    )

    if (!inspectionTemplate) {
      return errorResponse(res, 'Inspection template not found', 404)
    }

    return successResponse(
      res,
      'Inspection template updated successfully',
      inspectionTemplate
    )
  } catch (error) {
    next(error)
  }
}
