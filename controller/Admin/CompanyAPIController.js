const User = require('../../model/User');
const Country = require('../../model/Country');
const PackageType = require('../../model/PackageType');
const Role = require("../../model/Role");
// const Maintenance = require('../../model/Maintenance')
const bcrypt = require('bcryptjs')

exports.getCompanyIndexAPI = async (req, res, next) => {
    try {
        const userId = req.userId;

        const users = await User.find({
            created_by: userId,
            user_type: {
                $ne: "4"
            } // Exclude tenants
        })
            .populate({
                path: "roles", // virtual from userSchema
                select: "_id role_id", // ✅ show only _id and role_id in role_user
                populate: {
                    path: "role_id",
                    model: "roles",
                    select: "_id name" // ✅ only _id and name in roles
                }
            })
            .select("_id first_name last_name email address photo company_name phone apartment_data status")
            .exec();

        const role = await Role.find({
            created_by: {
                $in: [userId, "68bc14b6b297142d6bfe639c"]
            }
        })
            .select('type name description status permissions created_by')
            .populate('company_id', 'first_name last_name email');

        res.status(200).json({
            status: "Success",
            statusCode: 200,
            message: "Data successfully fetched!",
            data: {
                users,
                role
            },
        });
    } catch (error) {
        console.error("Error fetching company users:", error);
        res.status(500).json({
            status: "Error",
            statusCode: 500,
            message: "Internal server error.",
            error: error.message,
        });
    }
};


exports.createCompanyAPI = async (req, res, next) => {

    const country = await Country.find();

    const userId = req.userId;

    const packageTypes = await PackageType.find({
        created_by: userId
    }, {
        package: 1
    });

    if (!packageTypes) {
        const error = new Error("Package type does not exist!");
        error.statusCode = 404;
        throw error;
    }

    let allPackages = [];

    packageTypes.forEach((pkgTypeDoc) => {
        const packageTypeId = pkgTypeDoc._id;

        if (pkgTypeDoc.package?.items?.length) {
            pkgTypeDoc.package.items.forEach((item, index) => {
                allPackages.push({
                    ...item.toObject(), // convert Mongoose subdocument to plain object
                    package_type_id: packageTypeId,
                    index: index,
                });
            });
        }
    });

    res.json({
        status: "Success",
        statusCode: 200,
        message: "Data fetched successfully",
        data: {
            country,
            allPackages
        }
    });

}

// Helpers for multipart/form-data values
const parseBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    return value === "true" || value === "1";
};

const parsePercentage = value => {
    if (value === undefined || value === null || value === "") {
        return 0;
    }

    const percentage = Number(value);

    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
        throw new Error("Tax percentage must be between 0 and 100.");
    }

    return percentage;
};


// CREATE COMPANY
exports.postCompanyAPI = async (req, res, next) => {
    try {
        const userId = req.userId;

        const {
            first_name,
            last_name,
            company_name,
            email,
            password,
            country_id,
            state_id,
            city_id,
            address,
            status,
            phone,
            website,
            package_id,
            pincode,
            gst_no,
            pan_no,
            tax_registration_type,
            gst_applicable,
            tax_percentage,
        } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                status: "Error",
                statusCode: 400,
                message: "Password must be at least 6 characters.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const imageUrl = req.file
            ? `/img/user-profile/${req.file.filename}`
            : "";

        const user = new User({
            first_name,
            last_name,
            company_name,
            email,
            password: hashedPassword,
            country_id,
            state_id,
            city_id,
            address,
            phone,
            website,
            package_id: package_id || undefined,
            pincode,
            gst_no,
            pan_no,

            user_type: "company",
            status: parseBoolean(status, true),

            tax_registration_type:
                tax_registration_type || "unregistered",
            gst_applicable: parseBoolean(gst_applicable, false),
            tax_percentage: parsePercentage(tax_percentage),

            photo: imageUrl,

            // Required by the current schema
            company_id: 0,
            master_company_id: 0,
            parent_company_id: 0,
            created_by: userId,
        });

        await user.save();

        return res.status(201).json({
            status: "Success",
            statusCode: 201,
            message: "Company created successfully.",
            data: {
                id: user._id,
            },
        });
    } catch (error) {
        if (error.name === "ValidationError" ||
            error.name === "CastError" ||
            error.message === "Tax percentage must be between 0 and 100.") {
            return res.status(400).json({
                status: "Error",
                statusCode: 400,
                message: error.message,
            });
        }

        return next(error);
    }
};


