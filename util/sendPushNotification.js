const { getMessaging } = require('./firebase')

async function sendNotification (
  deviceToken,
  title,
  body,
  screen,
  userId,
  priority = 'high'
) {
  if (!deviceToken || typeof deviceToken !== 'string') {
    throw new Error('Invalid FCM token')
  }

  const message = {
    token: deviceToken,

    notification: {
      title,
      body
    },

    data: {
      screen: String(screen),
      userId: String(userId)
    },

    android: {
      priority,
      notification: {
        channelId: 'default',
        sound: 'default',
        priority: 'max'
      }
    },

    apns: {
      headers: {
        'apns-priority': '10'
      },
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  }

  try {
    const response = await getMessaging().send(message)

    return {
      success: true,
      messageId: response
    }
  } catch (error) {
    console.error('❌ Firebase Notification Error')
    console.error('Code:', error.code)
    console.error('Message:', error.message)

    throw error
  }
}

/**
 * Send notification to multiple users
 */
async function sendMultipleNotifications (
  tokens,
  title,
  body,
  screen,
  userId,
  priority = 'high'
) {
  if (!Array.isArray(tokens) || !tokens.length) {
    return {
      successCount: 0,
      failureCount: 0
    }
  }

  const validTokens = [...new Set(tokens.filter(Boolean))]

  const message = {
    tokens: validTokens,

    notification: {
      title,
      body
    },

    data: {
      screen: String(screen),
      userId: String(userId)
    },

    android: {
      priority,
      notification: {
        channelId: 'default',
        sound: 'default',
        priority: 'max'
      }
    },

    apns: {
      payload: {
        aps: {
          sound: 'default'
        }
      }
    }
  }

  try {
    const response = await getMessaging().sendEachForMulticast(message)


    return response
  } catch (error) {
    console.error('Multicast Notification Error:', error)
    throw error
  }
}

module.exports = {
  sendNotification,
  sendMultipleNotifications
}
