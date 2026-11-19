const User = require('../../model/User');
const Role = require('../../model/Role');
const RoleUser = require('../../model/RoleUser');
const userService = require('../../services/userService');
const bcrypt = require('bcryptjs')
const Apartment = require('../../model/Apartment')
// const Maintenance = require('../../model/Maintenance')
const {
    encryptDeterministic,
    hashSearchField
} = require('../../util/encryption');

const {
    hash,
    normalizeEmail,
    normalizePhone
} = require('../../util/encryption');
const {
    successResponse,
    errorResponse,
    warningResponse
} = require('../../util/response');

const updateApartmentStatus = async (idArray, userId) => {
    try {

        // Step 1: Assign selected apartments
        await Apartment.updateMany({
            _id: {
                $in: idArray
            }
        }, {
            $set: {
                assigned_to: userId,
                assigned_at: Date.now(),
                status: true
            }
        });

        
        // Step 2: Unassign apartments previously assigned to user but not in the new selection
        await Apartment.updateMany({
            assigned_to: userId,
            _id: {
                $nin: idArray
            }
        }, {
            $set: {
                assigned_to: null,
                assigned_at: null,
                status: false
            }
        });


    } catch (error) {
        console.error("Error updating apartments:", error);
    }
};

const normalizeCameras = (raw, body) => {
    const indexed = parseIndexedRowsFromBody(body, "cameras", ["title", "ip"]);
    if (indexed.length) return indexed;

    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") return [raw];

    if (typeof raw === "string") {
        if (raw.trim() === "[object Object]") return [];
        const parsed = safeJSONParse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") return [parsed];

        if (raw.includes("|")) {
            return raw.split(",").map(s => {
                const [title, ip] = s.split("|");
                return {
                    title: (title || "").trim(),
                    ip: (ip || "").trim()
                };
            }).filter(c => c.title || c.ip);
        }
        return [];
    }
    return [];
};

const normalizeApartmentData = (raw, body) => {
    // prefer indexed multipart fields: apartment_data[0][tower_id] etc
    const indexed = parseIndexedRowsFromBody(body, "apartment_data", ["tower_id", "floor_id", "apartment_id"]);
    if (indexed.length) return indexed.map(row => ({
        tower_id: typeof row.tower_id === "string" ? row.tower_id.trim() : row.tower_id,
        floor_id: typeof row.floor_id === "string" ? row.floor_id.trim() : row.floor_id,
        apartment_id: typeof row.apartment_id === "string" ? row.apartment_id.trim() : row.apartment_id
    }));

    // if already an array
    if (Array.isArray(raw)) {
        return raw.map(r => {
            if (!r || typeof r !== "object") return null;
            return {
                tower_id: typeof r.tower_id === "string" ? r.tower_id.trim() : r.tower_id,
                floor_id: typeof r.floor_id === "string" ? r.floor_id.trim() : r.floor_id,
                apartment_id: typeof r.apartment_id === "string" ? r.apartment_id.trim() : r.apartment_id
            };
        }).filter(Boolean);
    }

    // if plain object
    if (raw && typeof raw === "object") {
        return [{
            tower_id: typeof raw.tower_id === "string" ? raw.tower_id.trim() : raw.tower_id,
            floor_id: typeof raw.floor_id === "string" ? raw.floor_id.trim() : raw.floor_id,
            apartment_id: typeof raw.apartment_id === "string" ? raw.apartment_id.trim() : raw.apartment_id
        }];
    }

    // string cases
    if (typeof raw === "string") {
        if (raw.trim() === "[object Object]") return [];
        const parsed = safeJSONParse(raw);
        if (Array.isArray(parsed)) return normalizeApartmentData(parsed, {}); // recursive handle
        if (parsed && typeof parsed === "object") return normalizeApartmentData(parsed, {});
        // maybe CSV-ish "tower|floor|apt,tower|floor|apt"
        if (raw.includes("|")) {
            const arr = raw.split(",").map(s => {
                const [tower, floor, apt] = s.split("|");
                return {
                    tower_id: (tower || "").trim(),
                    floor_id: (floor || "").trim(),
                    apartment_id: (apt || "").trim()
                };
            }).filter(r => r.tower_id || r.floor_id || r.apartment_id);
            return arr;
        }
        return [];
    }

    return [];
};

