const mongoose = require('mongoose');
const Department = require('../../model/Department');
const User = require("../../model/User")
const PropertyGroup = require("../../model/PropertyGroup")
const { successResponse, errorResponse } = require('../../util/response')

exports.getDepartmentAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const department = await Department.find({ created_by: userId });

        if (!department) {
            return errorResponse(res, "Department does not exist", {}, 404)
        }

        return successResponse(res, "Department fetched successfully", department)

    } catch (error) {
        next(error)
    }
}

exports.getDepartmentCreateData = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const propertyGroup = await PropertyGroup.find({
            created_by: userId
        })

        const users = await User.find({
            created_by: userId
        })

        const finalData = {
            propertyGroup,
            users
        }

        return successResponse(res, "Department created fetched successfully", finalData)

    } catch (error) {
        next(error)
    }
}

exports.getDepartmentEditData = async (req, res, next) => {
    try {

        const userId = req?.userId;
        const { id } = req?.params;

        const department = await Department.findOne({
            created_by: userId,
            _id: id
        })

        return successResponse(res, "Department edit fetched successfully", department)

    } catch (error) {
        next(error)
    }
}

exports.postDepartmentAPI = async (req, res, next) => {
    try {
        const userId = req.userId;
        const {
            budget,
            description,
            manager,
            name,
            propertyGroups,
            status
        } = req.body;



        const department = await Department.create({
            name,
            budget,
            description,
            manager,
            property_groups: propertyGroups,
            status,
            created_by: userId,
            company_id: userId
        })

        await department.save();

        return successResponse(res, "Department saved successfully");

    } catch (error) {
        next(error);
    }
}

exports.putDepartmentAPI = async (req, res, next) => {
    try {
        const userId = req.userId;
        const departmentId = req.params.id;

        const {
            budget,
            description,
            manager,
            name,
            propertyGroups,
            status
        } = req.body;

        const updatedDepartment = await Department.findOneAndUpdate(
            { _id: departmentId, created_by: userId },
            {
                budget,
                description,
                manager,
                name,
                propertyGroups,
                status
            },
            { new: true, runValidators: true }
        );

        if (!updatedDepartment) {
            return res.status(404).json({ message: "Department not found or access denied" });
        }

        return successResponse(res, "Department updated successfully", updatedDepartment);

    } catch (error) {
        next(error);
    }
};
