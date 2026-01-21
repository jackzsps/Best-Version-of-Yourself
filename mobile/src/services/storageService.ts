import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

/**
 * Uploads an image from local URI to Firebase Storage.
 * Uses native bindings for optimal performance on mobile devices.
 * 
 * @param uri The local file path (e.g. file://... or content://...)
 * @param userId The current user's ID
 * @returns The public download URL
 */
export const uploadImage = async (uri: string, userId: string): Promise<string> => {
  try {
    // Generate a unique filename based on timestamp
    const timestamp = Date.now();
    // Simple extension extraction, default to jpg
    const extension = uri.split('.').pop() || 'jpg';
    const filename = `${timestamp}.${extension}`;
    
    // Path structure matches web: users/{userId}/images/{filename}
    const storagePath = `users/${userId}/images/${filename}`;
    
    const reference = storage().ref(storagePath);

    // Handle iOS specific path issues if necessary
    let uploadUri = uri;
    if (Platform.OS === 'ios' && !uploadUri.startsWith('file://') && !uploadUri.startsWith('ph://')) {
        uploadUri = `file://${uploadUri}`;
    }

    // uploadFile is preferred over putString(base64) for performance
    await reference.putFile(uploadUri);

    const url = await reference.getDownloadURL();
    return url;
  } catch (error) {
    console.error('Storage upload error:', error);
    throw new Error('Image upload failed. Please try again.');
  }
};