const pick = (obj, fields) => Object.fromEntries(fields.map(key => [key, obj[key]]));

exports.getCompanyIndexAPI = async (req, res, next) => {

    const userId = req.userId;
    const company = await User.find({
        created_by: userId,
        user_type: {
            $ne: "4"
        }
    });

    res.status(200).json({
        'status': 'Success',
        'statusCode': 200,
        'message': 'Data successfully fetched!',
        data: {
            company,
        }
    });
}

// --- helpers (place once at top of file) ---
const sanitizeObjectIds = (data, objectIdFields) => {
    // If data[field] is "", undefined or null -> set to null
    // If data[field] is an array of objects -> sanitize each object's fields too (common for apartment_data)
    objectIdFields.forEach(f => {
        if (!(f in data)) return;

        const v = data[f];
        if (v === "" || v === undefined || v === null) {
            data[f] = null;
            return;
        }

        // If string that looks like "null" or "undefined"
        if (typeof v === "string" && (v.trim() === "" || v.trim().toLowerCase() === "null" || v.trim().toLowerCase() === "undefined")) {
            data[f] = null;
            return;
        }

        // If array of objects, sanitize inner fields that look like object ids
        if (Array.isArray(v)) {
            data[f] = v.map(item => {
                if (item && typeof item === "object") {
                    const copy = {
                        ...item
                    };
                    Object.keys(copy).forEach(k => {
                        if (copy[k] === "" || copy[k] === undefined || copy[k] === null) copy[k] = null;
                    });
                    return copy;
                }
                return item;
            });
        }
    });
};

// Utility: safe JSON parse
const safeJSONParse = (s) => {
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
};

// parse indexed multipart like apartment_data[0][tower_id]
const parseIndexedRowsFromBody = (body, baseName, fields) => {
    const map = new Map(); // idx -> object
    for (const key of Object.keys(body)) {
        const regex = new RegExp(`^${baseName}\\[(\\d+)]\\[(.+)]$`); // e.g. apartment_data[0][tower_id]
        const m = key.match(regex);
        if (!m) continue;
        const idx = Number(m[1]);
        const field = m[2];
        if (fields && !fields.includes(field)) continue; // optional filter of allowed subfields
        const item = map.get(idx) || {};
        item[field] = body[key];
        map.set(idx, item);
    }
    if (map.size === 0) return [];
    return [...map.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, v]) => v)
        .filter(v => v && Object.keys(v).length);
};

// sanitize a row array shape to ensure strings trimmed and empty -> null as appropriate
const normalizeApartmentRowsShape = (rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
        tower_id: (typeof r.tower_id === "string" && r.tower_id.trim() !== "") ? r.tower_id.trim() : null,
        floor_id: (typeof r.floor_id === "string" && r.floor_id.trim() !== "") ? r.floor_id.trim() : null,
        apartment_id: (typeof r.apartment_id === "string" && r.apartment_id.trim() !== "") ? r.apartment_id.trim() : null,
    })).filter(r => r.tower_id || r.floor_id || r.apartment_id);
};

