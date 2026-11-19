const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Invoice = require("../../model/Invoice");
const Contact = require("../../model/Contact");
const Property = require("../../model/Property");
const { successResponse } = require("../../util/response");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* ---------------------------------------------------------------- */
/* Errors                                                            */
/* ---------------------------------------------------------------- */

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const badRequest = (message) => new HttpError(400, message);
const notFound = (message) => new HttpError(404, message);

const removeFromDisk = (url) => {
    if (!url) return;
    // Files are stored under /public (see createUpload folder argument).
    fs.unlink(path.join(process.cwd(), "public", url), () => { });
};

const handleError = (req, res, next, error) => {
    // Do not leave orphaned uploads behind when the request failed.
    if (Array.isArray(req.files)) {
        req.files.forEach((file) =>
            removeFromDisk(`/invoices/${file.filename}`)
        );
    }

    if (error instanceof HttpError) {
        return res
            .status(error.status)
            .json({ success: false, message: error.message });
    }

    if (error?.name === "ValidationError") {
        return res
            .status(400)
            .json({ success: false, message: error.message });
    }

    if (error?.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "Duplicate invoice number. Please try again.",
        });
    }

    return next(error);
};

/* ---------------------------------------------------------------- */
/* Helpers                                                           */
/* ---------------------------------------------------------------- */

// JSON requests arrive as req.body; multipart requests carry the same
// JSON in a single "payload" field next to the uploaded files.
const parseBody = (req) => {
    const raw = req.body?.payload;

    if (typeof raw === "string") {
        try {
            return JSON.parse(raw);
        } catch {
            throw badRequest("Invalid request payload.");
        }
    }

    return req.body ?? {};
};

