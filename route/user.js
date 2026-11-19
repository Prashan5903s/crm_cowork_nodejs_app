const express = require('express')
const router = express.Router()

//  Middleware
const isAuth = require('../middleware/is-auth')

//  Controllers
const BillController = require('../controller/User/BillController')
const ComplainController = require('../controller/User/MyComplainController')
const complainResolvedController = require('../controller/User/ComplainResolvedController')
const visitorController = require('../controller/User/VisitorController')
const dashboardController = require('../controller/User/DashboardController')
const noticeController = require('../controller/User/NoticeController')
const eventController = require('../controller/User/EventController')
const appConfigController = require('../controller/User/AppConfigAPIController')
const profileController = require('../controller/User/profileAPIController')
const authController = require('../controller/User/AuthController')
const termsPolicyController = require('../controller/User/TermsPolicyController')
const panicController = require('../controller/User/PanicAPIController')
const alertController = require('../controller/User/AlertAPIController')
const visitorValidation = require('../validation/VisitorController')
const escalationController = require('../controller/User/EscalationAPIController')
const AmenityAPIController = require('../controller/User/AmenityAPIController')
const InspectionResultController = require('../controller/User/InspectionResultAPIController')
const DocumentAPIController = require('../controller/User/DocumentAPIController')
const parcelController = require('../controller/User/ParcelAPIController')

const createUpload = require('../util/upload')

const parcelValidation = require('../validation/ParcelValidation')

const { middleware: imageUpload } = createUpload(
  ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
  'uploads/images' // directory inside /public/
)

const { middleware: imageComplainUpload } = createUpload(
  ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
  'uploads/complain' // directory inside /public/
)

const { middleware: imageVisitorUpload } = createUpload(
  ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
  'uploads/visitor' // directory inside /public/
)

// ==================== 💰 BILL ROUTES ====================
router.get('/my-bill/:type/:status', isAuth, BillController.getBillController)
router.get(
  '/bill/maintenance/data/:status',
  isAuth,
  BillController.getMaintenanceBill
)

// ✅ Generate or Download Invoice PDF
router.get(
  '/invoice/pdf/page/:invoiceNo',
  isAuth,
  BillController.downloadInvoicePDF
)

// ==================== 📢 COMPLAIN ROUTES ====================
router.get('/my-complain', isAuth, ComplainController.getMyComplainController)

router.get(
  '/my-user-complain/:status/:start/:end',
  isAuth,
  ComplainController.getMyComplainFilterController
)

router.post(
  '/my-complain',
  isAuth,
  imageComplainUpload('complain_img'),
  ComplainController.postComplainController
)

router.get(
  '/my-complain/data/create',
  isAuth,
  ComplainController.getCreateComplainController
)
router.delete(
  '/my-complain/:id',
  isAuth,
  ComplainController.deleteComplainController
)

// ==================== ✅ RESOLVED COMPLAIN ====================
router.get(
  '/complain/data/resolve',
  isAuth,
  complainResolvedController.getComplainResolvedController
)
router.post(
  '/complain/data/resolve',
  isAuth,
  complainResolvedController.postCompanyResolvedController
)

// ==================== 🚪 VISITOR ROUTES ====================
router.get('/visitor', isAuth, visitorController.getVisitorController)

router.get(
  '/user-visitor/:start/:end',
  isAuth,
  visitorController.getVisitorFilterController
)

router.get(
  '/visitor/otp/code/:otp',
  isAuth,
  visitorController.getVisitorHappyCode
)

router.post(
  '/visitor',
  isAuth,
  visitorValidation.postVisitor,
  imageVisitorUpload('photo'),
  visitorController.postVisitorController
)
router.get(
  '/visitor/create/data',
  isAuth,
  visitorController.createVisitorController
)
router.put(
  '/visitor/update/:id',
  isAuth,
  visitorValidation.postVisitor,
  imageVisitorUpload('photo'),
  visitorController.putVisitiorController
)
router.get(
  '/visitor/allow/gateIn/:status/:id',
  isAuth,
  visitorController.allowGateInFunc
)

router.get(
  '/visitor/user/exit/data/:id',
  isAuth,
  visitorController.getVisitorExitData
)

// ==================== 📊 DASHBOARD ====================
router.get('/dashboard', isAuth, dashboardController.getDashboardDataAPI)

// ==================== 📜 NOTICE ====================
router.get('/notice', isAuth, noticeController.getNoticeController)

// ==================== 🎉 EVENT ====================
router.get('/event', isAuth, eventController.getEventListAPIController)

// This route is for app config data
router.get(
  '/app/config/data',
  isAuth,
  appConfigController.getConfigAPIController
)

//This route is for profile
router.post(
  '/profile/user/data',
  isAuth,
  imageUpload('photo'),
  profileController.postProfileAPIController
)

//This route is for logout
router.get('/logout/data', isAuth, authController.getLogOutController)

//This route is for change password
router.post(
  '/change/password/data',
  isAuth,
  authController.changePasswordController
)

//This route is for profile
router.get('/profile/data', isAuth, authController.getUserProfileData)

//This route is for terms and policy
router.get(
  '/terms/policy/data',
  isAuth,
  termsPolicyController.getTermsPolicyController
)

router.post(
  '/change/profile/data/:status',
  isAuth,
  profileController.postProfileChangeDataController
)

router.get('/panic/notify/data', isAuth, panicController.getPanicNotify)

//This route is to send alert to security guard
router.get(
  '/send/security-guard/alert',
  isAuth,
  alertController.getAlertController
)

//This routes are for escalate
router.get(
  '/escalation/create/data',
  isAuth,
  escalationController.getEscalationCreate
)
router.post(
  '/escalate/post/data',
  isAuth,
  escalationController.postEscalateAPIController
)

//This is the route for review feedback
router.post(
  '/review/feedback/data',
  isAuth,
  ComplainController.postReviewFeedBackController
)

//This is the route for amenities
router.get(
  '/amenities/history',
  isAuth,
  AmenityAPIController.getAmenityAPIController
)

// This is the route for parcel
router.get('/parcel/data', isAuth, parcelController.getParcelAPIController)
router.get(
  '/parcel/create/data',
  isAuth,
  parcelController.getCreateAPIController
)
router.post(
  '/parcel/post/data',
  isAuth,
  parcelValidation.postParcelValidation,
  parcelController.postParcelAPIController
)

// Fixed: needs :id so req.params.id actually exists
router.put(
  '/parcel/:id/deliver',
  isAuth,
  parcelController.putParcelAPIController
)

// New: Leave at Gate now updates the DB instead of just local state
router.put(
  '/parcel/:id/leave-at-gate',
  isAuth,
  parcelController.leaveAtGateAPIController
)

//This is the route for resident parcel log
router.get(
  '/parcel/resident/log',
  isAuth,
  parcelController.getResidentParcelInfo
)

//This is the route for inspection result
router.get(
  '/inspection/result/data',
  isAuth,
  InspectionResultController.getInspectionResultAPI
)
router.post(
  '/inspection/save/data',
  isAuth,
  InspectionResultController.postInspectionResultAPI
)

//This route is for document
router.get(
  '/document/user/data',
  isAuth,
  DocumentAPIController.getDocumentAPIController
)

module.exports = router