// --- createUserAPI (replace your old function) ---
exports.createUserAPI = async (req, res, next) => {
    try {
        const userId = req.userId;

        const imageUrl = req.file?.filename ? `/img/user-profile/${req.file.filename}` : '';

        const allowedFields = [
            'first_name', 'first_name_search', 'last_name', 'email', 'country_id', 'state_id',
            'city_id', 'address', 'status', 'phone', 'dob', 'website', 'floor_id', 'apartment_id', 'no_of_members',
            'pincode', 'designation_id', 'urn_no', 'idfa_code', 'department_id', 'cameras', 'no_of_pets', 'vehicle_data',
            'qnap_username', 'qnap_password', 'sip_extension', 'user_type', 'apartment_data',
            'application_no', 'licence_no', 'tower_id', 'employee_type', 'participation_type_id',
            'user_code'
        ];

        // ---------- helpers used above are available here ----------

        const toBool = v => {
            if (typeof v === 'boolean') return v;
            if (typeof v === 'string') return v.toLowerCase() === 'true';
            return !!v;
        };

        const userExists = await User.findOne({
            email_hash: hash(normalizeEmail(req.body.email)),
            company_id: userId,
            user_type: {
                $ne: "4"
            }
        });
        if (userExists) {
            return errorResponse(res, 'This email already been taken!', {}, 400);
        }

        const phoneExists = await User.findOne({
            phone_hash: hash(normalizePhone(req.body.phone)),
            company_id: userId,
            user_type: {
                $ne: "4"
            }
        });
        if (phoneExists) {
            return errorResponse(res, 'This phone already been taken!', {}, 400);
        }

        // pick only allowed fields
        const userData = pick(req.body, allowedFields);

        // Normalize booleans
        userData.status = toBool(userData.status);

        // Ensure sip_extension exists (avoid Mongoose required error). Set safe default if absent.
        if (!("sip_extension" in userData) || userData.sip_extension === undefined || userData.sip_extension === null) {
            userData.sip_extension = ""; // adjust if your schema expects null or empty string
        }

        // Normalize cameras
        userData.cameras = normalizeCameras(req.body.cameras, req.body)
            .map(c => ({
                title: typeof c?.title === 'string' ? c.title.trim() : '',
                ip: typeof c?.ip === 'string' ? c.ip.trim() : ''
            }))
            .filter(c => c.title || c.ip);

        const apartmentIds = (req.body.apartment_data || [])
            .map(item => item.apartment_id)
            .filter(Boolean); // removes undefined/null/empty

        // Normalize apartment_data robustly
        userData.apartment_data = normalizeApartmentData(req.body.apartment_data, req.body);
        userData.apartment_data = normalizeApartmentRowsShape(userData.apartment_data);

        // Sanitize ObjectId-like fields (including possibly nested arrays)
        sanitizeObjectIds(userData, [
            "floor_id", "apartment_id", "designation_id",
            "department_id", "tower_id", "participation_type_id",
            "country_id", "state_id", "city_id"
        ]);

        // Password required on create
        if (!req.body.password) {
            return errorResponse(res, 'Password is required', {}, 400);
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 12);

        // Employee codes
        let processedCodes = [];
        if (req.body.user_code != undefined) {
            const result = await processEmployeeCodesForUser({
                rawCodes: req.body.user_code,
                userId: null,
                existingUser: null
            });
            if (!result.success) {
                return errorResponse(res, result.message, {}, 400);
            }
            processedCodes = result.codes;
        }

        // Build model payload
        const userPayload = {
            ...userData,
            photo: imageUrl,
            password: hashedPassword,
            company_id: userId,
            master_company_id: userId,
            parent_company_id: userId,
            created_by: userId,
            codes: processedCodes
        };

        // Save
        const user = new User(userPayload);
        await user.save();

        updateApartmentStatus(apartmentIds, user._id)

        // Roles: accept string or array
        const roles = Array.isArray(req.body.roles) ?
            req.body.roles :
            typeof req.body.roles === 'string' && req.body.roles.trim().length ?
                req.body.roles.split(',').map(r => r.trim()) : [];

        if (roles.length) {
            const roleDocs = await Role.find({
                _id: {
                    $in: roles
                }
            });
            if (roleDocs.length) {
                const roleUserInserts = roleDocs.map(role => ({
                    user_id: user._id,
                    role_id: role._id,
                    assigned_by: userId
                }));
                await RoleUser.insertMany(roleUserInserts);
            }
        }

        return successResponse(res, 'User created successfully!', user);
    } catch (error) {
        next(error);
    }
};

