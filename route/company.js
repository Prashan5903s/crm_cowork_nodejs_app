const express = require('express')
const router = express.Router()
const isAuth = require('../middleware/is-auth')
const appMenuController = require('../controller/Company/AppMenuController')
const roleController = require('../controller/Company/RoleAPIController')
const towerController = require('../controller/Company/TowerController')
const floorController = require('../controller/Company/FloorController')
const apartmentController = require('../controller/Company/ApartmentController')
const cameraController = require('../controller/Company/CameraController')
const billController = require('../controller/Company/BillController')
const paymentController = require('../controller/Company/PaymentController')
const userBillController = require('../controller/Company/UserBillController')
const complainController = require('../controller/Company/ComplainController')
const dashboardController = require('../controller/Company/DashboardController')
const noticeController = require('../controller/Company/NoticeController')
const eventController = require('../controller/Company/EventController')
const maintenanceController = require('../controller/Company/MaintenanceController')
const propertyTypeController = require('../controller/Company/PropertyTypeController')
const ticketTypeController = require('../controller/Company/TicketTypeController')
const visitorTypeController = require('../controller/Company/VisitorTypeController')
const reportController = require('../controller/Company/ReportController')
const tenantController = require('../controller/Company/TenantAPIController')
const panicAlertController = require('../controller/Company/PanicAlertAPIController')
const slaConfigController = require('../controller/Company/SLAConfigController')
const vendorController = require('../controller/Company/VendorAPIController')
const locationCategoryController = require('../controller/Company/LocationCategoryController')
const assetController = require('../controller/Company/AssetAPIController')
const amcAPIController = require('../controller/Company/AMCAPIController')
const inspectionController = require('../controller/Company/InspectionAPIController')
const inspectionScheduleController = require('../controller/Company/InspectionScheduleAPIController')
const documentController = require('../controller/Company/DocumentAPIController')

const createUpload = require('../util/upload')
const createDocUpload = require('../util/uploadDocFile')
const amenityController = require('../controller/Company/AmenityAPIController')

const activityUpload = createUpload(
  [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/x-icon',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4'
  ],
  'bills', // Folder inside /public
  500 // Max size in MB
)

const documentUpload = createDocUpload(
  [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/x-icon',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4'
  ],
  'documents', // Folder inside /public
  500 // Max size in MB
)

const { middleware: imageUpload } = createUpload(
  ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
  'uploads/images' // directory inside /public/
)

const { middleware: imageNoticeUpload } = createUpload(
  ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
  'uploads/notice' // directory inside /public/
)

const { middleware: imageEventUpload } = createUpload(
  ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
  'uploads/event' // directory inside /public/
)

router.get(
  '/app/menu/label/listing/:sn',
  isAuth,
  appMenuController.getAppMenuCompanyListAPI
)
router.post(
  '/app/menu/label/listing/:sn',
  isAuth,
  appMenuController.postCompanyMenuListAPI
)

//This route is for role
router.get('/role', isAuth, roleController.getRoleAPI)
router.get('/role/create', isAuth, roleController.createRoleAPI)
router.post('/role', isAuth, roleController.postRoleAPI)
router.put('/role/:roleId', isAuth, roleController.putRoleAPI)

//This route is for tower
router.get('/tower', isAuth, towerController.getTowerAPI)
router.post('/tower', isAuth, towerController.postTowerAPI)
router.put('/tower/:towerId', isAuth, towerController.putTowerAPI)

//This route is for floor
router.get('/floor', isAuth, floorController.getFloorAPI)
router.get('/floor/create', isAuth, floorController.getCreateAPI)
router.post('/floor', isAuth, floorController.postFloorController)
router.put('/floor/:floorId', isAuth, floorController.updateFloorAPI)

//This route is for Apartment
router.get('/apartment', isAuth, apartmentController.getApartmentAPI)
router.get('/apartment/create', isAuth, apartmentController.createApartmentAPI)
router.post('/apartment', isAuth, apartmentController.postApartmentAPI)
router.put(
  '/apartment/:apartmentId',
  isAuth,
  apartmentController.updateApartmentAPI
)

//This route is for camera
router.get('/camera', isAuth, cameraController.getCameraController)

