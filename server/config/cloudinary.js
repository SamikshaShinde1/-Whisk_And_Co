import { v2 as cloudinary } from 'cloudinary'

// Cloudinary stores the menu photos the admin uploads.
// The three keys live in server/.env. Without them the server still runs; only photo upload is turned off.
// (The keys are read when needed, not when this file loads, because .env is loaded after the imports.)
export function cloudinaryReady() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
}

// Sends a photo (held in memory) to Cloudinary and returns its https:// link.
// Big photos are shrunk to 1600px wide and compressed, so the website stays fast.
export function uploadImage(buffer) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'pastel-n-postery',
        resource_type: 'image',
        transformation: [{ width: 1600, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => (error ? reject(error) : resolve(result.secure_url)),
    )
    stream.end(buffer)
  })
}
