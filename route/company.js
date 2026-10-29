const express = require('express')
const router = express.Router()
const isAuth = require('../middleware/is-auth')
const appMenuController = require('../controller/Company/AppMenuController')
const roleController = require('../controller/Company/RoleAPIController')
const cameraController = require('../controller/Company/CameraController')
const billController = require('../controller/Company/BillController')
const paymentController = require('../controller/Company/PaymentController')
const userBillController = require('../controller/Company/UserBillController')
const dashboardController = require('../controller/Company/DashboardController')
const noticeController = require('../controller/Company/NoticeController')
const eventController = require('../controller/Company/EventController')
const maintenanceController = require('../controller/Company/MaintenanceController')
const leadAPIController = require("../controller/Company/LeadsController")
const propertyAPIController = require("../controller/Company/PropertyAPIController")
const amenityTypeAPIController = require("../controller/Company/Setting/AmenityTypeAPIController")
const propertyTypeController = require('../controller/Company/Setting/PropertyTypeAPIController')
const assetCategoryController = require("../controller/Company/Setting/AssetCategoryAPIController")
const propertyCategoryController = require('../controller/Company/Setting/PropertyCategoryAPIController')
const propertyGroupController = require('../controller/Company/Setting/PropertyGroupAPIController')
const leadDocumentTypeController = require("../controller/Company/Setting/LeadDocumentTypeAPIConttoller")
const reportController = require('../controller/Company/ReportController')
const tenantController = require('../controller/Company/TenantAPIController')
const panicAlertController = require('../controller/Company/PanicAlertAPIController')
const slaConfigController = require('../controller/Company/SLAConfigController')
const vendorController = require('../controller/Company/VendorAPIController')
const vendorCategoryController = require("../controller/Company/Setting/VendorCategoryAPIController")
const locationCategoryController = require('../controller/Company/LocationCategoryController')
const assetController = require('../controller/Company/AssetAPIController')
const inspectionController = require('../controller/Company/InspectionAPIController')
const contactCategoryAPIController = require("../controller/Company/Setting/ContactCategoryAPIController")
const inspectionScheduleController = require('../controller/Company/InspectionScheduleAPIController')
const amenityController = require('../controller/Company/AmenityAPIController')
const LeadSourceAPIController = require("../controller/Company/Setting/LeadSourceAPIController")
const documentController = require('../controller/Company/DocumentAPIController')
const LeadPurposeAPIController = require("../controller/Company/Setting/LeadPurposeAPIController")
const ContactMethodAPIController = require("../controller/Company/Setting/ContactMethodAPIController")
const contactAPIController = require("../controller/Company/ContactAPIController")
const LeadPropertyController = require("../controller/Company/Setting/LeadPropertyTypeAPIController")
const LeadTypeAPIController = require("../controller/Company/Setting/LeadTypeAPIController")
const DepartmentController = require("../controller/Company/DepartmentAPIController")
const ContractAPIController = require("../controller/Company/ContractAPIController")
const InvoiceAPIController = require("../controller/Company/InvoiceAPIController")
const PaymentAPIController = require("../controller/Company/PaymentAPIController")
const ContractDocumentTypeController = require("../controller/Company/Setting/ContractDocumentTypeController")
const LeadMoveInLineController = require("../controller/Company/Setting/LeadMoveInTimelineAPIController")
const LeadStatusAPIController = require("../controller/Company/Setting/LeadStatusAPIController")

const createUpload = require('../util/upload')
const createDocUpload = require('../util/uploadDocFile')
const { uploadField } = require("../util/propertyMulter")
const createAmenityUpload = require("../util/uploadAmenity")

const { uploadAsset } = require("../util/uploadAsset")

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

const IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif',
  'image/webp', 'image/bmp', 'image/tiff'
];
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tif', '.tiff'];
const DOC_TYPES_ALLOWED = [
  ...IMAGE_TYPES,
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const contactUpload = createUpload(
  [...IMAGE_TYPES], // default for any other field
  'contacts',
  20, // MB per file
  {
    photo: {
      mimeTypes: IMAGE_TYPES,
      extensions: IMAGE_EXTS,
    },
    kycFiles: {
      mimeTypes: [
        ...IMAGE_TYPES,
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      ],
      extensions: [...IMAGE_EXTS, '.pdf', '.doc', '.docx'],
    },
  }
);

const invoiceUpload = createUpload(
  DOC_TYPES_ALLOWED,
  'invoices', // Folder inside /public
  30,         // MB per file
  {
    files: {
      mimeTypes: DOC_TYPES_ALLOWED,
      extensions: [...IMAGE_EXTS, '.pdf', '.doc', '.docx'],
    },
  }
)

const contractUpload = createUpload(
  DOC_TYPES_ALLOWED,
  'contracts',
  30, // MB per file, matches the frontend limit
  {
    files: {
      mimeTypes: DOC_TYPES_ALLOWED,
      extensions: [...IMAGE_EXTS, '.pdf', '.doc', '.docx'],
    },
  }
);

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

const { middleware: vendorUpload } = createUpload(
  [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ], // allowed types
  'uploads/vendor' // directory inside /public/
)

const { middleware: paymentUpload } = createUpload(
  [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  'uploads/payment'
)

const { middleware: imageUpload } = createUpload(
  ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
  'uploads/images' // directory inside /public/
)

const { middleware: imageLeadUpload } = createUpload(
  ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
  'uploads/leads' // directory inside /public/
)

const { middleware: imageNoticeUpload } = createUpload(
  ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
  'uploads/notice' // directory inside /public/
)

const { middleware: imageEventUpload } = createUpload(
  ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
  'uploads/event' // directory inside /public/
)

const contactFiles = contactUpload.fields([
  { name: "photo", maxCount: 1 },
  { name: "kycFiles", maxCount: 20 },
]);

router.get('/app/menu/label/listing/:sn', isAuth, appMenuController.getAppMenuCompanyListAPI)
router.post('/app/menu/label/listing/:sn', isAuth, appMenuController.postCompanyMenuListAPI)

//This route is for role
router.get('/role', isAuth, roleController.getRoleAPI)
router.get('/role/create', isAuth, roleController.createRoleAPI)
router.post('/role', isAuth, roleController.postRoleAPI)
router.put('/role/:roleId', isAuth, roleController.putRoleAPI)

//This route is for camera
router.get('/camera', isAuth, cameraController.getCameraController)

//This route is for Bill
router.get('/bill/data/:type', isAuth, billController.getBillData)
router.get('/bill/create', isAuth, billController.getCreateBill)
router.post('/bill', isAuth, ...activityUpload.middleware('image'), billController.postBillController)
router.put('/bill/update/:billId', isAuth, ...activityUpload.middleware('image'), billController.putBillController)

//This route is for payment
router.get('/payment', isAuth, paymentController.getPaymentController)
router.post('/payment', isAuth, paymentController.postPaymentController)

//This route is for User Bill
router.get('/user/bill/:billId', isAuth, userBillController.getUserBillController)
router.post('/user/bill/data/payment', isAuth, userBillController.postUserBillController)

//This route is for dashboard
router.get('/dashboard', isAuth, dashboardController.getDashboardDataAPI)

//This route is for notice
router.get('/notice', isAuth, noticeController.getNoticeAPIController)
router.get('/notice/create', isAuth, noticeController.createNoticeAPI)
router.post('/notice', isAuth, imageNoticeUpload('photo'), noticeController.postNoticeController)
router.put('/notice/update/:id', isAuth, imageNoticeUpload('photo'), noticeController.updateNoticeAPIController)

//This route is for event
router.get('/event', isAuth, eventController.getEventAPIController)
router.get('/event/create', isAuth, eventController.createEventController)
router.post('/event', isAuth, imageEventUpload('photo'), eventController.postEventControllerAPI)
router.put('/event/update/:id', isAuth, imageEventUpload('photo'), eventController.updateEventControllerAPI)

//This route is for maintenance
router.get('/maintenance-setting', isAuth, maintenanceController.getMaintenanceAPIController)
router.get('/maintenance-setting/data/create', isAuth, maintenanceController.createApartmentTypeController)
router.post('/maintenance-setting/:type', isAuth, maintenanceController.postMaintenanceAPIController)

//This route is for property type
router.get('/property-type', isAuth, propertyTypeController.getPropertyType)
router.post('/property-type', isAuth, propertyTypeController.postType)
router.put('/property-type/:id', isAuth, propertyTypeController.updateType)

//This route is for asset category
router.get('/asset-category', isAuth, assetCategoryController.getAssetCategory)
router.post('/asset-category', isAuth, assetCategoryController.postType)
router.put('/asset-category/:id', isAuth, assetCategoryController.updateType)


//This route is for amenity type
router.get('/amenity-type', isAuth, amenityTypeAPIController.getAmenityType)
router.post('/amenity-type', isAuth, amenityTypeAPIController.postType)
router.put('/amenity-type/:id', isAuth, amenityTypeAPIController.updateType)

//This route is for lead status
router.get('/lead-status', isAuth, LeadStatusAPIController?.getLeadStatus)
router.post('/lead-status', isAuth, LeadStatusAPIController?.postType)
router.put('/lead-status/:id', isAuth, LeadStatusAPIController.updateType)

//This route is for lead source
router.get('/lead-source', isAuth, LeadSourceAPIController.getLeadSource)
router.post('/lead-source', isAuth, LeadSourceAPIController.postType)
router.put('/lead-source/:id', isAuth, LeadSourceAPIController.updateType)

//This route is for lead type
router.get('/lead-type', isAuth, LeadTypeAPIController?.getLeadType)
router.post('/lead-type', isAuth, LeadTypeAPIController.postType)
router.put('/lead-type/:id', isAuth, LeadTypeAPIController.updateType)

//This route is for contract document type  
router.get('/contract-document-type', isAuth, ContractDocumentTypeController?.getContractDocumentType)
router.post('/contract-document-type', isAuth, ContractDocumentTypeController.postType)
router.put('/contract-document-type/:id', isAuth, ContractDocumentTypeController.updateType)

//This route is for lead document type
router.get('/lead-document-type', isAuth, leadDocumentTypeController?.getLeadDocumentType)
router.post('/lead-document-type', isAuth, leadDocumentTypeController?.postType)
router.put('/lead-document-type/:id', isAuth, leadDocumentTypeController.updateType)

router.get('/lead-property-type', isAuth, LeadPropertyController?.getLeadType)
router.post('/lead-property-type', isAuth, LeadPropertyController.postType)
router.put('/lead-property-type/:id', isAuth, LeadPropertyController.updateType)

router.get('/lead-move-in-timeline', isAuth, LeadMoveInLineController?.getLeadMoveInLine)
router.post('/lead-move-in-timeline', isAuth, LeadMoveInLineController?.postType)
router.put('/lead-move-in-timeline/:id', isAuth, LeadMoveInLineController.updateType)

//This route is for lead purpose
router.get('/lead-purpose', isAuth, LeadPurposeAPIController.getLeadPurpose)
router.post('/lead-purpose', isAuth, LeadPurposeAPIController.postType)
router.put('/lead-purpose/:id', isAuth, LeadPurposeAPIController.updateType)

//This route is for contact method
router.get('/contact-method', isAuth, ContactMethodAPIController.getConatactMethod)
router.post('/contact-method', isAuth, ContactMethodAPIController.postType)
router.put('/contact-method/:id', isAuth, ContactMethodAPIController.updateType)

//This route is for contact category
router.get('/contact-category', isAuth, contactCategoryAPIController?.getContactCategoryAPIController)
router.post('/contact-category', isAuth, contactCategoryAPIController?.postContactCategoryAPIController)
router.put('/contact-category/:id', isAuth, contactCategoryAPIController?.putContactCategoryAPIController)

router.get('/vendor-category', isAuth, vendorCategoryController?.getVendorCategory)
router.post('/vendor-category', isAuth, vendorCategoryController.postType)
router.put('/vendor-category/:id', isAuth, vendorCategoryController.updateType)

router.get('/property-category', isAuth, propertyCategoryController.getPropertyCategory)
router.post('/property-category', isAuth, propertyCategoryController.postCategory)
router.put('/property-category/:id', isAuth, propertyCategoryController.updateCategory)

router.get('/property-group', isAuth, propertyGroupController.getPropertyGroup)
router.post('/property-group', isAuth, propertyGroupController.postPropertyGroup)
router.put('/property-group/:id', isAuth, propertyGroupController.updatePropertyGroup)

//This route is for payment report
router.get('/graph/payment/report/:type', isAuth, reportController.getGraphPaymentReport)
router.get('/table/payment/report/:start/:end/:type', isAuth, reportController.getTablePaymentReport)

//This route is for financial report
router.get('/table/financial/report/:start/:end/:type', isAuth, reportController.getFinancialReport)

//This route is for tenant
router.get('/tenant', isAuth, tenantController.getTenantAPIController)
router.get('/tenant/create/data', isAuth, tenantController.getTenantCreateAPIController)
router.get('/tenant/edit/:id', isAuth, tenantController.getEditTenantAPI)
router.post('/tenant', isAuth, imageUpload('photo'), tenantController.postTenantAPIController)
router.put('/tenant/update/:id', imageUpload('photo'), isAuth, tenantController.putTenantController)

//THis is the route for admin push notification
router.get('/user/push/notification', isAuth, panicAlertController.getPanicALertAPI)

router.get('/user/push/create', isAuth, panicAlertController.getPanicCreateAPI)
router.post('/user/push/notification', isAuth, panicAlertController.postPanicController)

//This is the router for sla config
router.get('/sla/config/data', isAuth, slaConfigController.getSLAConfigController)
router.post('/sla/post/data', isAuth, slaConfigController.postSLABreachController)

//This is the route for sla report
router.get('/sla/config/report', isAuth, reportController.getSLAReportController)

//This is the route for amenities
router.get('/amenity/fetch/data', isAuth, amenityController.getAmenityAPIController)
router.get('/amenity/create/data', isAuth, amenityController.getAmenityCreateAPIController)
router.get("/amenity/edit/data/:id", isAuth, amenityController?.getEditAmenityAPIController)
router.get("/amenity/toggle/data/:id", isAuth, amenityController.getAmenityToggleAPIController)
router.post('/amenity/post/data', isAuth, createAmenityUpload, amenityController.postAmenityAPIController)
router.put('/amenity/put/data/:id', isAuth, createAmenityUpload, amenityController.putAmenityAPIController)

//This is the route for amenity booking
router.get('/amenity/booking/list', isAuth, amenityController.getAmenityBookingListController)
router.post('/amenity/booking/data/store', isAuth, amenityController.postAmenityBookingController)

//This is the route for vendor
router.get('/vendor/log/data', isAuth, vendorController.getVendorAPIController)
router.get("/vendor/create/data", isAuth, vendorController.getVendorCreateAPIController)
router.get("/vendor/edit/data/:id", isAuth, vendorController.getVendorEditData)
router.post('/vendor/save/data', isAuth, vendorUpload('image'), vendorController.postVendorAPIController)
router.post('/vendor/update/data/:id', isAuth, vendorUpload('image'), vendorController.putVendorAPIController)

//This is the route for category controller
router.get('/location-category/log/data', isAuth, locationCategoryController.getLocationCategoryController)

//This is the route for asset
router.get('/asset/fetch/data', isAuth, assetController?.getAssetAPIController)
router.get("/asset/create/data", isAuth, assetController.getAssetCreateData)
router.get("/asset/edit/data/:id", isAuth, assetController.getAssetEditData)
router.post('/asset/save/data', isAuth, uploadAsset, assetController.postAssetAPIController)
router.post("/asset/update/data/:id", isAuth, uploadAsset, assetController.putAssetAPIController)

//This route is for inspection template
router.get('/inspection/template/data', isAuth, inspectionController.getInpectionTemplateData)
router.post('/inspection/template/save/data', isAuth, inspectionController.postInspectionTemplateController)
router.put('/inspection/template/update/data/:id', isAuth, inspectionController.putInspectionTemplateController)

//This is the route for inspection
router.get('/inspection-schedule/fetch/data', isAuth, inspectionScheduleController.getInspectionScheduleAPI)
router.post('/inspection-schedule/save', isAuth, inspectionScheduleController.postInspectionScheduleController)
router.put('/inspection-schedule/update/:id', isAuth, inspectionScheduleController.putInspectionScheduleController)

//This is the route for document
router.get('/document/fetch/data', isAuth, documentController.getDocument)
router.post('/document/save/data', isAuth, documentUpload.array('documents', 20), documentController.postDocument)
router.put('/document/update/data/:id', isAuth, documentUpload.array('documents', 20), documentController.putDocument)

//This route is for property management
router.get("/property/fetch/data", isAuth, propertyAPIController.getPropertyDataAPIController)
router.get("/property/edit/data/:id", isAuth, uploadField, propertyAPIController?.getPropertyEditDataAPIController)
router.get("/property/create/data", isAuth, propertyAPIController?.getCreateFormAPIController)
router.post("/property/save/data", isAuth, uploadField, propertyAPIController?.postPropertyAPIController)
router.post("/property/update/data/:id", isAuth, uploadField, propertyAPIController?.putPropertyAPIController)

//This route is for contact
router.get('/contact/fetch/data', isAuth, contactAPIController.getContactAPIController)
router.post("/contact/save/data", isAuth, ...contactFiles, contactAPIController.postContactAPIController);
router.get('/contact/create/data', isAuth, contactAPIController.getContactCreateAPIController)
router.get('/contact/edit/data/:id', isAuth, contactAPIController.getContactEditAPIController)
router.post("/contact/update/data/:id", isAuth, ...contactFiles, contactAPIController.putContactAPIController);

//This route is for lead controller
router.get('/contacts/search', isAuth, leadAPIController.getSearchData)
router.get('/leads/data/:view', isAuth, leadAPIController.getLeadList)
router.get("/leads/create/data", isAuth, leadAPIController.getLeadCreateData)
router.post('/leads/save/data', isAuth, imageLeadUpload("photo"), leadAPIController.postCreateLead)

//This route is for department
router.get("/department/log/data", isAuth, DepartmentController?.getDepartmentAPI)
router.get("/department/create/data", isAuth, DepartmentController.getDepartmentCreateData)
router.get("/department/edit/data/:id", isAuth, DepartmentController?.getDepartmentEditData)
router.post("/department/save/data", isAuth, DepartmentController.postDepartmentAPI)
router.post("/department/update/data/:id", isAuth, DepartmentController.putDepartmentAPI)

//This is the route for contract document type
router.get("/contract/fetch/data", isAuth, ContractAPIController.getContractData)
router.get("/contract/create/data", isAuth, ContractAPIController.getContractCreateData)
router.post("/contract/create", isAuth, ContractAPIController.postCreateAPIController);
router.post("/contract/:id/tenant", isAuth, ContractAPIController.setContractTenantAPIController);
router.post("/contract/:id/properties", isAuth, ContractAPIController.setContractPropertyAPIController);
router.post("/contract/:id/amenities", isAuth, ContractAPIController.setContractAmenityAPIController);
router.post("/contract/:id/details", isAuth, ContractAPIController.upsertContractDetailAPIController);
router.post("/contract/:id/details/delete", isAuth, ContractAPIController.deleteContractDetailAPIController);
router.post("/contract/:id/documents", isAuth, contractUpload.array("files", 10), ContractAPIController.addContractDocumentAPIController);
router.post("/contract/:id/documents/delete", isAuth, ContractAPIController.deleteContractDocumentAPIController);
router.post("/contract/:id/save", isAuth, ContractAPIController.saveContractAPIController);
router.post("/contract/:id/submit", isAuth, ContractAPIController.submitContractAPIController);
router.post("/contract/:id/delete", isAuth, ContractAPIController.removeContractAPIController);
router.get("/contract/:id", isAuth, ContractAPIController.getContractOneAPI);

//This is the route for invoice
router.get("/invoice/get/data", isAuth, InvoiceAPIController.getInvoiceData)
router.get("/invoice/create/data", isAuth, InvoiceAPIController.getInvoiceCreateData)
router.get("/invoice/edit/data/:id", isAuth, InvoiceAPIController.getInvoiceEditData)
router.post("/invoice/save/data", isAuth, invoiceUpload.array("files", 10), InvoiceAPIController.postInvoiceAPIController)
router.post("/invoice/update/data/:id", isAuth, invoiceUpload.array("files", 10), InvoiceAPIController.updateInvoiceAPIController)
router.post("/invoice/delete/data/:id", isAuth, InvoiceAPIController.deleteInvoiceAPIController)

//THis is the router for payment
router.get("/payment/get/data", isAuth, PaymentAPIController.getPaymentData)
router.get("/payment/create/data", isAuth, PaymentAPIController.getPaymentCreateAPI)
router.get("/payment/edit/data/:id", isAuth, PaymentAPIController.getPaymentEditAPI)
router.post("/payment/save/data", isAuth, paymentUpload("documents"), PaymentAPIController.savePaymentAPIController)

module.exports = router
