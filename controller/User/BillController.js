const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const {
    toWords
} = require("number-to-words");

const UserBill = require("../../model/UserBill");
const Bill = require("../../model/Bill");
const User = require("../../model/User");
const Maintenance = require("../../model/Maintenance");
const {
    successResponse,
    errorResponse
} = require("../../util/response");

exports.getBillController = async (req, res, next) => {
    try {
        const statusField = req.params.status || false;
        let data = [];

        const userId = req.userId;
        const type = req.params.type;

        const user = await User.findById(userId);
        const masterId = user?.created_by;

        if (type === "common-area-bill") {

            const bills = await Bill.find({
                    status: statusField,
                    bill_data_type: type,
                    created_by: masterId,
                })
                .populate("apartment_id")
                .populate("bill_type")
                .populate({
                    path: "payments",
                    model: "Payment",
                });

            const pendingBill = await Bill.find({
                status: false,
                bill_data_type: type,
                created_by: masterId,
            });

            const pendingBillCount = pendingBill.length;

            data = {
                bills,
                count: pendingBillCount
            };

        } else if (type === "maintenance") {

            let datas = {};

            const bills = await Bill.find({
                bill_data_type: type,
                created_by: masterId,
            }).select("_id");

            const billsId = bills.map((b) => b._id.toString());

            const userBill = await UserBill.find({
                    user_id: userId,
                    bill_id: {
                        $in: billsId
                    },
                })
                .populate("bill_id")
                .populate("apartment_id")
                .populate("user_id")
                .populate("payments");

            let maintenance = await Maintenance.findOne({
                status: true,
                created_by: masterId,
            });

            if (!maintenance) {
                maintenance = await Maintenance.findOne({
                    status: true,
                    created_by: masterId,
                });
            }

            const fixedCost = maintenance?.fixed_data.length > 0 ? maintenance?.fixed_data : maintenance?.unit_type || [];

            if (!userBill) {
                return errorResponse(res, "User bill does not exist", {}, 404);
            }

            datas["userBill"] = userBill;
            datas["fixed_cost"] = fixedCost;

            data = datas;

        } else {

            const bills = await Bill.find({
                    created_by: masterId,
                    status: statusField,
                    bill_data_type: type,
                })
                .populate({
                    path: 'apartment_id',
                    select: 'apartment_no tower_id floor_id apartment_area assigned_to',
                    populate: [{
                            path: 'assigned_to'
                        },
                        {
                            path: 'tower_id',
                            select: 'name'
                        }, // Tower fields
                        {
                            path: 'floor_id',
                            select: 'floor_name'
                        } // Floor fields
                    ]
                })
                .populate("bill_type")
                .populate({
                    path: "payments",
                    model: "Payment",
                });

            const pendingBill = await Bill.find({
                status: false,
                bill_data_type: type,
                created_by: masterId,
            });

            const pendingBillCount = pendingBill.length;

            data = {
                bills,
                count: pendingBillCount
            }

        }

        return successResponse(res, "Bill fetched successfully", data);
    } catch (error) {
        next(error);
    }
};

// ========== PDF DOWNLOAD CONTROLLER ==========

