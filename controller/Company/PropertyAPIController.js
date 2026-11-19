const PropertyType = require("../../model/PropertyType")
const PropertyCategory = require("../../model/PropertyCategory")
const PropertyGroup = require("../../model/PropertyGroup")
const Country = require("../../model/Country")
const Property = require("../../model/Property")
const { errorResponse, successResponse } = require('../../util/response')

exports.getPropertyDataAPIController = async (req, res, next) => {
    try {
        const userId = req?.userId;

        if (!userId) {
            return errorResponse(
                res,
                "Unauthorized. User ID is missing.",
                {},
                401
            );
        }

        const propertyType = await PropertyType.find({ created_by: userId })
        const propertyCategory = await PropertyCategory.find({ created_by: userId })
        const propertyGroup = await PropertyGroup.find({ created_by: userId })

        const countries = await Country.find({})
            .select("country_id country_name states")
            .lean();

        const formattedCountries = countries.map((country) => ({
            id: country._id,
            country_id: country._id,
            country_name: country.country_name,
            states: (country.states || []).map((state) => ({
                state_id: state._id,
                state_name: state.state_name,
                country_id: state.country_id,

                cities: (state.cities || []).map((city) => ({
                    city_id: city._id,
                    city_name: city.city_name,
                    state_id: city.state_id,
                })),
            })),
        }));

        const properties = await Property.find({
            created_by: userId,
        })
            .populate("propertyType", "name")
            .populate("category", "name")
            .populate("type", "name")
            .populate("group", "name")
            .populate("country", "country_name states")
            .sort({ createdAt: -1 })
            .lean();


        const formattedProperties = properties.map((property) => {
            const countryName = property.country?.country_name || "";

            const stateData = property.country?.states?.find(
                (state) =>
                    String(state.state_id) === String(property.state)
            );

            const stateName = stateData?.state_name || "";

            const cityData = stateData?.cities?.find(
                (city) =>
                    String(city.city_id) === String(property.city)
            );

            const cityName = cityData?.city_name || "";

            return {
                id: String(property._id),

                name: property.title || "Untitled Property",
                refNo: property.refNo || "",
                status: property.status || "Vacant",

                kind: property.propertyType?.name || "Property",

                category: property.category?.name || "",
                categoryId: property.category?._id
                    ? String(property.category._id)
                    : "",

                group: property.group?.name || "",
                type: property.type?.name || "",

                country: countryName,
                state: stateName,
                city: cityName,

                address: [
                    property.unit,
                    property.building,
                    property.street,
                    property.address,
                    cityName,
                    stateName,
                    countryName,
                ]
                    .filter(Boolean)
                    .filter(
                        (value, index, array) =>
                            array.indexOf(value) === index
                    )
                    .join(", "),

                owner: property.owner || "",
                phone: property.phone || "",

                pricingType: property.pricingType || "rent",
                salePrice: property.salePrice ?? "",

                terms: Array.isArray(property.terms)
                    ? property.terms
                    : [],

                rent:
                    property.pricingType === "rent"
                        ? Number(property.terms?.[0]?.price ?? 0)
                        : 0,

                rentalTerm:
                    property.pricingType === "rent"
                        ? property.terms?.[0]?.name ?? ""
                        : "",

                size: property.size ?? null,
                description: property.description || "",

                files: property.files || {
                    photos: [],
                    videos: [],
                    ownership: [],
                    other: [],
                },

                createdAt: property.createdAt,
                updatedAt: property.updatedAt,
            };
        });

        return successResponse(
            res,
            "Properties fetched successfully",
            {
                count: formattedProperties.length,
                data: formattedProperties,
                country: formattedCountries,
                propertyType,
                propertyCategory,
                propertyGroup,
            }
        );
    } catch (error) {
        next(error);
    }
};

exports.getPropertyEditDataAPIController = async (req, res, next) => {
    try {
        const userId = req?.userId;
        const { id } = req?.params || {};

        if (!userId) {
            return errorResponse(
                res,
                "Unauthorized. User ID is missing.",
                {},
                401
            );
        }

        if (!id) {
            return errorResponse(
                res,
                "Property ID is required.",
                {},
                400
            );
        }

        const property = await Property.findOne({
            _id: id,
            created_by: userId,
        })

        if (!property) {
            return errorResponse(
                res,
                "Property not found.",
                {},
                404
            );
        }

        return successResponse(
            res,
            "Property fetched successfully",
            property
        );
    } catch (error) {
        next(error);
    }
};