//This route is for Bill
router.get('/bill/data/:type', isAuth, billController.getBillData)
router.get('/bill/create', isAuth, billController.getCreateBill)
router.post(
  '/bill',
  isAuth,
  ...activityUpload.middleware('image'),
  billController.postBillController
)
router.put(
  '/bill/update/:billId',
  isAuth,
  ...activityUpload.middleware('image'),
  billController.putBillController
)

//This route is for payment
router.get('/payment', isAuth, paymentController.getPaymentController)
router.post('/payment', isAuth, paymentController.postPaymentController)

//This route is for User Bill
router.get(
  '/user/bill/:billId',
  isAuth,
  userBillController.getUserBillController
)
router.post(
  '/user/bill/data/payment',
  isAuth,
  userBillController.postUserBillController
)

//This route is for company
router.get(
  '/complain/data/:status',
  isAuth,
  complainController.getComplainController
)
router.get(
  '/complain/create',
  isAuth,
  complainController.createComplainController
)
router.post(
  '/complain/data/:id/:code',
  isAuth,
  complainController.postComplainController
)

//This is the route for escalated complain
router.post(
  '/escalated/complain/data/:code',
  isAuth,
  complainController.postEscalatedComplainController
)

router.get(
  '/complain/report/data',
  isAuth,
  complainController.getComplainReportDataAPI
)

//This route is for dashboard
router.get('/dashboard', isAuth, dashboardController.getDashboardDataAPI)

//This route is for notice
router.get('/notice', isAuth, noticeController.getNoticeAPIController)
router.get('/notice/create', isAuth, noticeController.createNoticeAPI)
router.post(
  '/notice',
  isAuth,
  imageNoticeUpload('photo'),
  noticeController.postNoticeController
)
router.put(
  '/notice/update/:id',
  isAuth,
  imageNoticeUpload('photo'),
  noticeController.updateNoticeAPIController
)

//This route is for event
router.get('/event', isAuth, eventController.getEventAPIController)
router.get('/event/create', isAuth, eventController.createEventController)
router.post(
  '/event',
  isAuth,
  imageEventUpload('photo'),
  eventController.postEventControllerAPI
)
router.put(
  '/event/update/:id',
  isAuth,
  imageEventUpload('photo'),
  eventController.updateEventControllerAPI
)

//This route is for maintenance
router.get(
  '/maintenance-setting',
  isAuth,
  maintenanceController.getMaintenanceAPIController
)
router.get(
  '/maintenance-setting/data/create',
  isAuth,
  maintenanceController.createApartmentTypeController
)
router.post(
  '/maintenance-setting/:type',
  isAuth,
  maintenanceController.postMaintenanceAPIController
)

//This route is for property type
router.get('/property-type', isAuth, propertyTypeController.getPropertyType)
router.post('/property-type', isAuth, propertyTypeController.postType)
router.put('/property-type/:id', isAuth, propertyTypeController.updateType)

//This route is for ticket type
router.get('/ticket-type', isAuth, ticketTypeController.getTicketType)
router.post('/ticket-type', isAuth, ticketTypeController.postType)
router.put('/ticket-type/:id', isAuth, ticketTypeController.updateType)

//This route is for visitor type
router.get('/visitor-type', isAuth, visitorTypeController.getVisitorType)
router.post('/visitor-type', isAuth, visitorTypeController.postType)
router.put('/visitor-type/:id', isAuth, visitorTypeController.updateType)

//This route is for payment report
router.get(
  '/graph/payment/report/:type',
  isAuth,
  reportController.getGraphPaymentReport
)
router.get(
  '/table/payment/report/:start/:end/:type',
  isAuth,
  reportController.getTablePaymentReport
)

//This route is for financial report
router.get(
  '/table/financial/report/:start/:end/:type',
  isAuth,
  reportController.getFinancialReport
)

//This route is for tenant
router.get('/tenant', isAuth, tenantController.getTenantAPIController)
router.get(
  '/tenant/create/data',
  isAuth,
  tenantController.getTenantCreateAPIController
)
router.get('/tenant/edit/:id', isAuth, tenantController.getEditTenantAPI)
router.post(
  '/tenant',
  isAuth,
  imageUpload('photo'),
  tenantController.postTenantAPIController
)
router.put(
  '/tenant/update/:id',
  imageUpload('photo'),
  isAuth,
  tenantController.putTenantController
)

