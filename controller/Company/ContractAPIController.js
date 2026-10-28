const Contract = require("../../model/Contract")
const Contact = require("../../model/Contact")
const Property = require("../../model/Property")
const Amenity = require("../../model/Amenities")
const ContractDocumentType = require("../../model/ContractDocumentType")
const { successResponse } = require("../../util/response")

const num = (v) => Number(v) || 0;
const fail = (status, message) => Object.assign(new Error(message), { status });
const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };

const TAX = { none: 0, gst5: 5, gst12: 12, gst18: 18 };

const cleanDetail = (d) => ({
    id: String(d.id),
    type: d.type,
    description: d.description,
    start: d.start,
    end: d.end,
    rentalValue: num(d.rentalValue),
    payments: Math.max(num(d.payments), 1),
    discountPct: d.discountPct === "" || d.discountPct == null ? null : num(d.discountPct),
    discountValue: num(d.discountValue),
    tax: d.tax || "none",
    amenityId: d.amenityId || null,
    freeSlots: num(d.freeSlots),
    extraSlotPrice: num(d.extraSlotPrice),
    monthlyFee: num(d.monthlyFee),
});

// Recalculate value / start / end from the details
const recalc = (c) => {
    c.value = c.details.reduce((sum, d) => {
        const after = Math.max(d.rentalValue - d.discountValue, 0);
        return sum + after + Math.round((after * (TAX[d.tax] || 0)) / 100);
    }, 0);
    const starts = c.details.map((d) => d.start).sort();
    const ends = c.details.map((d) => d.end).sort();
    c.start = starts[0];
    c.end = ends[ends.length - 1];
};

// Keep amenities[] in step with the amenity detail lines
const syncAmenities = (c) => {
    c.amenities = c.amenities.map((a) => {
        const line = c.details.find((d) => String(d.amenityId) === String(a.amenity));
        return line ? { amenity: a.amenity, freeSlots: line.freeSlots, monthlyFee: line.monthlyFee } : a;
    });
};

// Only your own draft contracts can be edited
const getEditable = async (req) => {
    const c = await Contract.findOne({ id: Number(req.params.id), created_by: req.userId });
    if (!c) throw fail(404, "Contract not found");
    if (c.status !== "Draft") throw fail(409, "Only draft contracts can be edited");
    return c;
};

const done = (res, c) => res.json({ success: true, data: c });

const toContract = (body) => ({
    kind: body.kind,
    status: body.status,
    tenant: body.tenant?._id,
    properties: (body.properties || []).map((p) => p._id),
    amenities: (body.amenities || []).map((a) => ({
        amenity: a._id,
        freeSlots: a.freeSlots,
        monthlyFee: body.details?.find((d) => d.amenityId === a._id)?.monthlyFee || 0,
    })),
    details: body.details,
    documents: (body.documents || []).map(({ id, type, name, size }) => ({ id, type, name, size })),
    value: body.value,
    start: body.start,
    end: body.end,
});

exports.getContractData = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const contract = await Contract.find({
            created_by: userId
        })

        return successResponse(res, "Contract fetched successfully", contract)

    } catch (error) {
        next(error)
    }
}

exports.getContractCreateData = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const tenant = [];

        const property = await Property.find({
            created_by: userId
        })

        const amenity = await Amenity.find({
            created_by: userId
        })

        const contact = await Contact.find({
            created_by: userId
        })

        const contractDocumentType = await ContractDocumentType.find({
            created_by: userId
        })

        const finalData = {
            amenity,
            contact,
            contractDocumentType,
            property,
            tenant
        }

        return successResponse(res, "Contract create fetched successfully", finalData)

    } catch (error) {
        next(error)
    }
}

exports.postCreateAPIController = wrap(async (req, res) => {
    const userId = req?.userId
    const c = await Contract.create({
        kind: req.body.kind || "org-tenant",
        status: "Draft",
        created_by: userId
    });
    done(res, c);
});

exports.getContractOneAPI = wrap(async (req, res) => {
    const c = await Contract.findOne({ id: Number(req.params.id), created_by: req.userId })
        .populate("tenant properties amenities.amenity");
    if (!c) throw fail(404, "Contract not found");
    done(res, c);
});

