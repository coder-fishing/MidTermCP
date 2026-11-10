import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';

type CloudinaryUploadResponse = {
  secure_url?: string;
  error?: { message?: string };
};

export async function uploadAvatar(asset: ImagePickerAsset): Promise<string> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    throw new Error('Thiếu Cloudinary cloud name hoặc unsigned upload preset.');
  }

  const formData = new FormData();
  formData.append('upload_preset', uploadPreset);

  let file: Blob;
  if (Platform.OS === 'web') {
    if (!asset.file) {
      throw new Error('Không đọc được file ảnh đã chọn trên trình duyệt.');
    }
    file = asset.file;
  } else {
    file = new File(asset.uri);
  }
  formData.append('file', file, asset.fileName ?? 'avatar.jpg');

  const response = await expoFetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    { method: 'POST', body: formData },
  );
  const result = (await response.json()) as CloudinaryUploadResponse;

  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message ?? 'Không tải được ảnh lên Cloudinary.');
  }

  return result.secure_url;
}
