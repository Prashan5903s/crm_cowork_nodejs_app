// util/sendMail.js
const nodemailer = require("nodemailer")

let transporter

const getTransporter = () => {
  if (transporter) return transporter

  const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com"
  const port = Number(process.env.BREVO_SMTP_PORT) || 587
  const user = process.env.BREVO_SMTP_USER
  const pass = process.env.BREVO_SMTP_PASS

  if (!user) throw new Error("BREVO_SMTP_USER is not set")
  if (!pass) throw new Error("BREVO_SMTP_PASS is not set")

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 587 / 2525 use STARTTLS
    auth: {
      user,
      pass
    }
  })

  return transporter
}

/**
 * Send a transactional email through Brevo SMTP.
 *
 * @param {Object}  opts
 * @param {string|string[]} opts.to          recipient email(s)
 * @param {string}  opts.subject
 * @param {string}  opts.html                HTML body
 * @param {string}  [opts.text]              optional plain-text fallback
 * @param {string}  [opts.replyTo]           optional reply-to address
 * @param {Array<{name:string, content:string}>} [opts.attachments]  content = base64
 */
const sendMail = async ({
  to,
  subject,
  html,
  text,
  replyTo,
  attachments
}) => {
  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME || "Dreamweavers Cowork"

  if (!senderEmail) throw new Error("BREVO_SENDER_EMAIL is not set")

  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean)

  if (!recipients.length) throw new Error("No recipient email provided")

  const mail = {
    from: {
      name: senderName,
      address: senderEmail
    },
    to: recipients,
    subject,
    html
  }

  if (text) mail.text = text
  if (replyTo) mail.replyTo = replyTo

  if (attachments?.length) {
    mail.attachments = attachments.map(a => ({
      filename: a.name,
      content: a.content,
      encoding: "base64"
    }))
  }

  try {
    const info = await getTransporter().sendMail(mail)

    return {
      messageId: info.messageId
    }
  } catch (err) {
    throw new Error(`Brevo SMTP error: ${err.message}`)
  }
}

module.exports = {
  sendMail
}