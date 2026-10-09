const nodemailer = require('nodemailer')
const UserSendMail = require('../model/UserSendMail')

const sendUserMail = async (emails, subject, message, userId) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_server_hostname,
      port: Number(process.env.SMTP_server_port),
      secure: false, // for port 587
      auth: {
        user: process.env.SMTP_email,
        pass: process.env.SMTP_password
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    const mailOptions = {
      from: process.env.SMTP_email,
      to: emails.join(','), // Array -> comma separated
      subject,
      html: message
    }

    const info = await transporter.sendMail(mailOptions)

    // Save the sent email details to the database
    const userSendMail = new UserSendMail({
      user_id: userId,
      email: emails,
      mail_subject: subject,
      mail_body: message,
      sent_at: Date.now()
    })

    await userSendMail.save()

    return info
  } catch (err) {
    console.error(err)
    throw err
  }
}

module.exports = sendUserMail
