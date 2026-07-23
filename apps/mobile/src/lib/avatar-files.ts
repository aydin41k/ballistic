import { Directory, File, Paths } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

import type { AvatarUploadPayload } from '@/types';

const maxAvatarBytes = 5 * 1024 * 1024;

function getAvatarDirectory(): Directory {
  return new Directory(Paths.document, 'profile-photos');
}

function safeExtension(asset: ImagePickerAsset): string {
  const mimeExtension = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }[asset.mimeType ?? ''];
  if (mimeExtension) return mimeExtension;

  const fileExtension = asset.fileName?.split('.').pop()?.toLowerCase();
  return fileExtension && ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension)
    ? fileExtension
    : 'jpg';
}

function safeMimeType(asset: ImagePickerAsset, extension: string): string {
  if (asset.mimeType && ['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType)) {
    return asset.mimeType;
  }
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export function persistAvatarAsset(asset: ImagePickerAsset): AvatarUploadPayload {
  if (Platform.OS === 'web') {
    return {
      fileUri: asset.uri,
      fileName: asset.fileName ?? `avatar-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    };
  }

  const source = new File(asset.uri);
  if (!source.exists) throw new Error('The selected photo is no longer available.');
  if (source.size > maxAvatarBytes) throw new Error('Choose a profile photo smaller than 5 MB.');

  const avatarDirectory = getAvatarDirectory();
  avatarDirectory.create({ idempotent: true, intermediates: true });
  const extension = safeExtension(asset);
  const fileName = `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const destination = new File(avatarDirectory, fileName);
  source.copy(destination);

  if (destination.size > maxAvatarBytes) {
    destination.delete();
    throw new Error('Choose a profile photo smaller than 5 MB.');
  }

  return {
    fileUri: destination.uri,
    fileName,
    mimeType: safeMimeType(asset, extension),
  };
}

export function deleteLocalAvatar(fileUri: string | null | undefined): void {
  if (Platform.OS === 'web') return;
  const avatarDirectory = getAvatarDirectory();
  if (!fileUri?.startsWith(avatarDirectory.uri)) return;
  const file = new File(fileUri);
  if (file.exists) file.delete();
}

export function clearLocalAvatars(): void {
  if (Platform.OS === 'web') return;
  const avatarDirectory = getAvatarDirectory();
  if (avatarDirectory.exists) avatarDirectory.delete();
}