exports.setContractTenantAPIController = wrap(async (req, res) => {
    const c = await getEditable(req);
    c.tenant = req.body.tenant;
    await c.save();
    done(res, c);
});

// body: { properties: [ids], details: [all details, incl. the auto rent line] }
exports.setContractPropertyAPIController = wrap(async (req, res) => {
    const c = await getEditable(req);
    c.properties = req.body.properties || [];
    if (req.body.details) c.details = req.body.details.map(cleanDetail);
    recalc(c);
    await c.save();
    done(res, c);
});

// body: { amenities: [{ _id, freeSlots }], details: [...] }
exports.setContractAmenityAPIController = wrap(async (req, res) => {
    const c = await getEditable(req);
    if (req.body.details) c.details = req.body.details.map(cleanDetail);
    c.amenities = (req.body.amenities || []).map((a) => ({
        amenity: a._id,
        freeSlots: num(a.freeSlots),
        monthlyFee: num(c.details.find((d) => String(d.amenityId) === String(a._id))?.monthlyFee),
    }));
    recalc(c);
    await c.save();
    done(res, c);
});

// body: { detail }
exports.upsertContractDetailAPIController = wrap(async (req, res) => {
    const c = await getEditable(req);
    const d = cleanDetail(req.body.detail);
    const i = c.details.findIndex((x) => x.id === d.id);
    if (i >= 0) c.details[i] = d; else c.details.push(d);

    // a new amenity line also adds the amenity to amenities[]
    if (d.type === "Amenity" && d.amenityId && !c.amenities.some((a) => String(a.amenity) === String(d.amenityId))) {
        c.amenities.push({ amenity: d.amenityId, freeSlots: d.freeSlots, monthlyFee: d.monthlyFee });
    }
    syncAmenities(c);
    recalc(c);
    await c.save();
    done(res, c);
});

// body: { detailId }
exports.deleteContractDetailAPIController = wrap(async (req, res) => {
    const c = await getEditable(req);
    const line = c.details.find((d) => d.id === String(req.body.detailId));
    c.details = c.details.filter((d) => d.id !== String(req.body.detailId));
    if (line?.amenityId) c.amenities = c.amenities.filter((a) => String(a.amenity) !== String(line.amenityId));
    recalc(c);
    await c.save();
    done(res, c);
});

// multipart: files[] + type
exports.addContractDocumentAPIController = wrap(async (req, res) => {
    const c = await getEditable(req);
    (req.files || []).forEach((f, i) => c.documents.push({
        id: `${Date.now()}-${i}`,
        type: req.body.type,
        name: f.originalname,
        size: f.size,
        url: f.relativePath,
    }));
    await c.save();
    done(res, c);
});

// body: { documentId }
exports.deleteContractDocumentAPIController = wrap(async (req, res) => {
    const c = await getEditable(req);
    c.documents = c.documents.filter((d) => d.id !== req.body.documentId);
    await c.save();
    done(res, c);
});

// "Save Contract": writes everything in one go
exports.saveContractAPIController = wrap(async (req, res) => {
    const c = await getEditable(req);
    const b = req.body;
    if (b.tenant !== undefined) c.tenant = b.tenant || undefined;
    if (b.properties) c.properties = b.properties;
    if (b.details) c.details = b.details.map(cleanDetail);
    if (b.amenities) {
        c.amenities = b.amenities.map((a) => ({
            amenity: a._id,
            freeSlots: num(a.freeSlots),
            monthlyFee: num(c.details.find((d) => String(d.amenityId) === String(a._id))?.monthlyFee),
        }));
    }
    recalc(c);
    await c.save();
    done(res, c);
});

// "Submit for Approval"
exports.submitContractAPIController = wrap(async (req, res) => {
    const c = await getEditable(req);
    if (!c.tenant) throw fail(400, "Add a tenant before submitting.");
    if (!c.properties.length) throw fail(400, "Add at least one property before submitting.");
    if (!c.details.length) throw fail(400, "Add at least one detail line before submitting.");
    c.status = "Pending";
    await c.save();
    done(res, c);
});

exports.removeContractAPIController = wrap(async (req, res) => {
    const c = await getEditable(req);
    await c.deleteOne();
    res.json({ success: true });
});