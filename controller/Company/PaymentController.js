const Bill = require('../../model/Bill')
const Payment = require('../../model/Payment');
const { successResponse } = require('../../util/response');

exports.getPaymentController = async (req, res, next) => {
    try {

    } catch (error) {
        next(error)
    }
}

exports.postPaymentController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const { bank_name, amount, status, billId, payment_mode, paid_remark, cheque_no, cheque_date, demand_draft_no, demand_draft_date, neft_no, neft_date } = req.body

        const bill = await Bill.findById(billId);

        const payment = new Payment({
            bank_name,
            created_by: userId,
            amount,
            bill_id: billId,
            cheque_no,
            payment_mode,
            cheque_date,
            demand_draft_no,
            paid_remark,
            demand_draft_date,
            neft_no,
            neft_date,
            status
        })

        await payment.save();

        if (bill) {
            const totalAmount = bill?.bill_amount;
            const payments = await Payment.find({ bill_id: billId })
            const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
            const paid = Number(totalAmount) === Number(paidAmount);
            await Bill.findByIdAndUpdate(billId, {
                status: paid
            })
        }

        return successResponse(res, "Payment saved successfull")

    } catch (error) {
        next(error)
    }
}