const mongoose = require("mongoose");
const Payment = require("../../model/Payment");
const Contract = require("../../model/Contract")
const { successResponse, errorResponse } = require("../../util/response")

const METHODS = ["Cash", "Cheque", "Bank Transfer", "UPI", "Card"];

exports.getPaymentData = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const payment = await Payment.find({
            created_by: userId
        }).populate({
            path: "contract_id",
            populate: {
                path: "tenant"
            }
        });

        return successResponse(res, "Payment fetched successfully", payment)

    } catch (error) {
        next(error)
    }
}

exports.getPaymentCreateAPI = async (req, res, next) => {
    try {

        const userId = req?.userId

        const contract = await Contract.find({
            status: "Approved",
            created_by: userId,
        }).populate("tenant").populate("payment")

        const finalData = {
            contract,
        }

        return successResponse(res, "Payment create data fetched successfully", finalData)

    } catch (error) {
        next(error)
    }
}

exports.getPaymentEditAPI = async (req, res, next) => {
    try {

        const userId = req?.userId;
        const { id } = req?.params;

        const payment = await Payment.findOne({
            created_by: userId,
            _id: id
        }).populate({
            path: "contract_id",
            populate: {
                path: "tenant"
            }
        })

        return successResponse(res, "Payment data fetched successfully", payment)

    } catch (error) {
        next(error)
    }
}

exports.savePaymentAPIController = async (req, res) => {
    try {

        const userId = req?.userId;

        const {
            contract_id,
            total_payment_amount,
            payment_date,
            payment_method,
            ref_no,
            remark
        } = req.body;

        if (!mongoose.isValidObjectId(contract_id)) {

            return errorResponse(res, "Please select a valid contract.", {}, 400)
        }

        const amount = Number(total_payment_amount);

        if (!Number.isFinite(amount) || amount <= 0) {

            return errorResponse(res, "Enter a valid payment amount.", {}, 400)
        }

        if (!payment_date || Number.isNaN(new Date(payment_date).getTime())) {

            return errorResponse(res, "Payment date is required.", {}, 400)
        }

        if (!METHODS.includes(payment_method)) {

            return errorResponse(res, "Please select a payment method.", {}, 400)
        }


        const contract = await Contract.findById(contract_id).select("value");

        if (!contract) {

            return errorResponse(res, "Contract not found.", {}, 404)
        }

        const limit = Number(contract.value);

        if (!Number.isFinite(limit)) {

            return errorResponse(res, "The selected contract has no valid amount.", {}, 400)
        }

        const [{ paid = 0 } = {}] = await Payment.aggregate([
            { $match: { contract_id: contract._id } },
            { $group: { _id: null, paid: { $sum: "$total_payment_amount" } } }
        ]);

        const balance = limit - paid;

        if (amount > balance) {

            return errorResponse(res, `Payment cannot exceed the remaining balance of ${balance.toLocaleString("en-IN")}.`, {}, 400)
        }

        const status = paid + amount >= limit ? "Paid" : "Partial Paid";

        const payment = await Payment.create({
            contract_id: contract._id,
            total_payment_amount: amount,
            payment_date: new Date(payment_date),
            payment_method,
            ref_no,
            remark,
            documents: (req.files || []).map((file) => file.path),
            status,
            created_by: userId
        });

        return successResponse(res, "Payment saved.", payment, 201)
    } catch (error) {
        console.error("savePaymentAPIController:", error);
        return res.status(500).json({ success: false, message: "Unable to save payment." });
    }
};
