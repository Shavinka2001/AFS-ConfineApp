const express = require('express');
const multer = require('multer');
const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all upload routes
router.use(authMiddleware);

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Initialize Azure Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const containerName = process.env.AZURE_CONTAINER_NAME || 'confined-space-images';

// Ensure container exists
async function ensureContainer() {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    // Create container without public access (private)
    await containerClient.createIfNotExists();
    console.log(`Container "${containerName}" is ready.`);
  } catch (error) {
    console.error('Error creating container:', error);
  }
}

// Initialize container on startup
ensureContainer();

// Generate SAS URL for blob viewing
function generateSasUrl(blobClient) {
  try {
    // Create a SAS token that expires in 1 year (adjust as needed)
    const expiresOn = new Date();
    expiresOn.setFullYear(expiresOn.getFullYear() + 1);

    // Generate SAS token
    const sasOptions = {
      containerName: containerName,
      blobName: blobClient.name,
      permissions: BlobSASPermissions.parse("r"), // Read permission only
      expiresOn: expiresOn,
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      blobServiceClient.credential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  } catch (error) {
    console.error('Error generating SAS URL:', error);
    return blobClient.url; // Fallback to regular URL
  }
}

// Upload single image
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    const { orderId } = req.body;
    
    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const uniqueFileName = `${orderId || 'temp'}-${uuidv4()}.${fileExtension}`;
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Get blob client
    const blobClient = containerClient.getBlockBlobClient(uniqueFileName);
    
    // Upload file to Azure Blob Storage
    const uploadResponse = await blobClient.upload(
      req.file.buffer, 
      req.file.size, 
      {
        blobHTTPHeaders: {
          blobContentType: req.file.mimetype
        },
        metadata: {
          originalName: req.file.originalname,
          orderId: orderId || 'temp',
          uploadedAt: new Date().toISOString(),
          fileSize: req.file.size.toString()
        }
      }
    );

    // Get the URL of the uploaded blob with SAS token for viewing
    const sasUrl = generateSasUrl(blobClient);

    console.log('Image uploaded successfully:', {
      fileName: uniqueFileName,
      url: sasUrl,
      size: req.file.size
    });

    res.json({
      success: true,
      imageUrl: sasUrl,
      fileName: uniqueFileName,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

// Upload multiple images
router.post('/upload-images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image files provided' 
      });
    }

    const { orderId } = req.body;
    const uploadResults = [];

    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Upload each file
    for (const file of req.files) {
      try {
        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const uniqueFileName = `${orderId || 'temp'}-${uuidv4()}.${fileExtension}`;
        
        // Get blob client
        const blobClient = containerClient.getBlockBlobClient(uniqueFileName);
        
        // Upload file
        await blobClient.upload(
          file.buffer, 
          file.size, 
          {
            blobHTTPHeaders: {
              blobContentType: file.mimetype
            },
            metadata: {
              originalName: file.originalname,
              orderId: orderId || 'temp',
              uploadedAt: new Date().toISOString(),
              fileSize: file.size.toString()
            }
          }
        );

        uploadResults.push({
          success: true,
          imageUrl: generateSasUrl(blobClient),
          fileName: uniqueFileName,
          originalName: file.originalname,
          size: file.size
        });

      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
        uploadResults.push({
          success: false,
          originalName: file.originalname,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results: uploadResults,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

// Delete image
router.delete('/delete-image/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({ 
        success: false, 
        message: 'File name is required' 
      });
    }

    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Get blob client
    const blobClient = containerClient.getBlockBlobClient(fileName);
    
    // Delete the blob
    const deleteResponse = await blobClient.deleteIfExists();

    if (deleteResponse.succeeded) {
      res.json({
        success: true,
        message: 'Image deleted successfully',
        fileName: fileName
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found',
        fileName: fileName
      });
    }

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
});

// Get image info
router.get('/image-info/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;

    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Get blob client
    const blobClient = containerClient.getBlockBlobClient(fileName);
    
    // Get blob properties
    const properties = await blobClient.getProperties();

    res.json({
      success: true,
      fileName: fileName,
      url: generateSasUrl(blobClient),
      size: properties.contentLength,
      contentType: properties.contentType,
      lastModified: properties.lastModified,
      metadata: properties.metadata
    });

  } catch (error) {
    console.error('Error getting image info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get image info',
      error: error.message
    });
  }
});

module.exports = router;
