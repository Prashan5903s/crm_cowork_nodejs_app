const mongoose = require('mongoose')
const user = require('../model/User')
const Role = require('../model/Role')
const RoleUser = require('../model/RoleUser')
const packageType = require('../model/PackageType')

const normalizeToArray = data => {
  if (!data) return []
  if (typeof data === 'string') return [data]
  if (Array.isArray(data)) return data.flat(Infinity).map(String)
  if (typeof data === 'object')
    return Object.values(data).flat(Infinity).map(String)
  return []
}

module.exports = async userId => {
  try {
    const listing = '68cd0c88c2d476bd45382e0d'
    const edit = '68bc229cab2e24f55ea586fa'
    const status = '68cd0a88ce94fc785bb601c8'
    const add = '68bc227eab2e24f55ea586ef'
    const invoice = '68cd0c5fc2d476bd45382c6a'
    const record_view = '68cd0cecc2d476bd45383621'
    const add_photo = '690dc3c45d4de8f936ffc615'
    const gate_verify = '68edf53eed28e2c6b049bafc'
    const gate_entry = '6911854e2def1f7161b6d6f8'

    const superAdminId = '6ac87727ca7c0ad2edab51f9'
    const ticketId = '68d22d6718430e2129859697'
    const role = '68cd0cb3c2d476bd453831ef'
    const apartment = '68cd0b51ce94fc785bb63192'
    const tower = '68cd0b44ce94fc785bb63184'
    const users = '68bc226cab2e24f55ea586e7'
    const billing = '68cd0742ce94fc785bb5fe75'
    const visitor = '68cd07c8ce94fc785bb5fe83'
    const complain = '68cd07f2ce94fc785bb5fe8a'
    const floor = '68cd0b3dce94fc785bb63176'
    const camera = '68cd3f185ab9c7e035f4cb04'
    const announcemnt = '690dd350a5f8abb74adaa259'
    const event = '690dd35fa5f8abb74adaa280'
    const office_bearer = '68c01730556298d2b76244ac'

    let isSuperAdmin = false
    let isCompany = false
    let isUser = false
    let isSecurityGuard = false
    let isOfficeBearer = false
    let notUser = true

    const permissionsStatus = {
      hasTowerPermission: false,
      hasTowerAddPermission: false,
      hasTowerEditPermission: false,

      hasFlatPermission: false,
      hasFlatAddPermission: false,
      hasFlatEditPermission: false,

      hasApartmentPermission: false,
      hasApartmentAddPermission: false,
      hasApartmentEditPermission: false,

      hasAnnouncementPermission: false,
      hasAnnouncementAddPermission: false,
      hasAnnouncementEditPermission: false,

      hasEventPermission: false,
      hasEventAddPermission: false,
      hasEventEditPermission: false,

      hasUserPermission: false,
      hasUserStatusPermission: false,
      hasUserAddPermission: false,
      hasUserEditPermission: false,

      hasBillingPermission: false,
      hasBillingAddPermission: false,
      hasBillingEditPermission: false,
      hasBillingInvoicePermission: false,
      hasBillingViewPermission: false,

      hasComplainPermission: false,
      hasComplainAddPermission: false,
      hasComplainEditPermission: false,
      hasComplainRecordViewPermission: false,

      hasVisitorPermission: false,
      hasVisitorAddPermission: false,
      hasVisitorEditPermission: false,
      hasVisitorGateAllowIn: false,
      hasVisitorAddPhoto: false,
      hasVisitorGateEntryPermission: false,

      hasRolePermission: false,
      hasRoleAddPermission: false,
      hasRoleEditPermission: false,

      hasCameraPermission: false,

      hasTicketPermission: false
    }

    // If super admin, all permissions default to false (can be changed if needed)
    if (userId?.toString().trim() === superAdminId) {
      isSuperAdmin = true
    } else {
      const User = await user.findById(userId)

      if (!User) {
        return {
          data: {},
          errorExist: true,
          statusCode: 404,
          message: 'User does not exist'
        }
      }

      const masterId = User.created_by?.toString().trim()

      if (masterId === superAdminId) {
        isCompany = true

        const packageId = User.package_id

        if (packageId) {
          if (!mongoose.Types.ObjectId.isValid(packageId)) {
            return {
              data: {},
              errorExist: true,
              statusCode: 400,
              message: 'Invalid package ID'
            }
          }

          const packageTypeDoc = await packageType
            .findOne({
              'package.items._id': new mongoose.Types.ObjectId(packageId)
            })
            .lean()

          if (!packageTypeDoc) {
            return {
              data: {},
              errorExist: true,
              statusCode: 404,
              message: 'Package Type does not exist'
            }
          }

          const matchedItem = packageTypeDoc.package.items.find(
            item => item._id.toString() === packageId.toString()
          )

          if (!matchedItem) {
            return {
              data: {},
              errorExist: true,
              statusCode: 404,
              message: 'Package does not exist'
            }
          }

          const permission = matchedItem.permissions || {}

          permissionsStatus.hasTowerPermission = normalizeToArray(
            permission[tower]
          ).includes(listing)
          permissionsStatus.hasTowerAddPermission = normalizeToArray(
            permission[tower]
          ).includes(add)
          permissionsStatus.hasTowerEditPermission = normalizeToArray(
            permission[tower]
          ).includes(edit)

          permissionsStatus.hasFloorPermission = normalizeToArray(
            permission[floor]
          ).includes(listing)
          permissionsStatus.hasFloorAddPermission = normalizeToArray(
            permission[floor]
          ).includes(add)
          permissionsStatus.hasFloorEditPermission = normalizeToArray(
            permission[floor]
          ).includes(edit)

          permissionsStatus.hasApartmentPermission = normalizeToArray(
            permission[apartment]
          ).includes(listing)
          permissionsStatus.hasApartmentAddPermission = normalizeToArray(
            permission[apartment]
          ).includes(add)
          permissionsStatus.hasApartmentEditPermission = normalizeToArray(
            permission[apartment]
          ).includes(edit)

          permissionsStatus.hasAnnouncementPermission = normalizeToArray(
            permission[announcemnt]
          ).includes(listing)
          permissionsStatus.hasAnnouncementAddPermission = normalizeToArray(
            permission[announcemnt]
          ).includes(add)
          permissionsStatus.hasAnnouncementEditPermission = normalizeToArray(
            permission[announcemnt]
          ).includes(edit)

          permissionsStatus.hasEventPermission = normalizeToArray(
            permission[event]
          ).includes(listing)
          permissionsStatus.hasEventAddPermission = normalizeToArray(
            permission[event]
          ).includes(add)
          permissionsStatus.hasEventEditPermission = normalizeToArray(
            permission[event]
          ).includes(edit)

          permissionsStatus.hasUserPermission = normalizeToArray(
            permission[users]
          ).includes(listing)
          permissionsStatus.hasUserAddPermission = normalizeToArray(
            permission[users]
          ).includes(add)
          permissionsStatus.hasUserEditPermission = normalizeToArray(
            permission[users]
          ).includes(edit)
          permissionsStatus.hasUserStatusPermission = normalizeToArray(
            permission[users]
          ).includes(status)

          permissionsStatus.hasBillingPermission = normalizeToArray(
            permission[billing]
          ).includes(listing)
          permissionsStatus.hasBillingAddPermission = normalizeToArray(
            permission[billing]
          ).includes(add)
          permissionsStatus.hasBillingEditPermission = normalizeToArray(
            permission[billing]
          ).includes(edit)
          permissionsStatus.hasBillingInvoicePermission = normalizeToArray(
            permission[billing]
          ).includes(invoice)
          permissionsStatus.hasBillingViewPermission = normalizeToArray(
            permission[billing]
          ).includes(record_view)

          permissionsStatus.hasComplainPermission = normalizeToArray(
            permission[complain]
          ).includes(listing)
          permissionsStatus.hasComplainAddPermission = normalizeToArray(
            permission[complain]
          ).includes(add)
          permissionsStatus.hasComplainEditPermission = normalizeToArray(
            permission[complain]
          ).includes(edit)
          permissionsStatus.hasComplainRecordViewPermission = normalizeToArray(
            permission[complain]
          ).includes(record_view)

          permissionsStatus.hasVisitorPermission = normalizeToArray(
            permission[visitor]
          ).includes(listing)
          permissionsStatus.hasVisitorAddPermission = normalizeToArray(
            permission[visitor]
          ).includes(add)
          permissionsStatus.hasVisitorEditPermission = normalizeToArray(
            permission[visitor]
          ).includes(edit)
          permissionsStatus.hasVisitorGateAllowIn = normalizeToArray(
            permission[visitor]
          ).includes(gate_verify)
          permissionsStatus.hasVisitorAddPhoto = normalizeToArray(
            permission[visitor]
          ).includes(add_photo)
          permissionsStatus.hasVisitorGateEntryPermission = normalizeToArray(
            permission[visitor]
          ).includes(gate_entry)

          permissionsStatus.hasRolePermission = normalizeToArray(
            permission[role]
          ).includes(listing)
          permissionsStatus.hasRoleAddPermission = normalizeToArray(
            permission[role]
          ).includes(add)
          permissionsStatus.hasRoleEditPermission = normalizeToArray(
            permission[role]
          ).includes(edit)

          permissionsStatus.hasTicketPermission = normalizeToArray(
            permission[ticketId]
          ).includes(listing)
        }
      } else {
        const roles = await RoleUser.find({
          user_id: userId
        }).select('role_id')

        const roleIds = roles.map(r => r.role_id)

        const roleDocs = await Role.find({
          _id: {
            $in: roleIds
          }
        }).lean()

        const targetRoleId = '68cd0e38c2d476bd45384234'

        const roleExists = await RoleUser.exists({
          user_id: userId,
          role_id: targetRoleId
        })

        const officeRoleBearer = await RoleUser.exists({
          user_id: userId,
          role_id: office_bearer
        })

        if (officeRoleBearer) {
          isOfficeBearer = true
        }

        if (roleExists) {
          isSecurityGuard = true
        }

        // merged permissions object
        const mergedPermissions = {}

        for (const role of roleDocs) {
          if (!role.permissions) continue

          // iterate object instead of Map
          for (const [key, values] of Object.entries(role.permissions)) {
            if (!mergedPermissions[key]) {
              mergedPermissions[key] = new Set()
            }

            values.forEach(v => mergedPermissions[key].add(v.toString())) // ensure uniqueness
          }
        }

        // convert sets back to arrays
        const finalPermissions = {}
        for (const key in mergedPermissions) {
          finalPermissions[key] = Array.from(mergedPermissions[key])
        }

        permissionsStatus.hasTowerPermission = normalizeToArray(
          finalPermissions[tower]
        ).includes(listing)
        permissionsStatus.hasTowerAddPermission = normalizeToArray(
          finalPermissions[tower]
        ).includes(add)
        permissionsStatus.hasTowerEditPermission = normalizeToArray(
          finalPermissions[tower]
        ).includes(edit)

        permissionsStatus.hasFloorPermission = normalizeToArray(
          finalPermissions[floor]
        ).includes(listing)
        permissionsStatus.hasFloorAddPermission = normalizeToArray(
          finalPermissions[floor]
        ).includes(add)
        permissionsStatus.hasFloorEditPermission = normalizeToArray(
          finalPermissions[floor]
        ).includes(edit)

        permissionsStatus.hasApartmentPermission = normalizeToArray(
          finalPermissions[apartment]
        ).includes(listing)
        permissionsStatus.hasApartmentAddPermission = normalizeToArray(
          finalPermissions[apartment]
        ).includes(add)
        permissionsStatus.hasApartmentEditPermission = normalizeToArray(
          finalPermissions[apartment]
        ).includes(edit)

        permissionsStatus.hasAnnouncementPermission = normalizeToArray(
          finalPermissions[announcemnt]
        ).includes(listing)
        permissionsStatus.hasAnnouncementAddPermission = normalizeToArray(
          finalPermissions[announcemnt]
        ).includes(add)
        permissionsStatus.hasAnnouncementEditPermission = normalizeToArray(
          finalPermissions[announcemnt]
        ).includes(edit)

        permissionsStatus.hasEventPermission = normalizeToArray(
          finalPermissions[event]
        ).includes(listing)
        permissionsStatus.hasEventAddPermission = normalizeToArray(
          finalPermissions[event]
        ).includes(add)
        permissionsStatus.hasEventEditPermission = normalizeToArray(
          finalPermissions[event]
        ).includes(edit)

        permissionsStatus.hasUserPermission = normalizeToArray(
          finalPermissions[users]
        ).includes(listing)
        permissionsStatus.hasUserAddPermission = normalizeToArray(
          finalPermissions[users]
        ).includes(add)
        permissionsStatus.hasUserEditPermission = normalizeToArray(
          finalPermissions[users]
        ).includes(edit)
        permissionsStatus.hasUserStatusPermission = normalizeToArray(
          finalPermissions[users]
        ).includes(status)

        permissionsStatus.hasBillingPermission = normalizeToArray(
          finalPermissions[billing]
        ).includes(listing)
        permissionsStatus.hasBillingAddPermission = normalizeToArray(
          finalPermissions[billing]
        ).includes(add)
        permissionsStatus.hasBillingEditPermission = normalizeToArray(
          finalPermissions[billing]
        ).includes(edit)
        permissionsStatus.hasBillingInvoicePermission = normalizeToArray(
          finalPermissions[billing]
        ).includes(invoice)
        permissionsStatus.hasBillingViewPermission = normalizeToArray(
          finalPermissions[billing]
        ).includes(record_view)

        permissionsStatus.hasComplainPermission = normalizeToArray(
          finalPermissions[complain]
        ).includes(listing)
        permissionsStatus.hasComplainAddPermission = normalizeToArray(
          finalPermissions[complain]
        ).includes(add)
        permissionsStatus.hasComplainEditPermission = normalizeToArray(
          finalPermissions[complain]
        ).includes(edit)
        permissionsStatus.hasComplainRecordViewPermission = normalizeToArray(
          finalPermissions[complain]
        ).includes(record_view)

        permissionsStatus.hasVisitorPermission = normalizeToArray(
          finalPermissions[visitor]
        ).includes(listing)
        permissionsStatus.hasVisitorAddPermission = normalizeToArray(
          finalPermissions[visitor]
        ).includes(add)
        permissionsStatus.hasVisitorEditPermission = normalizeToArray(
          finalPermissions[visitor]
        ).includes(edit)
        permissionsStatus.hasVisitorGateAllowIn = normalizeToArray(
          finalPermissions[visitor]
        ).includes(gate_verify)
        permissionsStatus.hasVisitorAddPhoto = normalizeToArray(
          finalPermissions[visitor]
        ).includes(add_photo)
        permissionsStatus.hasVisitorGateEntryPermission = normalizeToArray(
          finalPermissions[visitor]
        ).includes(gate_entry)

        permissionsStatus.hasRolePermission = normalizeToArray(
          finalPermissions[role]
        ).includes(listing)
        permissionsStatus.hasRoleAddPermission = normalizeToArray(
          finalPermissions[role]
        ).includes(add)
        permissionsStatus.hasRoleEditPermission = normalizeToArray(
          finalPermissions[role]
        ).includes(edit)

        permissionsStatus.hasCameraPermission = normalizeToArray(
          finalPermissions[camera]
        ).includes(listing)

        permissionsStatus.hasTicketPermission = normalizeToArray(
          finalPermissions[ticketId]
        ).includes(listing)

        isUser = true
        notUser = false
      }
    }

    const data = {
      isSuperAdmin,
      isCompany,
      isUser,
      notUser,
      isSecurityGuard,
      isOfficeBearer,
      ...permissionsStatus
    }

    return {
      data,
      errorExist: false,
      statusCode: 200,
      message: 'Permission fetched successfully'
    }
  } catch (error) {
    throw new Error(error)
  }
}
