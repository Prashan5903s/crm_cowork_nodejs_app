const path = require('path');
const fs = require('fs/promises');

const Asset = require('../../model/Assets')
const AssetCategory = require("../../model/AssetCategory")
const { successResponse, errorResponse } = require('../../util/response')

exports.getAssetAPIController = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return errorResponse(res, 'Unauthorized', {}, 401);
    }

    const assetRecords = await Asset.find({
      created_by: userId,
    })
      .populate({
        path: 'asset_category_id',
        select: '_id name',
      })
      .sort({ createdAt: -1 })
      .lean();

    const assets = assetRecords.map((asset) => {
      const category = asset.asset_category_id;

      const rawStatus = String(
        asset.status || 'ACTIVE'
      ).toUpperCase();

      const allowedStatuses = [
        'ACTIVE',
        'INACTIVE',
        'MAINTENANCE',
        'DISPOSED',
      ];

      const status = allowedStatuses.includes(rawStatus)
        ? rawStatus
        : 'ACTIVE';

      const purchaseDate = asset.purchase_date
        ? new Date(asset.purchase_date)
        : null;

      return {
        _id: String(asset._id),
        id: String(asset._id),

        name: asset.name || '',

        assetCode: String(
          asset.asset_code ||
          asset.assetCode ||
          asset._id
        ),

        category: category?.name || '',

        asset_category_id: category?._id
          ? String(category._id)
          : null,

        status,

        purchaseValue: Number(asset.purchase_cost) || 0,

        purchaseDate:
          purchaseDate &&
            !Number.isNaN(purchaseDate.getTime())
            ? purchaseDate.toISOString()
            : null,

        serialNumber: asset.serial_number || '',
        description: asset.description || '',
        brand: asset.brand || '',
        model: asset.model || '',
        condition: asset.condition || '1',

        attachments: Array.isArray(asset.attachments)
          ? asset.attachments
          : [],

        createdAt: asset.createdAt || null,
        updatedAt: asset.updatedAt || null,
      };
    });

    return successResponse(
      res,
      'Assets fetched successfully',
      { assets }
    );
  } catch (error) {
    return next(error);
  }
};


exports.getAssetCreateData = async (req, res, next) => {
  try {

    const userId = req?.userId;

    const assetCategory = await AssetCategory.find({
      created_by: userId
    })

    const finalData = {
      assetCategory
    }

    return successResponse(res, "Asset category fetched successfully", finalData)

  } catch (error) {
    next(error)
  }
}

exports.getAssetEditData = async (req, res, next) => {
  try {

    const userId = req?.userId;
    const { id } = req?.params;

    const asset = await Asset.findOne({
      created_by: userId,
      _id: id
    })

    return successResponse(res, "Asset category fetched successfully", asset)

  } catch (error) {
    next(error)
  }
}

exports.postAssetAPIController = async (req, res, next) => {
  try {
    const userId = req.userId;

    const {
      name,
      category,
      description,
      serialNumber,
      status,
      purchaseValue,
      purchaseDate,
      location,
      employeeId,
    } = req.body;

    if (!name?.trim() || !category) {

      return errorResponse(res, "Asset name and category are required", {}, 400)
    }

    const clean = (value) =>
      value === '' || value === null || value === undefined
        ? undefined
        : value;

    const validStatuses = ['ACTIVE', 'INACTIVE'];
    const normalizedStatus = String(status || 'ACTIVE').toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {

      return errorResponse(res, "Invalid asset status", {}, 400)
    }

    const purchaseCost =
      purchaseValue === '' ||
        purchaseValue === null ||
        purchaseValue === undefined
        ? 0
        : Number(purchaseValue);

    if (!Number.isFinite(purchaseCost) || purchaseCost < 0) {

      return errorResponse(res, "Purchase value must be a valid non-negative number", {}, 400)
    }

    const attachments = (req.files || []).map((file) => ({
      file_name: file.originalname,
      file_url: `/uploads/assets/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
    }));

    const assetData = {
      name: name.trim(),
      asset_category_id: category,
      description: clean(description),
      serial_number: clean(serialNumber),
      status: normalizedStatus,
      purchase_cost: purchaseCost,
      purchase_date: purchaseDate
        ? new Date(purchaseDate.replace(/\s+/g, '')).toISOString().split('T')[0]
        : undefined,
      location: clean(location),
      assigned_to: clean(employeeId),
      attachments,
      created_by: userId,
    };

    try {
      const asset = await Asset.create(assetData);

      return successResponse(res, 'Asset saved successfully', asset);
    } catch (error) {
      // Remove newly uploaded files if saving the asset fails.
      await Promise.all(
        (req.files || []).map((file) =>
          fs.unlink(file.path).catch(() => { })
        )
      );

      throw error;
    }
  } catch (error) {
    if (error.code === 11000) {

      return errorResponse(res, "This serial number already exists", {}, 409)
    }

    next(error);
  }
};

exports.putAssetAPIController = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const {
      name,
      category,
      description,
      serialNumber,
      status,
      purchaseValue,
      purchaseDate,
      location,
      employeeId,
    } = req.body;



    if (!userId) {
      return errorResponse(res, 'Unauthorized', {}, 401);
    }

    if (!id) {
      return errorResponse(res, 'Asset ID is required', {}, 400);
    }

    if (!name?.trim() || !category) {
      return errorResponse(
        res,
        'Asset name and category are required',
        {},
        400
      );
    }

    const clean = (value) =>
      value === '' || value === null || value === undefined
        ? undefined
        : value;

    const finalStatus = status === 'FALSE' ? "INACTIVE" : "ACTIVE"

    const validStatuses = ['ACTIVE', 'INACTIVE'];
    const normalizedStatus = String(finalStatus || 'ACTIVE').toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      return errorResponse(res, 'Invalid asset status', {}, 400);
    }

    const purchaseCost =
      purchaseValue === '' ||
        purchaseValue === null ||
        purchaseValue === undefined
        ? 0
        : Number(purchaseValue);

    if (!Number.isFinite(purchaseCost) || purchaseCost < 0) {
      return errorResponse(
        res,
        'Purchase value must be a valid non-negative number',
        {},
        400
      );
    }

    // Verify that the category belongs to the current user.
    const validCategory = await AssetCategory.findOne({
      _id: category,
      created_by: userId,
    }).lean();

    if (!validCategory) {
      return errorResponse(res, 'Invalid asset category', {}, 400);
    }

    const assetData = {
      name: name.trim(),
      asset_category_id: category,
      description: clean(description),
      serial_number: clean(serialNumber),
      status: normalizedStatus,
      purchase_cost: purchaseCost,
      purchase_date: purchaseDate
        ? new Date(purchaseDate.replace(/\s+/g, ''))
          .toISOString()
          .split('T')[0]
        : undefined,
      location: clean(location),
      assigned_to: clean(employeeId),
      updated_by: userId,
    };

    const asset = await Asset.findOneAndUpdate(
      {
        _id: id,
        created_by: userId,
      },
      {
        $set: assetData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!asset) {
      return errorResponse(res, 'Asset not found', {}, 404);
    }

    return successResponse(
      res,
      'Asset updated successfully',
      asset
    );
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(
        res,
        'This serial number already exists',
        {},
        409
      );
    }

    if (error.name === 'ValidationError') {
      return errorResponse(res, error.message, {}, 400);
    }

    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid asset ID or field value', {}, 400);
    }

    next(error);
  }
};