// UPDATE COMPANY
exports.putCompanyAPI = async (req, res, next) => {
    try {
        const userId = req.userId;
        const id = req.params.id;

        const company = await User.findOne({
            _id: id,
            created_by: userId,
            user_type: "company",
        });

        if (!company) {
            return res.status(404).json({
                status: "Error",
                statusCode: 404,
                message: "Company not found.",
            });
        }

        const {
            first_name,
            last_name,
            company_name,
            email,
            country_id,
            state_id,
            city_id,
            address,
            status,
            phone,
            website,
            package_id,
            pincode,
            gst_no,
            pan_no,
            tax_registration_type,
            gst_applicable,
            tax_percentage,
        } = req.body;

        // Update only fields actually supplied by the client.
        const updates = {
            first_name,
            last_name,
            company_name,
            email,
            country_id,
            state_id,
            city_id,
            address,
            phone,
            website,
            package_id: package_id || undefined,
            pincode,
            gst_no,
            pan_no,
            user_type: "company",
            updated_at: new Date(),
        };

        // Preserve existing values when optional fields are omitted.
        if (status !== undefined && status !== "") {
            updates.status = parseBoolean(status);
        }

        if (tax_registration_type !== undefined &&
            tax_registration_type !== "") {
            updates.tax_registration_type = tax_registration_type;
        }

        if (gst_applicable !== undefined && gst_applicable !== "") {
            updates.gst_applicable = parseBoolean(gst_applicable);
        }

        if (tax_percentage !== undefined && tax_percentage !== "") {
            updates.tax_percentage = parsePercentage(tax_percentage);
        }

        // Keep the current photo unless a new one is uploaded.
        if (req.file) {
            updates.photo = `/img/user-profile/${req.file.filename}`;
        }

        // Remove undefined values so omitted fields are not overwritten.
        Object.keys(updates).forEach(key => {
            if (updates[key] === undefined) {
                delete updates[key];
            }
        });

        const updatedCompany = await User.findOneAndUpdate(
            {
                _id: id,
                created_by: userId,
                user_type: "company",
            },
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        );

        return res.status(200).json({
            status: "Success",
            statusCode: 200,
            message: "Company updated successfully.",
            data: {
                id: updatedCompany._id,
            },
        });
    } catch (error) {
        if (error.name === "ValidationError" ||
            error.name === "CastError" ||
            error.message === "Tax percentage must be between 0 and 100.") {
            return res.status(400).json({
                status: "Error",
                statusCode: 400,
                message: error.message,
            });
        }

        return next(error);
    }
};


exports.checkEmailCompanyAPI = async (req, res, next) => {
    const email = req.params.email;
    const id = req.params.id;

    const query = {
        email: email
    };
    if (id && id !== 'null' && id !== 'undefined') {
        query._id = {
            $ne: id
        };
    }

    const userExist = await User.findOne(query);
    res.json({
        exists: !!userExist
    }); // returns { exists: true } or { exists: false }
};

exports.editCompanyAPI = async (req, res, next) => {
    try {

        const userId = req.userId;
        const companyId = req.params.id;

        const company = await User.findOne({
            _id: companyId,
            created_by: userId,
            user_type: {
                $ne: "4"
            }
        });

        if (!company) {
            return res.status(404).json({
                status: "Error",
                statusCode: 404,
                message: "Company not found or access denied",
            });
        }

        return res.status(200).json({
            status: "Success",
            statusCode: 200,
            message: "Data fetched successfully",
            data: company,
        });
    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({
            status: "Error",
            statusCode: 500,
            message: "Internal server error",
        });
    }
};

exports.getCountryAPI = async (req, res, next) => {
    const country = await Country.find();
    res.json({
        status: "Success",
        statusCode: 200,
        message: "Data fetched successfully",
        data: {
            country
        }
    });

}