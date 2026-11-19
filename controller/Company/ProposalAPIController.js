const mongoose = require("mongoose")

const Proposal = require("../../model/Proposal")
const Contact = require("../../model/Contact") // adjust the path/name if yours differs
const Property = require("../../model/Property")
const FollowUp = require("../../model/FollowUp")
const {
    successResponse
} = require("../../util/response")

/* ---------- helpers ---------- */
const fail = (res, code, message) =>
    res.status(code).json({
        status: "Error",
        statusCode: code,
        message
    })

const isId = v => mongoose.isValidObjectId(v)

const toNum = v => {
    const n = parseFloat(v)

    return Number.isFinite(n) ? n : 0
}

const inr = v =>
    `₹ ${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const inrShort = v =>
    `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

const fmtDate = d =>
    d ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }) : ""

const EMAIL_RE = /^\S+@\S+\.\S+$/

// escape user supplied values before they go into the HTML template
const esc = v =>
    String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const firstOf = v => {
    const x = Array.isArray(v) ? v[0] : v

    if (x && typeof x === "object") return x.number || x.phone || x.value || ""

    return x || ""
}

/* ---------- mail template ----------
   Every value is optional; the defaults reproduce the original static template. */
const buildTemplateMail = (d = {}) => {
    const customerName = esc(d.customer_name || "Sir/Madam")
    const location = esc(
        d.location ||
        "Dreamweavers Cowork PPR Mall, 4th Floor, Ravindra Nagar, Jalandhar, Punjab – 144001"
    )
    const office = esc(d.office || "Bay 6 (INS)")
    const rent = d.monthly_rent != null && d.monthly_rent !== "" ? inrShort(d.monthly_rent) : "₹25,000"
    const term = esc(d.contract_period || 12)
    const activationFee = d.setup_fee ? inrShort(d.setup_fee) : "INR 950"
    const deposit = d.security_deposit ?
        `${inrShort(d.security_deposit)} (refundable)` :
        "Equivalent to 2 months of office fee."
    const tax = esc(d.tax_percent ?? 18)
    const notes = d.notes ? esc(d.notes) : "Any other addition or remark, if applicable."

    const services = Array.isArray(d.additional_services) ? d.additional_services : []
    const servicesHtml = services.length ?
        `<ul style="margin:5px 0 0; padding-left:20px;">${services
            .map(s => `<li>${esc(s.name)} – ${inrShort(s.amount)}</li>`)
            .join("")}</ul>` :
        ""

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dreamweavers Cowork - Office Proposal</title>
</head>

<body style="margin:0; padding:20px; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif; color:#333;">

    <div style="max-width:850px; margin:0 auto; background:#ffffff; padding:40px; box-sizing:border-box; box-shadow:0 3px 15px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="border-bottom:3px solid #604878; padding-bottom:20px; margin-bottom:25px;">
            <h1 style="margin:0; color:#604878; font-size:28px; letter-spacing:1px;">
                DREAMWEAVERS COWORK
            </h1>
            <p style="margin:6px 0 0; color:#777; font-size:13px; letter-spacing:1px;">
                PROFESSIONAL WORKSPACE SOLUTIONS
            </p>
        </div>

        <!-- Greeting -->
        <div style="margin-bottom:25px; font-size:14px; line-height:1.7;">
            <p style="margin:0 0 15px;">Dear ${customerName},</p>

            <p style="margin:0 0 15px;">Greetings of the day!</p>

            <p style="margin:0 0 15px;">
                Thank you for considering
                <strong style="color:#604878;">Dreamweavers Cowork</strong>
                for your workspace needs.
            </p>

            <p style="margin:0;">
                Kindly find below the detailed <strong>'No Regret' pricing</strong>
                as per your requirement. Once you confirm the following details,
                I shall share the office service agreement for your perusal and acceptance.
            </p>
        </div>

        <!-- Client Details -->
        <div style="background:#f8f6fa; border-left:4px solid #604878; padding:18px 22px; margin-bottom:30px;">
            <h3 style="margin:0 0 15px; color:#604878; font-size:16px;">
                Required Information
            </h3>

            <ul style="margin:0; padding-left:20px; font-size:14px; line-height:2;">
                <li><strong>Company Name (Full):</strong> ${esc(d.company_name)}</li>
                <li><strong>Contact Signatory Name:</strong> ${esc(d.signatory_name)}</li>
                <li><strong>Contact Number:</strong> ${esc(d.contact_number)}</li>
                <li><strong>Email ID:</strong> ${esc(d.customer_email)}</li>
                <li><strong>Start Date:</strong> ${esc(d.start_date)}</li>
                <li><strong>Number of Occupants to Start With:</strong> ${esc(d.seats)}</li>
            </ul>
        </div>

        <!-- Pricing Table -->
        <h2 style="font-size:19px; color:#604878; margin-bottom:15px;">
            Office Pricing Details
        </h2>

        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:20px;">
            <thead>
                <tr style="background:#604878; color:#ffffff;">
                    <th style="padding:14px 10px; border:1px solid #604878; text-align:left;">
                        Location
                    </th>
                    <th style="padding:14px 10px; border:1px solid #604878; text-align:center;">
                        Office Number
                    </th>
                    <th style="padding:14px 10px; border:1px solid #604878; text-align:center;">
                        Rent / Office Fee Per Month (INR)
                        <br>
                        <span style="font-size:11px; font-weight:normal;">
                            (${term} Months Term, Lock-in)
                        </span>
                    </th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td style="padding:15px 10px; border:1px solid #ddd; font-weight:bold; line-height:1.6;">
                        ${location}
                    </td>

                    <td style="padding:15px 10px; border:1px solid #ddd; text-align:center; font-weight:bold;">
                        ${office}
                    </td>

                    <td style="padding:15px 10px; border:1px solid #ddd; text-align:center; font-size:17px; font-weight:bold; color:#604878;">
                        ${rent}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Additional Charges -->
        <h2 style="font-size:19px; color:#604878; margin-bottom:15px;">
            Additional Charges & Terms
        </h2>

        <div style="border:1px solid #e5e1e9; border-radius:5px; overflow:hidden; margin-bottom:30px;">

            <div style="padding:14px 16px; border-bottom:1px solid #e5e1e9; font-size:13px; line-height:1.7;">
                <strong style="color:#604878;">A) Service Retainer / Deposit (Refundable)</strong>
                <p style="margin:5px 0 0;">
                    ${deposit} Refundable upon the
                    end of the agreement and settlement of accounts.
                </p>
            </div>

            <div style="padding:14px 16px; border-bottom:1px solid #e5e1e9; font-size:13px; line-height:1.7;">
                <strong style="color:#604878;">B) One-Time Activation Fee</strong>
                <p style="margin:5px 0 0;">
                    ${activationFee} per person + applicable taxes, to set up your
                    services initially.
                </p>
            </div>

            <div style="padding:14px 16px; border-bottom:1px solid #e5e1e9; font-size:13px; line-height:1.7;">
                <strong style="color:#604878;">C) Kitchen Amenity Fee</strong>
                <p style="margin:5px 0 0;">
                    INR 1,000 per person per month for tea/coffee (up to
                    2–3 times, on self-service).
                </p>
                <p style="margin:5px 0 0;">
                    INR 500 per person per month for butler service
                    (optional service).
                </p>
            </div>

            <div style="padding:14px 16px; border-bottom:1px solid #e5e1e9; font-size:13px; line-height:1.7;">
                <strong style="color:#604878;">D) Branding Charges</strong>
                <p style="margin:5px 0 0;">
                    Branding shall be charged extra as per the branding requirements.
                </p>
                ${servicesHtml}
            </div>

            <div style="padding:14px 16px; border-bottom:1px solid #e5e1e9; font-size:13px; line-height:1.7;">
                <strong style="color:#604878;">E) Taxes</strong>
                <p style="margin:5px 0 0;">
                    All rates are exclusive of taxes (GST @ ${tax}%).
                </p>
            </div>

            <div style="padding:14px 16px; font-size:13px; line-height:1.7;">
                <strong style="color:#604878;">F) Other Additions / Remarks</strong>
                <p style="margin:5px 0 0;">
                    ${notes}
                </p>
            </div>

        </div>

        <!-- Availability Notice -->
        <div style="background:#fff7e8; border-left:4px solid #e4a33a; padding:16px 18px; margin-bottom:30px;">
            <p style="margin:0; font-size:13px; line-height:1.7; color:#76551e;">
                <strong>Important Note:</strong>
                Since our inventory is limited, offices remain subject to availability
                until the agreement is accepted/signed and the initial payment is received.
            </p>
        </div>

        <!-- Facilities -->
        <h2 style="font-size:19px; color:#604878; margin-bottom:8px;">
            Your Office Comes Fully Equipped
        </h2>

        <p style="font-size:13px; line-height:1.7; color:#555; margin-bottom:18px;">
            Your office comes with everything you need to run your business
            from the day you move in.
        </p>

        <div style="border:1px solid #e5e1e9; padding:18px 20px; margin-bottom:30px;">

            <ul style="margin:0; padding-left:20px; font-size:13px; line-height:1.9;">

                <li>
                    <strong>Furnishings:</strong>
                    High-quality ergonomic furniture from leading brands
                    for a comfortable and productive environment.
                </li>

                <li>
                    <strong>Internet:</strong>
                    Internet connectivity for all occupants.
                </li>

                <li>
                    <strong>Common Areas:</strong>
                    All areas are maintained for your use, including
                    reception, kitchen and lounge.
                </li>

                <li>
                    <strong>Air Conditioning:</strong>
                    Air conditioning during normal working hours.
                </li>

                <li>
                    <strong>Utility Bills:</strong>
                    Electricity and water bills.
                </li>

                <li>
                    <strong>Premises Taxes:</strong>
                    All taxes associated with the premises.
                </li>

                <li>
                    <strong>Maintenance:</strong>
                    Common area maintenance charges.
                </li>

                <li>
                    <strong>Support Team:</strong>
                    Professional support for facilities management
                    and meet-and-greet at reception.
                </li>

                <li>
                    <strong>Reception Area:</strong>
                    Dedicated reception facilities.
                </li>

                <li>
                    <strong>Housekeeping:</strong>
                    Daily cleaning services.
                </li>

                <li>
                    <strong>Equipment Rental:</strong>
                    Equipment rental charges, including photocopiers,
                    shredders, etc.
                </li>

                <li>
                    <strong>Security:</strong>
                    Dedicated security team.
                </li>

                <li>
                    <strong>Power Backup:</strong>
                    100% UPS power backup.
                </li>

                <li>
                    <strong>Conference Room:</strong>
                    Complimentary 4 hours/month conference room usage,
                    subject to availability and same-day pre-booking.
                </li>

            </ul>
        </div>

        <!-- One Time Cost -->
        <h2 style="font-size:19px; color:#604878; margin-bottom:15px;">
            One-Time Cost
        </h2>

        <div style="background:#f8f6fa; padding:18px; border-radius:5px; margin-bottom:30px;">
            <p style="margin:0; font-size:13px; line-height:1.8;">
                <strong style="color:#604878;">
                    Office Restoration Service:
                </strong>
                A fee of INR 100 per square feet for each occupied office
                will be charged upon your departure or if you, at your option,
                choose to relocate to different rooms within the Centre.
                <strong>(Applicable only on private space.)</strong>
            </p>
        </div>

        <!-- Payment Terms -->
        <h2 style="font-size:19px; color:#604878; margin-bottom:15px;">
            Payment of Monthly Invoices
        </h2>

        <div style="border:1px solid #e5e1e9; padding:18px; margin-bottom:20px;">
            <p style="font-size:13px; line-height:1.8; margin:0 0 12px;">
                All monthly invoices are raised one month in advance.
                Payment towards fixed monthly charges must be made
                05 days in advance.
            </p>

            <p style="font-size:13px; line-height:1.8; margin:0 0 12px;">
                <strong>Payment Due Date:</strong>
                25th of every month, unless another date is specified on the invoice.
            </p>

            <div style="background:#f8f6fa; padding:14px; border-radius:4px;">
                <strong style="color:#604878; font-size:13px;">
                    Example:
                </strong>
                <p style="margin:6px 0 0; font-size:13px; line-height:1.7;">
                    The invoice towards rent/fee for the month of March
                    will be raised on 1st February, and payment will be
                    due by 25th February. Thereafter, the same cycle will continue.
                </p>
            </div>
        </div>

        <!-- Closing -->
        <div style="margin-top:30px; font-size:13px; line-height:1.8;">
            <p>
                Should you have any queries or require any additional information,
                kindly let me know.
            </p>

            <p style="margin-top:25px;">Warm Regards,</p>

            <p style="margin:5px 0; font-size:16px; font-weight:bold; color:#604878;">
                Karuna
            </p>

            <p style="margin:5px 0;">
                <strong>9041222444</strong> | DreamWeavers Cowork
            </p>

            <p style="margin:5px 0;">
                SCO 1-12, 4th Floor/05th Floor, PPR Mall,
                Jalandhar – 144001
            </p>

            <p style="margin:5px 0;">
                Email:
                <a href="mailto:karuna@dreamweaverscowork.com"
                   style="color:#604878; text-decoration:none;">
                    karuna@dreamweaverscowork.com
                </a>
                |
                <a href="mailto:hello@dreamweaverscowork.com"
                   style="color:#604878; text-decoration:none;">
                    hello@dreamweaverscowork.com
                </a>
            </p>
        </div>

        <!-- Footer -->
        <div style="margin-top:35px; padding-top:18px; border-top:2px solid #604878; text-align:center;">
            <p style="margin:0; font-size:12px; font-weight:bold; color:#604878; letter-spacing:1px;">
                DREAMWEAVERS COWORK
            </p>

            <p style="margin:6px 0 0; font-size:11px; color:#888;">
                Your Workspace. Your Growth. Our Commitment.
            </p>
        </div>

    </div>

