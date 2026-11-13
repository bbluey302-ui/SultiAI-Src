import { supabase } from '../services/supabaseClient';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const AVATAR_SIZE = 400;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that image. Please try a different file.'));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That image could not be opened. Please try a JPG, PNG, or WEBP file.'));
    image.src = src;
  });

/**
 * Validates a user-selected file and converts it into a square, compressed
 * JPEG data URL that is small enough for local storage and Supabase.
 */
export async function prepareAvatarImage(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG, WEBP, or GIF image.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('That photo is too large. Please choose an image under 10 MB.');
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not process that image.');

  // Cover-fit the image into a square, centered.
  const scale = Math.max(AVATAR_SIZE / image.width, AVATAR_SIZE / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  // Fill with the brand dark colour so transparent PNGs never turn black.
  ctx.fillStyle = '#0A121D';
  ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
  ctx.drawImage(
    image,
    (AVATAR_SIZE - drawWidth) / 2,
    (AVATAR_SIZE - drawHeight) / 2,
    drawWidth,
    drawHeight
  );

  return canvas.toDataURL('image/jpeg', 0.86);
}

/**
 * Uploads an uploaded avatar to the public `avatars` Supabase Storage bucket
 * when it exists. Falls back to the local data URL so the avatar always saves.
 */
export async function uploadAvatarToSupabase(avatarUrl: string, userId?: string): Promise<string> {
  if (!supabase || !userId || !avatarUrl.startsWith('data:')) return avatarUrl;

  try {
    const blob = await (await fetch(avatarUrl)).blob();
    const path = `${userId}/avatar-${Date.now()}.jpg`;

    const { error } = await supabase.storage.from('avatars').upload(path, blob, {
      upsert: true,
      contentType: blob.type || 'image/jpeg',
      cacheControl: '3600',
    });

    if (error) return avatarUrl;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data?.publicUrl || avatarUrl;
  } catch {
    return avatarUrl;
  }
}