const processEmployeeCodesForUser = async ({
    rawCodes,
    userId,
    existingUser = null
}) => {
    let parsedCodes = [];
    try {
        parsedCodes = rawCodes;
        if (!Array.isArray(parsedCodes)) {
            parsedCodes = [parsedCodes];
        }
    } catch {
        return {
            success: true,
            codes: existingUser?.codes || []
        };
    }

    if (parsedCodes.length === 0) {
        return {
            success: true,
            codes: existingUser?.codes || []
        };
    }


    const normalizedCodes = parsedCodes
        .map(code => (code != null ? String(code).trim() : ''))
        .filter(Boolean);

    const duplicateUsers = await User.find({
        user_type: {
            $ne: "4"
        },
        'codes.code': {
            $in: normalizedCodes
        }
    }).select('codes');

    const foundCodes = new Set();
    for (const user of duplicateUsers) {
        user.codes.forEach(c => {
            const codeLower = c.code;
            if (normalizedCodes.includes(codeLower)) {
                foundCodes.add(codeLower);
            }
        });
    }
    if (foundCodes.size > 0) {
        return {
            success: false,
            message: 'Duplicate employee ID(s) found in other users.',
            duplicates: Array.from(foundCodes)
        };
    }

    // Map existing codes for quick lookup
    const existingCodesMap = new Map(
        (existingUser?.codes || []).map(c => [c.code.toLowerCase(), c])
    );

    // Mark all existing codes inactive
    const updatedExistingCodes = (existingUser?.codes || []).map(codeObj => ({
        ...codeObj.toObject ? codeObj.toObject() : codeObj, // convert mongoose doc to plain object if needed
        type: 'inactive',
    }));

    // Add new codes as active only if they don't already exist
    for (const code of normalizedCodes) {
        if (!existingCodesMap.has(code)) {
            updatedExistingCodes.push({
                code,
                issued_on: new Date(),
                type: 'active',
            });
        } else {
            // If code exists, mark it active (override inactive)
            const index = updatedExistingCodes.findIndex(c => c.code.toLowerCase() === code);
            if (index !== -1) {
                updatedExistingCodes[index].type = 'active';
            }
        }
    }

    return {
        success: true,
        codes: updatedExistingCodes
    };
};