</body>
</html>`
}

/* Plug your mailer in here. Lazy require so a missing util doesn't crash the server on boot. */
const sendProposalEmail = async ({
    to,
    subject,
    html
}) => {
    let mailer

    try {
        mailer = require("../../util/sendMail") // adjust to your mail helper
    } catch (e) {
        throw new Error("Mail helper not configured")
    }

    const send = mailer.sendMail || mailer
    await send({
        to,
        subject,
        html
    })
}

/* ---------- GET /proposal/create/data ---------- */
exports.getProposalCreateAPI = async (req, res, next) => {
    try {
        const userId = req?.userId

        const [customerData, propertyData] = await Promise.all([
            Contact.find({
                created_by: userId
            })
            .select("full_name contact_type emails phones")
            .sort({
                full_name: 1
            })
            .lean(),
            Property.find({
                created_by: userId
            }).lean()
        ])

        return successResponse(res, "Proposal create data fetched successfully", {
            customerData,
            propertyData,
            template_mail: buildTemplateMail() // default (unfilled) version of the template
        })
    } catch (error) {
        next(error)
    }
}

/* ---------- POST /proposal/save/data ---------- */
exports.createProposalAPI = async (req, res, next) => {
    try {
        const userId = req?.userId
        const b = req.body || {}

        /* ----- validate ----- */
        if (!isId(b.customer_id)) return fail(res, 400, "Valid customer is required")
        if (!isId(b.property_id)) return fail(res, 400, "Valid property is required")
        if (b.lead_id && !isId(b.lead_id)) return fail(res, 400, "Invalid lead")

        const email = String(b.email || "").trim().toLowerCase()

        if (!EMAIL_RE.test(email)) return fail(res, 400, "Valid email is required")

        const seats = toNum(b.seats)
        const contractPeriod = toNum(b.contract_period)

        if (!Number.isInteger(seats) || seats < 1) return fail(res, 400, "Seats must be at least 1")
        if (!Number.isInteger(contractPeriod) || contractPeriod < 1) {
            return fail(res, 400, "Contract period must be at least 1 month")
        }

        const startDate = new Date(b.start_date)
        const expiryDate = new Date(b.expiry_date)

        if (isNaN(startDate) || isNaN(expiryDate)) return fail(res, 400, "Valid start and expiry dates are required")
        if (expiryDate < startDate) return fail(res, 400, "Expiry date cannot be before the start date")

        // one day of tolerance for timezone differences between browser and server
        if (expiryDate < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            return fail(res, 400, "Expiry date cannot be in the past")
        }

        const services = Array.isArray(b.additional_services) ? b.additional_services : []

        for (const s of services) {
            if (!String(s?.name || "").trim()) return fail(res, 400, "Each additional service needs a name")
        }

        const [customer, property] = await Promise.all([
            Contact.findById(b.customer_id).lean(),
            Property.findOne({
                _id: b.property_id,
                created_by: userId
            }).lean()
        ])

        if (!customer) return fail(res, 404, "Customer not found")
        if (!property) return fail(res, 404, "Property not found")

        /* ----- create (whitelisted fields only; totals are computed by the model) ----- */
        const proposal = new Proposal({
            lead_id: b.lead_id || undefined,
            customer_id: customer._id,
            property_id: property._id,
            seats,
            contract_period: contractPeriod,
            start_date: startDate,
            expiry_date: expiryDate,
            monthly_rent: toNum(b.monthly_rent),
            setup_fee: toNum(b.setup_fee),
            security_deposit: toNum(b.security_deposit),
            discount: toNum(b.discount),
            tax_percent: b.tax_percent === "" || b.tax_percent == null ? 18 : toNum(b.tax_percent),
            additional_services: services.map(s => ({
                name: String(s.name).trim(),
                amount: toNum(s.amount)
            })),
            email,
            notes: b.notes ? String(b.notes).trim() : null,
            created_by: userId
        })

        await proposal.save()

        /* ----- document data used by the PDF and the email ----- */
        const propertyName = property.name || property.title || property.property_name || "Property"

        const finalData = {
            proposal_no: proposal.proposal_no,
            date: fmtDate(proposal.created_at),
            customer_name: customer.full_name,
            customer_email: email,
            property_name: propertyName,
            seats: proposal.seats,
            contract_period: proposal.contract_period,
            start_date: fmtDate(proposal.start_date),
            expiry_date: fmtDate(proposal.expiry_date),
            monthly_rent: proposal.monthly_rent,
            setup_fee: proposal.setup_fee,
            security_deposit: proposal.security_deposit,
            discount: proposal.discount,
            tax_percent: proposal.tax_percent,
            additional_services: proposal.additional_services,
            subtotal: proposal.subtotal,
            tax_amount: proposal.tax_amount,
            total_amount: proposal.total_amount,
            notes: proposal.notes
        }

        const subject = `Proposal #${proposal.proposal_no} - ${propertyName}`

        /* ----- message = the mail template filled with this proposal's data ----- */
        const message = buildTemplateMail({
            customer_name: customer.full_name,
            company_name: customer.company_name || customer.full_name,
            contact_number: firstOf(customer.phones),
            customer_email: email,
            start_date: fmtDate(proposal.start_date),
            seats: proposal.seats,
            location: property.address || property.location || undefined,
            office: propertyName,
            monthly_rent: proposal.monthly_rent,
            contract_period: proposal.contract_period,
            setup_fee: proposal.setup_fee,
            security_deposit: proposal.security_deposit,
            tax_percent: proposal.tax_percent,
            additional_services: proposal.additional_services,
            notes: proposal.notes
        })

        /* ----- email ----- */
        if (b.send_email) {
            try {
                await sendProposalEmail({
                    to: email,
                    subject,
                    html: message
                })

                proposal.status = "Sent"
                proposal.sent_at = new Date()
                await proposal.save()
            } catch (mailError) {
                console.error("Proposal email failed:", mailError)

                return fail(
                    res,
                    502,
                    `Proposal #${proposal.proposal_no} was saved but the email could not be sent`
                )
            }
        }

        return successResponse(res, "Proposal created successfully", {
            proposal,
            finalData,
            subject,
            message
        })
    } catch (error) {
        if (error?.name === "ValidationError") {
            return fail(res, 400, Object.values(error.errors).map(e => e.message).join(", "))
        }

        next(error)
    }
}