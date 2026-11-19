const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const unzipper = require('unzipper');

/**
 * Creates a multer upload instance with custom allowed file types,
 * and automatically extracts PDF page count to `req.pdfPageCount`.
 *
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @param {string} directory - Folder to save uploaded files (default: 'uploads/')
 * @param {number} maxSizeMB - Max file size in MB (default: 5)
 * @returns Middleware array: [multerMiddleware, pageCountMiddleware]
 */

function createUpload(allowedTypes, directory = 'uploads/', maxSizeMB = 5, fieldRules = {}) {
  const uploadPath = `/public/${directory}`;
  const absPath = path.join(__dirname, '..', uploadPath);

  if (!fs.existsSync(absPath)) {
    fs.mkdirSync(absPath, { recursive: true });
  }

  const isZip = (mime) =>
    mime === 'application/zip' || mime === 'application/x-zip-compressed';

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, absPath),
    filename: (req, file, cb) => {
      const uniqueName = isZip(file.mimetype)
        ? generateCustomId() + '.zip'
        : Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
      cb(null, uniqueName);
    }
  });

  const fileFilter = (req, file, cb) => {
    const rule = fieldRules[file.fieldname];
    const types = rule?.mimeTypes || allowedTypes;
    const exts = rule?.extensions; // optional
    const ext = path.extname(file.originalname).toLowerCase();

    const mimeOk = types.includes(file.mimetype);
    const extOk = !exts || exts.includes(ext);

    if (mimeOk && extOk) return cb(null, true);

    const err = new Error(`Invalid file type for "${file.fieldname}"`);
    err.status = 400;
    cb(err, false);
  };

  const upload = multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter
  });

  // Normalizes req.file / req.files (array or object) into one flat array
  const collectFiles = (req) => {
    if (req.file) return [req.file];
    if (Array.isArray(req.files)) return req.files;
    if (req.files && typeof req.files === 'object') {
      return Object.values(req.files).flat();
    }
    return [];
  };

  // Post-processes every uploaded file (zip extraction, PDF page count)
  const processFiles = async (req, res, next) => {
    try {
      const files = collectFiles(req);
      if (!files.length) return next();

      for (const file of files) {
        const fullPath = path.join(absPath, file.filename);
        file.relativePath = `${directory}/${file.filename}`;

        if (isZip(file.mimetype)) {
          const extractFolder = fullPath.replace(/\.zip$/, '');
          fs.mkdirSync(extractFolder, { recursive: true });
          await fs.createReadStream(fullPath)
            .pipe(unzipper.Extract({ path: extractFolder }))
            .promise();
          file.extractedPath = `${directory}/${file.filename.replace(/\.zip$/, '')}`;
        }

        if (file.mimetype === 'application/pdf') {
          try {
            const pdfData = await pdfParse(fs.readFileSync(fullPath));
            file.pdfPageCount = pdfData.numpages;
          } catch (err) {
            // A PDF that can't be parsed shouldn't block the upload
            console.error('PDF parse error:', file.originalname, err.message);
          }
        }
      }

      // Backward compatibility for single-file routes
      if (req.file) {
        req.uploadDir = req.file.relativePath;
        if (req.file.extractedPath) req.extractedPath = req.file.extractedPath;
        if (req.file.pdfPageCount !== undefined) req.pdfPageCount = req.file.pdfPageCount;
      }

      next();
    } catch (err) {
      console.error('File processing error:', err);
      next(err);
    }
  };

  const setPath = (req, res, next) => {
    req.uploadPath = directory;
    next();
  };

  return {
    // One file:               .middleware('photo')
    middleware: (fieldName = 'file') => [setPath, upload.single(fieldName), processFiles],

    // Several named fields:   .fields([{ name: 'photo', maxCount: 1 }, { name: 'kycFiles', maxCount: 20 }])
    fields: (fieldsConfig) => [setPath, upload.fields(fieldsConfig), processFiles],

    // Many files, one field:  .array('files', 10)
    array: (fieldName, maxCount = 10) => [setPath, upload.array(fieldName, maxCount), processFiles],

    // Accept any field name:  .any()
    any: () => [setPath, upload.any(), processFiles],

    uploadPath
  };
}

function generateCustomId(segmentCount = 4, segmentLength = 4) {
  const randomSegment = () =>
    Array.from({ length: segmentLength }, () =>
      String.fromCharCode(97 + Math.floor(Math.random() * 26)) // a-z
    ).join('');

  return Array.from({ length: segmentCount }, randomSegment).join('-');
}

module.exports = createUpload;