exports.downloadInvoicePDF = async (req, res, next) => {
    try {
        const invoiceNo = req.params?.invoiceNo;
        if (!invoiceNo)
            return errorResponse(res, "Invoice number is required", {}, 400);

        const bill = await Bill.findOne({
                invoice_no: invoiceNo
            })
            .populate({
                path: "apartment_id",
                select: "apartment_no apartment_area assigned_to",
                populate: {
                    path: "assigned_to"
                },
            })
            .populate("bill_type")
            .populate("payments");

        if (!bill) return errorResponse(res, "Bill does not exist", {}, 404);

        // ==== PATH SETUP ====
        const baseDir = path.resolve(__dirname, "../../");
        const invoicesDir = path.join(baseDir, "public/invoices");
        if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, {
            recursive: true
        });

        const filePath = path.join(invoicesDir, `invoice_${invoiceNo}.pdf`);
        const doc = new PDFDocument({
            margin: 50,
            size: "A4"
        });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // ==== LOGO FETCH ====
        let logoHeight = 0;
        try {
            const response = await axios.get("https://society.learningink.com/images/company_logo.png", {
                responseType: "arraybuffer",
            });
            const logoBuffer = Buffer.from(response.data, "binary");
            doc.image(logoBuffer, 60, 45, {
                width: 110
            });
            logoHeight = 120;
        } catch (e) {
            console.warn("Logo fetch failed:", e.message);
            logoHeight = 80;
        }

        // ==== ADDRESS (left under logo) ====
        const addressY = logoHeight + 10;
        doc.fontSize(10).fillColor("#333")
            .text("Zoo Deoria By Pass,", 60, addressY)
            .text("Paalm Paradise, near Gorakhpur,", 60)
            .text("Uttar Pradesh 273016", 60);

        // ==== INVOICE INFO BOX ====
        const boxX = 330;
        const boxY = 45;
        doc.save();
        doc.roundedRect(boxX, boxY, 220, 90, 6).fill("#f5f5f5").stroke();
        doc.restore();
        doc.fillColor("#000")
            .fontSize(12)
            .text(`Invoice #${bill.invoice_no}`, boxX + 10, boxY + 12)
            .fontSize(10)
            .text(`Date Issued: ${new Date(bill.bill_date).toLocaleDateString("en-GB")}`, boxX + 10, boxY + 40)
            .text(`Date Due: ${new Date(bill.bill_due_date).toLocaleDateString("en-GB")}`, boxX + 10, boxY + 58);

        // ==== TITLE ====
        doc.fontSize(18).fillColor("#000").text("Invoice", 0, 155, {
            align: "center"
        });

        // ==== BILL INFO ====
        const user = bill.apartment_id?.assigned_to || {};
        const leftX = 60;
        const rightX = 330;
        const topY = 190;

        doc.fontSize(12).fillColor("#000").text("Bill From:", leftX, topY);
        doc.fontSize(12).text("Bill To:", rightX, topY);

        // Bill From
        doc.fontSize(10).fillColor("#444")
            .text("Paalm Paradise", leftX, topY + 20)
            .text("Talramgarh, Deoria Bypass Road", leftX)
            .text("Gorakhpur, Uttar Pradesh 273016", leftX)
            .text("+91 9513369620", leftX);

        // Bill To
        doc.text(`${user.first_name || ""} ${user.last_name || ""}`, rightX, topY + 20)
            .text(user.email || "", rightX)
            .text(user.phone || "", rightX)
            .text(`${user.address || `F-${bill.apartment_id?.apartment_no || ""}, Paalm Paradise`} ${user.pincode || "273016"}`, rightX);

        // ==== TABLE ====
        const startY = 300;
        const tableWidth = 480;
        const col = {
            sno: 75,
            qty: 150,
            product: 250,
            amount: 510,
        };

        // Header Row
        doc.rect(leftX, startY, tableWidth, 25).fill("#f4f4f4").stroke();
        doc.fillColor("#000").font("Helvetica-Bold").fontSize(10)
            .text("S.No", col.sno, startY + 7)
            .text("Quantity", col.qty, startY + 7)
            .text("Product", col.product, startY + 7)
            .text("Amount", col.amount - 10, startY + 7, {
                align: "right"
            });

        // Data Rows
        let y = startY + 30;
        let total = 0;
        const formatINR = (n) => n.toLocaleString("en-IN");

            
        bill.payments.forEach((p, i) => {
            total += p.amount;
            doc.font("Helvetica").fontSize(10).fillColor("#000");
            doc.text(i + 1, col.sno, y);
            doc.text("1", col.qty, y);
            doc.text(p.description || bill.bill_type?.name || "Utility Bill", col.product, y);
            doc.text(`₹${formatINR(p.amount)}`, col.amount - 10, y, {
                align: "right"
            });
            y += 25;
        });

        // Bottom Line
        doc.moveTo(leftX, y).lineTo(leftX + tableWidth, y).stroke();

        // ==== TOTAL ====
        doc.font("Helvetica-Bold").fontSize(11)
            .text("Total:", col.product, y + 10)
            .text(`₹${formatINR(total)}`, col.amount - 10, y + 10, {
                align: "right"
            });

        // ==== AMOUNT IN WORDS ====
        const words = toWords(total).toUpperCase();
        doc.font("Helvetica").fontSize(10).fillColor("#333")
            .text(`Total Amount In Words: INR ${words} ONLY`, leftX, y + 50, {
                width: tableWidth
            });

        // ==== FOOTER ====
        doc.fontSize(9).fillColor("#777")
            .text("Thank you for your payment!", 0, doc.page.height - 60, {
                align: "center"
            });

        doc.end();

        // ==== SEND FILE ====
        stream.on("finish", () => {
            res.download(filePath, `Invoice_${invoiceNo}.pdf`, (err) => {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
                });
                if (err) {
                    console.error("File download error:", err);
                    next(err);
                }
            });
        });

    } catch (error) {
        console.error("Error generating invoice:", error);
        next(error);
    }
};