const toFileDocs = (files = []) =>
    files.map((file) => ({
        name: file.originalname,
        url: `/invoices/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
    }));

const getNextSequence = async (userId) => {
    const last = await Invoice.findOne({ createdBy: userId })
        .sort({ sequence: -1 })
        .select("sequence")
        .lean();

    return (last?.sequence ?? 0) + 1;
};

// Status is Active (true) or Inactive (false). Defaults to Active.
const parseStatus = (value) => {
    if (value === undefined || value === null || value === "") return true;
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;

    throw badRequest("Invalid invoice status.");
};

const normalizeItems = (items) =>
    items.map((raw, index) => {
        const label = `Line item ${index + 1}`;

        const amount = Number(raw?.amount);
        const taxRate = Number(raw?.taxRate ?? 0);
        const chartOfAccount = String(raw?.chartOfAccount ?? "").trim();

        if (!Number.isFinite(amount) || amount <= 0) {
            throw badRequest(`${label}: amount must be greater than 0.`);
        }

        if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
            throw badRequest(`${label}: tax rate must be between 0 and 100.`);
        }

        if (!chartOfAccount) {
            throw badRequest(`${label}: revenue account is required.`);
        }

        const taxAmount = Number(((amount * taxRate) / 100).toFixed(2));

        // Whitelist fields: never spread client input into the document.
        return {
            category: String(raw?.category ?? "Property Rent").trim(),
            property: String(raw?.property ?? "").trim(),
            item: String(raw?.item ?? "").trim(),
            chartOfAccount,
            amount,
            taxRate,
            taxAmount,
            total: Number((amount + taxAmount).toFixed(2)),
        };
    });

const calculateTotals = (items) => {
    const sub = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = items.reduce((sum, item) => sum + item.taxAmount, 0);

    return {
        sub: Number(sub.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        total: Number((sub + tax).toFixed(2)),
    };
};

const buildInvoicePayload = async (body, userId) => {
    const {
        billedTo,
        invoiceDate,
        dueDate,
        reference,
        remarks,
        items,
        status,
    } = body;

    if (!billedTo || !isValidId(billedTo)) {
        throw badRequest("Please select a valid billing contact.");
    }

    if (!invoiceDate || !dueDate) {
        throw badRequest("Invoice date and due date are required.");
    }

    const parsedInvoiceDate = new Date(invoiceDate);
    const parsedDueDate = new Date(dueDate);

    if (
        Number.isNaN(parsedInvoiceDate.getTime()) ||
        Number.isNaN(parsedDueDate.getTime())
    ) {
        throw badRequest("Invalid invoice date or due date.");
    }

    if (parsedDueDate < parsedInvoiceDate) {
        throw badRequest("Due date cannot be before the invoice date.");
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw badRequest("Add at least one invoice line item.");
    }

    const contact = await Contact.findOne({
        _id: billedTo,
        created_by: userId,
    }).lean();

    if (!contact) {
        throw notFound("The selected contact was not found.");
    }

    const normalizedItems = normalizeItems(items);

    // Every referenced property must exist and belong to this user.
    const propertyIds = [
        ...new Set(
            normalizedItems.map((item) => item.property).filter(Boolean)
        ),
    ];

    if (propertyIds.some((id) => !isValidId(id))) {
        throw badRequest("Invalid property selected.");
    }

    if (propertyIds.length) {
        const found = await Property.countDocuments({
            _id: { $in: propertyIds },
            created_by: userId,
        });

        if (found !== propertyIds.length) {
            throw badRequest("One or more selected properties were not found.");
        }
    }

    return {
        billedTo,
        billedToName:
            contact.full_name ||
            contact.company_name ||
            contact.name ||
            "Unknown contact",
        invoiceDate: parsedInvoiceDate,
        dueDate: parsedDueDate,
        reference: String(reference ?? "").trim(),
        remarks: String(remarks ?? "").trim(),
        items: normalizedItems,
        totals: calculateTotals(normalizedItems),
        status: parseStatus(status),
    };
};

/* ---------------------------------------------------------------- */
/* Controllers                                                       */
/* ---------------------------------------------------------------- */

// GET /invoice/get/data
exports.getInvoiceData = async (req, res, next) => {
    try {
        const invoices = await Invoice.find({ createdBy: req.userId })
            .populate("billedTo", "full_name company_name name")
            .sort({ createdAt: -1 })
            .lean();

        return successResponse(res, "Invoices fetched successfully", invoices);
    } catch (error) {
        return handleError(req, res, next, error);
    }
};

// GET /invoice/create/data
exports.getInvoiceCreateData = async (req, res, next) => {
    try {
        const userId = req.userId;

        const [contact, property, nextSequence] = await Promise.all([
            Contact.find({ created_by: userId }).sort({ full_name: 1 }).lean(),
            Property.find({ created_by: userId }).lean(),
            getNextSequence(userId),
        ]);

        return successResponse(
            res,
            "Invoice create data fetched successfully",
            { contact, property, nextSequence }
        );
    } catch (error) {
        return handleError(req, res, next, error);
    }
};

// GET /invoice/edit/data/:id
exports.getInvoiceEditData = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) throw badRequest("Invalid invoice ID.");

        const invoice = await Invoice.findOne({
            _id: id,
            createdBy: req.userId,
        })
            .populate("billedTo", "full_name company_name name")
            .lean();

        if (!invoice) throw notFound("Invoice not found.");

        return successResponse(
            res,
            "Invoice edit data fetched successfully",
            invoice
        );
    } catch (error) {
        return handleError(req, res, next, error);
    }
};

// POST /invoice/save/data
exports.postInvoiceAPIController = async (req, res, next) => {
    try {
        const userId = req.userId;
        const body = parseBody(req);

        const payload = await buildInvoicePayload(body, userId);
        const files = toFileDocs(req.files);

        // The server owns the sequence. If two requests race, the unique
        // (createdBy, sequence) index rejects one and we retry.
        let invoice;

        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                invoice = await Invoice.create({
                    ...payload,
                    sequence: await getNextSequence(userId),
                    files,
                    createdBy: userId,
                    updatedBy: userId,
                });
                break;
            } catch (error) {
                if (error?.code === 11000 && attempt < 2) continue;
                throw error;
            }
        }

        return successResponse(res, "Invoice saved successfully", invoice);
    } catch (error) {
        return handleError(req, res, next, error);
    }
};

// POST /invoice/update/data/:id
exports.updateInvoiceAPIController = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        if (!isValidId(id)) throw badRequest("Invalid invoice ID.");

        const body = parseBody(req);

        // Load the document (instead of findOneAndUpdate) so the pre-save
        // hook runs: invoiceNumber, ref, totals and amountPaid stay correct.
        const invoice = await Invoice.findOne({ _id: id, createdBy: userId });

        if (!invoice) throw notFound("Invoice not found.");

        const payload = await buildInvoicePayload(body, userId);

        // Files: drop the ones the user removed, then append new uploads.
        const removedIds = new Set(
            (Array.isArray(body.removedFileIds) ? body.removedFileIds : []).map(
                String
            )
        );

        const removedFiles = invoice.files.filter((file) =>
            removedIds.has(String(file._id))
        );

        invoice.files = invoice.files.filter(
            (file) => !removedIds.has(String(file._id))
        );
        invoice.files.push(...toFileDocs(req.files));

        // sequence is intentionally not updatable.
        invoice.set(payload);
        invoice.updatedBy = userId;

        await invoice.save();

        removedFiles.forEach((file) => removeFromDisk(file.url));

        await invoice.populate("billedTo", "full_name company_name name");

        return successResponse(res, "Invoice updated successfully", invoice);
    } catch (error) {
        return handleError(req, res, next, error);
    }
};

// POST /invoice/delete/data/:id
exports.deleteInvoiceAPIController = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) throw badRequest("Invalid invoice ID.");

        const invoice = await Invoice.findOne({
            _id: id,
            createdBy: req.userId,
        });

        if (!invoice) throw notFound("Invoice not found.");

        if (invoice.amountPaid > 0) {
            throw badRequest("An invoice with recorded payments cannot be deleted.");
        }

        const files = [...invoice.files];

        await invoice.deleteOne();

        files.forEach((file) => removeFromDisk(file.url));

        return successResponse(res, "Invoice deleted successfully", { _id: id });
    } catch (error) {
        return handleError(req, res, next, error);
    }
};