// --- updateUserAPI (replace your old function) ---
exports.updateUserAPI = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const currentUser = req.userId;

        const existingUser = await User.findById(userId);
        if (!existingUser) return errorResponse(res, "User not found", 404);

        const existingUserEmail = await User.findOne({
            email_hash: hash(normalizeEmail(req.body.email)),
            company_id: currentUser,
            _id: {
                $ne: userId
            }
        });
        if (existingUserEmail) return errorResponse(res, "This email already been taken!", {}, 400);

        const existingUserPhone = await User.findOne({
            phone_hash: hash(normalizePhone(req.body.phone)),
            company_id: currentUser,
            _id: {
                $ne: userId
            }
        });
        if (existingUserPhone) return errorResponse(res, "This phone already been taken!", {}, 400);

        const imageUrl = req.file?.filename ? `/img/user-profile/${req.file.filename}` : undefined;

        const allowedFields = [
            "first_name", "first_name_search", "last_name", "email", "country_id", "state_id",
            "city_id", "address", "status", "phone", "dob", "website", "floor_id", "apartment_id",
            "pincode", "designation_id", "urn_no", "idfa_code", "department_id", "cameras", 'no_of_members',
            "qnap_username", "qnap_password", "sip_extension", "apartment_data", 'no_of_pets', 'vehicle_data',
            "application_no", "licence_no", "tower_id", "employee_type", "participation_type_id",
            "user_code"
        ];

        const updateData = pick(req.body, allowedFields);

        const apartmentIds = (req.body.apartment_data || [])
            .map(item => item.apartment_id)
            .filter(Boolean); // removes undefined/null/empty

        updateApartmentStatus(apartmentIds, userId)

        // Ensure sip_extension present so Mongoose required doesn't fail (adjust to your schema expectations)
        if (!("sip_extension" in updateData) || updateData.sip_extension === undefined || updateData.sip_extension === null) {
            updateData.sip_extension = ""; // or null depending on schema; choose consistent type
        }

        // Normalize cameras if provided
        if ("cameras" in req.body || Object.keys(req.body).some(k => k.startsWith("cameras["))) {
            updateData.cameras = normalizeCameras(req.body.cameras, req.body)
                .map(c => ({
                    title: typeof c?.title === "string" ? c.title.trim() : "",
                    ip: typeof c?.ip === "string" ? c.ip.trim() : ""
                }))
                .filter(c => c.title || c.ip);
        }

        // Normalize apartment_data if provided
        if ("apartment_data" in req.body || Object.keys(req.body).some(k => k.startsWith("apartment_data["))) {
            updateData.apartment_data = normalizeApartmentData(req.body.apartment_data, req.body);
            updateData.apartment_data = normalizeApartmentRowsShape(updateData.apartment_data);
        }

        // Sanitize ObjectId-like fields (array-aware)
        sanitizeObjectIds(updateData, [
            "floor_id", "apartment_id", "designation_id",
            "department_id", "tower_id", "participation_type_id",
            "country_id", "state_id", "city_id"
        ]);

        // Password update
        if (req.body.password) {
            updateData.password = await bcrypt.hash(req.body.password, 12);
        }

        // Handle employee codes
        if (req.body.user_code !== undefined) {
            const result = await processEmployeeCodesForUser({
                rawCodes: req.body.user_code,
                userId,
                existingUser
            });
            if (result.success) updateData.codes = result.codes;
        }

        // Optional photo
        if (imageUrl) updateData.photo = imageUrl;

        // Roles
        const roles = Array.isArray(req.body.roles) ?
            req.body.roles :
            typeof req.body.roles === "string" && req.body.roles.trim().length ?
                req.body.roles.split(",").map(r => r.trim()) : [];

        await RoleUser.deleteMany({
            user_id: userId
        });
        if (roles.length > 0) {
            const roleUserDocs = roles.map(roleId => ({
                user_id: userId,
                role_id: roleId,
                assigned_by: currentUser
            }));
            await RoleUser.insertMany(roleUserDocs);
        }

        updateData.updated_by = currentUser;

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedUser) return errorResponse(res, "User not found", 400);

        return successResponse(res, `${updatedUser.first_name} account changes saved!`, updatedUser);
    } catch (error) {
        next(error);
    }
};

exports.attachNewUserCodeAPI = async (req, res, next) => {
    try {
        const userId = req.params.id; // assuming user ID is passed in URL
        const existingUser = await User.findById(userId);

        const updateData = {};

        // Handle employee_codes from string
        if (req.body.user_code != undefined) {
            const result = await processEmployeeCodesForUser({
                rawCodes: req.body.user_code,
                userId,
                existingUser
            });

            if (!result.success) {
                return errorResponse(res, result.message, 400);
            } else {
                updateData.codes = result.codes;
            }
        }

        updateData.updated_by = req.userId;
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedUser) {
            return errorResponse(res, "User not found", 400);
        }

        return successResponse(res, "New Employee ID added as Active status.", {
            codes: updatedUser.codes,
            emp_id: updatedUser.emp_id
        });
    } catch (error) {
        next(error);
    }
};

