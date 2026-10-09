const mongoose = require('mongoose')

const appConfigSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      maxLength: 100
    },

    panic_no: {
      type: String,
      maxLength: 100
    },

    terms_condition: {
      type: String,
      maxLength: 5000
    },

    dpa: {
      type: String,
      maxLength: 5000
    },

    terms_of_use: {
      type: String,
      maxLength: 5000
    },

    privacy_policy: {
      type: String,
      maxLength: 5000
    },

    annouc_banner: {
      type: String,
      required: false,
      maxLength: 100
    },

    panic_data: {
      mail_subject: {
        type: String,
        maxLength: 255
      },

      mail_body: {
        type: String,
        maxLength: 1000
      }
    },

    notification_type_data: [
      {
        title: {
          type: String,
          maxLength: 255,
          required: true
        }
      }
    ],

    escalation_data: {
      escalation_reason_data: [
        {
          title: {
            type: String,
            required: true
          }
        }
      ],

      escalation_status_data: [
        {
          title: {
            type: String,
            required: true
          }
        }
      ]
    },

    sla_breach_days: {
      type: Number,
      maxlength: 5,
      required: false
    }
  },
  {
    collection: 'app_config'
  }
)

module.exports = mongoose.model('app_config', appConfigSchema)