//THis is the route for admin push notification
router.get(
  '/user/push/notification',
  isAuth,
  panicAlertController.getPanicALertAPI
)

router.get('/user/push/create', isAuth, panicAlertController.getPanicCreateAPI)
router.post(
  '/user/push/notification',
  isAuth,
  panicAlertController.postPanicController
)

//This is the router for sla config
router.get(
  '/sla/config/data',
  isAuth,
  slaConfigController.getSLAConfigController
)
router.post(
  '/sla/post/data',
  isAuth,
  slaConfigController.postSLABreachController
)

//This is the route for sla report
router.get(
  '/sla/config/report',
  isAuth,
  reportController.getSLAReportController
)

//This is route for escalation
router.get(
  '/escalation/data',
  isAuth,
  complainController.getEscalatedComplainController
)

//This is the route for amenities
router.get(
  '/amenity/fetch/data',
  isAuth,
  amenityController.getAmenityAPIController
)
router.post(
  '/amenity/post/data',
  isAuth,
  amenityController.postAmenityAPIController
)
router.put(
  '/amenity/put/data/:id',
  isAuth,
  amenityController.putAmenityAPIController
)

//This is the route for amenity booking
router.get(
  '/amenity/booking/list',
  isAuth,
  amenityController.getAmenityBookingListController
)
router.get(
  '/amenity/booking/create',
  isAuth,
  amenityController.getCreateAmenityBookingController
)
router.post(
  '/amenity/booking/data/store',
  isAuth,
  amenityController.postAmenityBookingController
)
router.put(
  '/amenity/booking/data/update/:id',
  isAuth,
  amenityController.putAmenityBookingController
)

//This is the route for vendor
router.get('/vendor/log/data', isAuth, vendorController.getVendorAPIController)
router.post(
  '/vendor/post/data',
  isAuth,
  vendorController.postVendorAPIController
)
router.put(
  '/vendor/update/data/:id',
  isAuth,
  vendorController.putVendorAPIController
)

//This is the route for category controller
router.get(
  '/location-category/log/data',
  isAuth,
  locationCategoryController.getLocationCategoryController
)
router.post(
  '/asset/category/post/data',
  isAuth,
  locationCategoryController.postCategoryController
)
router.put(
  '/asset/category/put/data/:id',
  isAuth,
  locationCategoryController.putCategoryController
)

//This is the route for asset location
router.post(
  '/asset/location/post/data',
  isAuth,
  locationCategoryController.postLocationController
)
router.put(
  '/asset/location/put/data/:id',
  isAuth,
  locationCategoryController.putLocationController
)

//This is the route for asset
router.get('/asset/fetch/data', isAuth, assetController?.getAssetAPIController)
router.post('/asset/save/data', isAuth, assetController.postAssetAPIController)
router.put(
  '/asset/update/data/:id',
  isAuth,
  assetController.putAssetAPIController
)

//THis is the route for amc
router.get('/amc/fetch/data', isAuth, amcAPIController.getAMCAPIController)
router.post('/amc/save/data', isAuth, amcAPIController.postAMCController)
router.put('/amc/update/data/:id', isAuth, amcAPIController.putAMCController)

//This route is for inspection template
router.get(
  '/inspection/template/data',
  isAuth,
  inspectionController.getInpectionTemplateData
)
router.post(
  '/inspection/template/save/data',
  isAuth,
  inspectionController.postInspectionTemplateController
)
router.put(
  '/inspection/template/update/data/:id',
  isAuth,
  inspectionController.putInspectionTemplateController
)

//This is the route for inspection
router.get(
  '/inspection-schedule/fetch/data',
  isAuth,
  inspectionScheduleController.getInspectionScheduleAPI
)
router.post(
  '/inspection-schedule/save',
  isAuth,
  inspectionScheduleController.postInspectionScheduleController
)
router.put(
  '/inspection-schedule/update/:id',
  isAuth,
  inspectionScheduleController.putInspectionScheduleController
)

//This is the route for document
router.get('/document/fetch/data', isAuth, documentController.getDocument)
router.post(
  '/document/save/data',
  isAuth,
  documentUpload.array('documents', 20), // 'documents' matches form payload key, max 20 files
  documentController.postDocument
)
router.put(
  '/document/update/data/:id',
  isAuth,
  documentUpload.array('documents', 20),
  documentController.putDocument
)

module.exports = router