exports.getMaintenanceBill = async (req, res, next) => {
    try {
        const status = req?.params?.status;
        const userId = req?.userId;

        // ✅ Validate required data
        if (!userId) {
            return errorResponse(res, "User ID missing in request", {}, 400);
        }

        const user = await User.findById(userId);
        const masterId = user?.created_by;

        if (!masterId) {
            return errorResponse(res, "Master user not found", {}, 404);
        }

        // ✅ Fetch all maintenance bills created by master
        const bills = await Bill.find({
            bill_data_type: "maintenance",
            created_by: masterId,
        }).select("_id");

        if (!bills) {
            return errorResponse(res, "No maintenance bills found", {}, 404);
        }

        const billIds = bills.map((b) => b._id.toString());

        // ✅ Fetch user-specific bills with relations
        const userBill = await UserBill.find({
                user_id: userId,
                bill_id: {
                    $in: billIds
                },
            })
            .populate({
                path: "bill_id",
                select: "-created_at -created_by" // exclude these two fields
            })
            .populate({
                path: "apartment_id",
                select: "_id apartment_no apartment_area  apartment_type status tower_id floor_id",
                populate: [{
                        path: "tower_id",
                        select: "_id name" // ✅ tower fields
                    },
                    {
                        path: "floor_id",
                        select: "_id floor_name" // ✅ floor fields
                    }
                ]
            })
            .populate({
                path: "user_id",
                select: "_id first_name last_name email phone" // ✅ user fields
            })
            .populate({
                path: "payments",
                select: "_id amount bill_id user_bill_id bank_name  status  paid_remark neft_no neft_date paid_remark cheque_no  cheque_date demand_draft_no  demand_draft_date  payment_mode  receipt_no" // ✅ user fields
            })

        if (!userBill) {
            return errorResponse(res, "User bill does not exist", {}, 404);
        }

        // ✅ Fetch maintenance cost configuration
        let maintenance = await Maintenance.findOne({
            cost_type: "2",
            created_by: masterId,
        });

        if (!maintenance) {
            maintenance = await Maintenance.findOne({
                cost_type: "1",
                created_by: masterId,
            });
        }

        const fixedData =
            maintenance?.fixed_data?.length > 0 ?
            maintenance.fixed_data :
            maintenance?.unit_type || [];

        // ✅ Create fixed cost map
        const fixedCostMap = new Map();
        if (Array.isArray(fixedData) && fixedData.length > 0) {
            fixedData.forEach((item) => {
                fixedCostMap.set(item.apartment_type, Number(item.unit_value || 0));
            });
        } else if (fixedData && typeof fixedData === "object") {
            fixedCostMap.set("default", Number(fixedData.unit_value || 0));
        }

        // ✅ Group and calculate total/paid cost
        const grouped = {};

        userBill.forEach((row) => {
            const billId = row?.bill_id?._id?.toString();
            const apartmentId = row?.apartment_id?._id?.toString();
            const key = `${billId}-${apartmentId}`;

            if (!grouped[key]) {
                grouped[key] = {
                    ...row.toObject(),
                    paid_cost: 0,
                    total_cost: 0,
                    status: "Unpaid",
                };
            }

            // ✅ Cost calculation
            const additionalCost = row?.bill_id?.additional_cost || [];
            const apartmentType = row?.apartment_id?.apartment_type || "";
            const apartmentArea = Number(row?.apartment_id?.apartment_area || 0);

            let fixedCost = 0;
            if (fixedCostMap.has(apartmentType)) {
                fixedCost = Number(fixedCostMap.get(apartmentType)) || 0;
            } else if (fixedCostMap.has("default")) {
                fixedCost = (Number(fixedCostMap.get("default")) || 0) * apartmentArea;
            }

            const additionalTotal = additionalCost.reduce(
                (sum, val) => sum + (Number(val.amount) || 0),
                0
            );

            const totalCost = fixedCost + additionalTotal;
            const paidCost = (row?.payments || []).reduce(
                (sum, val) => sum + (Number(val.amount) || 0),
                0
            );

            grouped[key].total_cost = Number(totalCost.toFixed(0));
            grouped[key].paid_cost = Number(paidCost.toFixed(0));
            grouped[key].status =
                grouped[key].paid_cost >= grouped[key].total_cost ? "Paid" : "Unpaid";
        });

        const processedData = Object.values(grouped);

        // ✅ Filter by `status` param (true = paid, false = unpaid)
        let finalData = processedData;
        if (status === "true") {
            finalData = processedData.filter((row) => row.status === "Paid");
        } else if (status === "false") {
            finalData = processedData.filter((row) => row.status === "Unpaid");
        }

        return successResponse(
            res,
            "Maintenance bills fetched successfully",
            finalData
        );
    } catch (error) {
        console.error("getMaintenanceBill error:", error);
        return next(error);
    }
};