const Apartment = require('../../model/Apartment')
const User = require('../../model/User')
const RoleUser = require('../../model/RoleUser')
const bcrypt = require('bcryptjs')
const {
    successResponse,
    errorResponse
} = require('../../util/response')

exports.getTenantAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const tenant = await User.find({
            created_by: userId,
            user_type: "4"
        })

        if (!tenant) {
            return errorResponse(res, "Tenant does not exist", {}, 404)
        }

        return successResponse(res, "Tenant fetched successfully", tenant)

    } catch (error) {
        next(error)
    }
}

exports.getTenantCreateAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const apartment = await Apartment.find({
            created_by: userId,
            assigned_to: {
                $ne: null
            },
        }).populate('tower_id').populate('floor_id');

        if (!apartment) {
            return errorResponse(res, "Apartment does not exist", {}, 404)

        }

        return successResponse(res, "Apartment fetched successfully", apartment)

    } catch (error) {
        next(error)
    }
}

exports.getEditTenantAPI = async (req, res, next) => {
    try {

        const userId = req?.userId;
        const id = req?.params?.id;

        const user = await User.findOne({
            created_by: userId,
            user_type: "4",
            _id: id
        })

        if (!user) {
            return errorResponse(res, "Tenant does not exist", {}, 404)
        }

        return successResponse(res, "Tenant fetched successfully", user)

    } catch (error) {
        next(error)
    }
}

exports.postTenantAPIController = async (req, res, next) => {
    try {

        const {
            first_name,
            last_name,
            phone,
            email,
            apartment_id,
            contact_start_date,
            contact_end_date,
            password,
            rent_amount,
            rent_billing_cycle,
            move_in_date,
            move_out_date
        } = req.body

        const userId = req?.userId;

        const imageUrl = req.file ? req.file.filename : '';

        const hashedPassword = await bcrypt.hash(password, 12);

        const tenant = new User({
            first_name,
            last_name,
            email,
            company_id: userId,
            master_company_id: userId,
            parent_company_id: userId,
            phone,
            created_by: userId,
            photo: imageUrl ? `/img/user-profile/${imageUrl}` : '',
            password: hashedPassword,
            user_type: "4",
            tenant_data: {
                apartment_id,
                contact_start_date,
                contact_end_date,
                rent_billing_cycle,
                rent_amount,
                move_in_date,
                move_out_date,
            }
        })

        await tenant.save()

        const roleUser = new RoleUser({
            user_id: tenant._id,
            role_id: "68fcb8aa19932a2fcc0450b9",
            assigned_by: userId
        })

        await roleUser.save();

        await Apartment.findByIdAndUpdate(apartment_id, {
            tenant_assigned_to: tenant._id,
            tenant_assigned_at: Date.now()
        })

        return successResponse(res, "Tenant added successfully")

    } catch (error) {
        next(error)
    }
}

exports.putTenantController = async (req, res, next) => {
    try {

        const id = req?.params?.id;
        const userId = req?.userId;

        const {
            first_name,
            last_name,
            phone,
            email,
            apartment_id,
            contact_start_date,
            contact_end_date,
            password,
            rent_amount,
            rent_billing_cycle,
            move_in_date,
            move_out_date
        } = req.body

        const imageUrl = req.file ? req.file.filename : '';

        const user = await User.findOne({
            created_by: userId,
            _id: id
        })

        if (!user) {
            return errorResponse(res, "Tenant does not exist", {}, 404)
        }

        const roleUser = await RoleUser.findOne({
            user_id: id
        })

        if (!roleUser) {

            const roleUser = new RoleUser({
                user_id: id,
                role_id: "68fcb8aa19932a2fcc0450b9",
                assigned_by: userId
            })

            await roleUser.save();

        }

        await Apartment.findOneAndUpdate({
            tenant_assigned_to: id,
            _id: {
                $ne: apartment_id
            }
        }, {
            $set: {
                tenant_assigned_to: null,
                tenant_assigned_at: null
            }
        });


        await Apartment.findByIdAndUpdate(apartment_id, {
            tenant_assigned_to: id,
            tenant_assigned_at: Date.now()
        })

        await User.findOneAndUpdate({
            created_by: userId,
            _id: id
        }, {
            first_name,
            last_name,
            email,
            company_id: userId,
            master_company_id: userId,
            parent_company_id: userId,
            phone,
            created_by: userId,
            photo: imageUrl ? `/img/user-profile/${imageUrl}` : '',
            user_type: "4",
            tenant_data: {
                apartment_id,
                contact_start_date,
                contact_end_date,
                rent_billing_cycle,
                rent_amount,
                move_in_date,
                move_out_date,
            }
        })

        return successResponse(res, "Tenant updated successfully")

    } catch (error) {
        next(error)
    }
}