import { getSupabase, isSupabaseConfigured } from './supabase';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export interface StorageService {
  uploadCouplePhoto(coupleId: string, uri: string): Promise<string>;
  uploadMemoryPhoto(memoryId: string, uri: string, sortOrder: number): Promise<{ id: string; storage_path: string }>;
  getPublicUrl(path: string): string;
}

class SupabaseStorageService implements StorageService {
  private supabase = getSupabase();

  async uploadCouplePhoto(coupleId: string, uri: string): Promise<string> {
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${coupleId}-${Date.now()}.${fileExt}`;
    const filePath = `couples/${fileName}`;

    let fileData: any;

    if (Platform.OS === 'web') {
      // Web: use fetch and blob
      const response = await fetch(uri);
      fileData = await response.blob();
    } else {
      // Mobile: read file as base64 and convert to ArrayBuffer
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileData = bytes.buffer;
    }

    const { error: uploadError } = await this.supabase.storage
      .from('photos')
      .upload(filePath, fileData, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = this.supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async uploadMemoryPhoto(memoryId: string, uri: string, sortOrder: number): Promise<{ id: string; storage_path: string }> {
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${memoryId}-${sortOrder}-${Date.now()}.${fileExt}`;
    const filePath = `memories/${fileName}`;

    let fileData: any;

    if (Platform.OS === 'web') {
      // Web: use fetch and blob
      const response = await fetch(uri);
      fileData = await response.blob();
    } else {
      // Mobile: read file as base64 and convert to ArrayBuffer
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileData = bytes.buffer;
    }

    const { error: uploadError } = await this.supabase.storage
      .from('photos')
      .upload(filePath, fileData, {
        contentType: `image/${fileExt}`,
      });

    if (uploadError) throw uploadError;

    // Create memory_photo record
    const { data: photo, error: dbError } = await this.supabase
      .from('memory_photos')
      .insert({
        memory_id: memoryId,
        storage_path: filePath,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return { id: photo.id, storage_path: filePath };
  }

  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from('photos')
      .getPublicUrl(path);
    return data.publicUrl;
  }
}

class MockStorageService implements StorageService {
  async uploadCouplePhoto(_coupleId: string, uri: string): Promise<string> {
    // Mock: just return the local URI
    return uri;
  }

  async uploadMemoryPhoto(_memoryId: string, uri: string, sortOrder: number): Promise<{ id: string; storage_path: string }> {
    // Mock: return fake data
    return {
      id: `photo-${Date.now()}-${sortOrder}`,
      storage_path: uri,
    };
  }

  getPublicUrl(path: string): string {
    return path;
  }
}

export function createStorageService(): StorageService {
  if (isSupabaseConfigured) {
    return new SupabaseStorageService();
  }
  return new MockStorageService();
}