exports.markActiveUserCodeAPI = async (req, res, next) => {
    try {

        const userId = req.params.id;
        const index = parseInt(req.body.index); // Ensure index is an integer

        const existingUser = await User.findById(userId);
        if (!existingUser || !Array.isArray(existingUser.codes)) {
            return errorResponse(res, `User or codes not found`, 400);
        }

        const currentCode = existingUser.codes[index];
        if (!currentCode) {
            return errorResponse(res, `Code at index ${index} not found`, 400);
        }

        // Flip 'type' to 'active'
        existingUser.codes[index].type = 'active';

        existingUser.codes = existingUser.codes.map((code, i) => ({
            ...code,
            type: i === index ? 'active' : 'inactive'
        }));

        await existingUser.save();

        return successResponse(res, `Employee ID changed for ${existingUser.first_name}`, {
            codes: existingUser.codes
        });
    } catch (error) {
        next(error);
    }
};

exports.updateStatusAPI = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return errorResponse(res, `User not found`, 400);
        }

        user.status = req.body.status;
        await user.save();

        return successResponse(res, `${user.first_name} account status marked as ${(user.status ? 'Active' : 'Inactive')} `, {
            current_status: user.status
        });
    } catch (error) {
        next(error);
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

exports.editAPI = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await User.findOne({
            _id: req.params.id,
            user_type: {
                $ne: "4"
            },
            created_by: userId
        }).populate({
            path: 'roles',
            // populate: {
            //   path: 'role_id', // Assuming RoleUser has `role_id`
            //   model: 'roles'
            // }
        });

        if (!user) {
            return errorResponse(res, 'User not found!', 400);
        }
        return successResponse(res, "User loaded", user);
    } catch (error) {
        console.error("Error occurred:", error);
        return errorResponse(res, error, 500);
    }
};

exports.updatePasswordAPI = async (req, res, next) => {
    try {
        const userId = req.params.id; // assuming user ID is passed in URL
        const currentUser = req.userId;

        const updateData = {};
        updateData.updated_by = currentUser;

        // Optional password update
        if (req.body.password) {
            updateData.password = await bcrypt.hash(req.body.password, 12);
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedUser) {
            return errorResponse(res, "User not found", 400);
        }

        return successResponse(res, "Password updated successfully!", updatedUser._id);
    } catch (error) {
        next(error);
    }
}

exports.deleteAPI = async (req, res, next) => {
    try {

        const user_id = req.params.id;

        const user = await User.findOne({
            _id: user_id,
            user_type: {
                $ne: "4"
            }
        });

        await Apartment.findOneAndUpdate({
            assigned_to: user_id
        }, {
            status: false,
            assigned_at: null,
            assigned_to: null
        })

        if (!user) {
            return warningResponse(res, "User not found.", {}, 404);
        }
        await user.deleteOne();
        return successResponse(res, "User deleted successfully!", {}, 200);
    } catch (err) {
        return errorResponse(res, "Failed to delete user", err, 500);
    }
};

exports.searchUserAPI = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await User.findOne({
            email_hash: hash(normalizeEmail('alok@gmail.com'))
        });

        return successResponse(res, "Data loaded", user);
    } catch (error) {
        console.error("Error occurred:", error);
        return errorResponse(res, error, 500);
    }
};

exports.importAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const {
            chunk,
            roles
        } = req.body;
        if (!Array.isArray(chunk)) {
            return errorResponse(res, 'Invalid data format', 400);
        }
        const response = await userService.importUsers(res, userId, chunk, roles);

        return successResponse(res, "Data loaded", response);
    } catch (error) {
        console.error("Error occurred:", error);
        return errorResponse(res, error, 500);
    }
};

exports.getUserStatsAPI = async (req, res, next) => {
    try {
        const userId = req.userId;
        const response = await userService.getUserStats(userId);
        return successResponse(res, "Data loaded", response);
    } catch (error) {
        console.error("Error occurred:", error);
        return errorResponse(res, error, 500);
    }
};