exports.getCreateFormAPIController = async (req, res, next) => {
    try {
        const userId = req?.userId;

        const propertyType = await PropertyType.find({ created_by: userId })
        const propertyCategory = await PropertyCategory.find({ created_by: userId })
        const propertyGroup = await PropertyGroup.find({ created_by: userId })
        const country = await Country.find()

        const finalData = {
            propertyType,
            propertyCategory,
            propertyGroup,
            country
        }

        return successResponse(res, "Property form data fetched successfully", finalData)
    } catch (error) {
        next(error)
    }
}

// Parse JSON values received through multipart/form-data
const parseJSON = (value, fallback = null) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value !== "string") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

// Store public-relative file paths instead of absolute server paths
const getFilePaths = (files, fieldName) => {
    return (files?.[fieldName] || []).map((file) => ({
        filename: file.filename,
        path: `/uploads/property/${fieldName}/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
    }));
};

exports.postPropertyAPIController = async (req, res, next) => {
    try {
        const userId = req?.userId;

        if (!userId) {

            return errorResponse(res, "Unauthorized. Please log in first.", {}, 401);
        }

        const {
            propertyType,
            title,
            refNo,
            status,
            category,
            group,
            type,
            size,
            pricingType,
            tax,
            salePrice,
            description,
            template,
            address,
            building,
            street,
            unit,
            floor,
            state,
            city,
            country,
            govRef,
            lat,
            lng,
            owner,
            dial,
            phone,
        } = req.body;

        // Multipart form values such as arrays arrive as JSON strings.
        const terms = parseJSON(req.body.terms, []);

        // Required field validation
        if (!title?.trim()) {

            return errorResponse(res, "Property title is required.", {}, 400);
        }

        if (!Number.isFinite(Number(size)) || Number(size) <= 0) {

            return errorResponse(res, "Please provide a valid property size.", {}, 400);
        }

        if (!propertyType) {

            return errorResponse(res, "Property type is required.", {}, 400);
        }

        if (!country || !state || !city) {

            return errorResponse(res, "Country, state, and city are required.", {}, 400);
        }

        if (!["rent", "sale"].includes(pricingType)) {

            return errorResponse(res, "Please select a valid pricing type.", {}, 400);
        }

        // Pricing validation
        if (pricingType === "rent") {

            if (!Array.isArray(terms) || terms.length === 0) {

                return errorResponse(res, "At least one rental pricing term is required.", {}, 400);
            }

            const invalidTerm = terms.some((term) => !term?.name?.trim() || term.price === "" || term.price === null || term.price === undefined || !Number.isFinite(Number(term.price)) || Number(term.price) < 0);

            if (invalidTerm) {

                return errorResponse(res, "Please provide valid prices for all rental terms.", {}, 400);
            }
        }

        if (
            pricingType === "sale" &&
            (salePrice === "" ||
                salePrice === null ||
                salePrice === undefined ||
                !Number.isFinite(Number(salePrice)) ||
                Number(salePrice) < 0)
        ) {
            return errorResponse(
                res,
                "Please provide a valid sale price.",
                {},
                400
            );
        }

        const newProperty = await Property.create({
            created_by: userId,
            propertyType,
            title: title.trim(),
            refNo,
            status,
            category,
            group,
            type,
            size: Number(size),
            pricingType,
            tax,
            salePrice: pricingType === "sale" ? String(salePrice) : "",
            terms: pricingType === "rent" ? terms.map((term) => ({
                name: term.name.trim(),
                price: Number(term.price),
            })) : [],
            description,
            template,
            address,
            building,
            street,
            unit,
            floor,
            country,
            state,
            city,
            govRef,
            lat: lat === "" || lat == null ? "" : String(lat),
            lng: lng === "" || lng == null ? "" : String(lng),
            owner,
            dial,
            phone,
            files: {
                photos: getFilePaths(req.files, "photos"),
                videos: getFilePaths(req.files, "videos"),
                ownership: getFilePaths(req.files, "ownership"),
                other: getFilePaths(req.files, "other"),
            },
        });


        return successResponse(
            res,
            "Property created successfully.",
            newProperty
        );
    } catch (error) {
        next(error);
    }
};


exports.putPropertyAPIController = async (req, res, next) => {
    try {
        const userId = req?.userId;
        const { id } = req?.params || {};

        if (!userId) {
            return errorResponse(
                res,
                "Unauthorized. Please log in first.",
                {},
                401
            );
        }

        if (!id) {
            return errorResponse(
                res,
                "Property ID is required.",
                {},
                400
            );
        }

        // Only update a property owned by the authenticated user.
        const existingProperty = await Property.findOne({
            _id: id,
            created_by: userId,
        });

        if (!existingProperty) {
            return errorResponse(
                res,
                "Property not found.",
                {},
                404
            );
        }

        const {
            propertyType,
            title,
            refNo,
            status,
            category,
            group,
            type,
            size,
            pricingType,
            tax,
            salePrice,
            description,
            template,
            address,
            building,
            street,
            unit,
            floor,
            state,
            city,
            country,
            govRef,
            lat,
            lng,
            owner,
            dial,
            phone,
        } = req.body;

        const terms = parseJSON(req.body.terms, []);

        // Validate required fields.
        if (!title?.trim()) {
            return errorResponse(
                res,
                "Property title is required.",
                {},
                400
            );
        }

        if (
            size === "" ||
            size === undefined ||
            size === null ||
            !Number.isFinite(Number(size)) ||
            Number(size) <= 0
        ) {
            return errorResponse(
                res,
                "Please provide a valid property size.",
                {},
                400
            );
        }

        if (!propertyType) {
            return errorResponse(
                res,
                "Property type is required.",
                {},
                400
            );
        }

        if (!country || !state || !city) {
            return errorResponse(
                res,
                "Country, state, and city are required.",
                {},
                400
            );
        }

        if (!["rent", "sale"].includes(pricingType)) {
            return errorResponse(
                res,
                "Please select a valid pricing type.",
                {},
                400
            );
        }

        if (pricingType === "rent") {
            if (!Array.isArray(terms) || terms.length === 0) {
                return errorResponse(
                    res,
                    "At least one rental pricing term is required.",
                    {},
                    400
                );
            }

            const invalidTerm = terms.some(
                (term) =>
                    !term?.name?.trim() ||
                    term.price === "" ||
                    term.price === null ||
                    term.price === undefined ||
                    !Number.isFinite(Number(term.price)) ||
                    Number(term.price) < 0
            );

            if (invalidTerm) {
                return errorResponse(
                    res,
                    "Please provide valid prices for all rental terms.",
                    {},
                    400
                );
            }
        }

        if (
            pricingType === "sale" &&
            (
                salePrice === "" ||
                salePrice === null ||
                salePrice === undefined ||
                !Number.isFinite(Number(salePrice)) ||
                Number(salePrice) < 0
            )
        ) {
            return errorResponse(
                res,
                "Please provide a valid sale price.",
                {},
                400
            );
        }

        // Preserve existing files unless new files are uploaded.
        const oldFiles = existingProperty.files?.toObject
            ? existingProperty.files.toObject()
            : existingProperty.files || {};

        const fileFields = [
            "photos",
            "videos",
            "ownership",
            "other",
        ];

        const updatedFiles = {};

        for (const field of fileFields) {
            const newFiles = getFilePaths(req.files, field);
            const previousFiles = oldFiles[field] || [];

            updatedFiles[field] = newFiles.length
                ? [...previousFiles, ...newFiles]
                : previousFiles;
        }

        const updateData = {
            propertyType,
            title: title.trim(),
            refNo,
            status,
            category,
            group,
            type,
            size: Number(size),
            pricingType,
            tax,
            salePrice:
                pricingType === "sale" ? String(salePrice) : "",
            terms:
                pricingType === "rent"
                    ? terms.map((term) => ({
                        name: term.name.trim(),
                        price: Number(term.price),
                    }))
                    : [],
            description,
            template,
            address,
            building,
            street,
            unit,
            floor,
            country,
            state,
            city,
            govRef,
            lat: lat === "" || lat == null ? "" : String(lat),
            lng: lng === "" || lng == null ? "" : String(lng),
            owner,
            dial,
            phone,
            files: updatedFiles,
        };

        // Actually update the document.
        const updatedProperty = await Property.findOneAndUpdate(
            {
                _id: id,
                created_by: userId,
            },
            { $set: updateData },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedProperty) {
            return errorResponse(
                res,
                "Property not found or could not be updated.",
                {},
                404
            );
        }

        return successResponse(
            res,
            "Property updated successfully.",
            updatedProperty
        );
    } catch (error) {
        next(error);
    }
};
