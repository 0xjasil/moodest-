import cloudinary from '@/lib/cloudinary';

const uploadPhoto = async (photoFile: File | null) => {
    if (!photoFile) {
        return ''; // Return an empty string if no file is provided
    }

    // Read the file as a buffer
    const fileBuffer = await photoFile.arrayBuffer();
    const base64 = Buffer.from(fileBuffer).toString('base64');

    // Upload the base64 string to Cloudinary
    try {
        const uploadResult = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64}`, {
            folder: 'Deco moja', // Optional: organize your uploads
        });
        console.log('Cloudinary upload success:', uploadResult.secure_url);
        return uploadResult.secure_url; 
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

export default uploadPhoto;