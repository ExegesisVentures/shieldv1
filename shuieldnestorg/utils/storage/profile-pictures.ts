/**
 * Profile Picture Storage Utilities
 * 
 * Handles uploading, retrieving, and deleting user profile pictures
 * from Supabase Storage.
 * 
 * File: shuieldnestorg/utils/storage/profile-pictures.ts
 */

import { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "profile-pictures";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

/**
 * Upload a profile picture for the authenticated user
 * Returns the public URL of the uploaded image
 */
export async function uploadProfilePicture(
  supabase: SupabaseClient,
  file: File
): Promise<{ url: string; error?: string }> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { url: "", error: "Image must be less than 5MB" };
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { url: "", error: "File must be an image (JPEG, PNG, GIF, or WebP)" };
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { url: "", error: "User not authenticated" };
    }

    // Generate unique filename with timestamp
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { url: "", error: `Upload failed: ${uploadError.message}` };
    }

    // Get signed URL (for private buckets)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(uploadData.path, 60 * 60 * 24 * 365); // 1 year expiry

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return { url: "", error: `Failed to create image URL: ${signedUrlError.message}` };
    }

    // Update user profile with new image URL
    const { error: updateError } = await updateProfileImageUrl(supabase, signedUrlData.signedUrl);
    if (updateError) {
      console.error("Failed to update profile URL:", updateError);
      return { url: "", error: "Failed to save profile image URL" };
    }

    console.log("✅ Profile picture uploaded:", signedUrlData.signedUrl);
    return { url: signedUrlData.signedUrl };
  } catch (error) {
    console.error("Unexpected error uploading profile picture:", error);
    return { 
      url: "", 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Update the profile_image_url in public_users table
 */
export async function updateProfileImageUrl(
  supabase: SupabaseClient,
  imageUrl: string
): Promise<{ error?: string }> {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Get public_user_id from user_profiles mapping
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("public_user_id")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profileData) {
      return { error: "User profile not found" };
    }

    // Update public_users with new image URL
    const { error: updateError } = await supabase
      .from("public_users")
      .update({ 
        profile_image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", profileData.public_user_id);

    if (updateError) {
      return { error: updateError.message };
    }

    return {};
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Get the current profile picture URL for the authenticated user
 */
export async function getProfilePictureUrl(
  supabase: SupabaseClient
): Promise<{ url: string | null; error?: string }> {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { url: null, error: "User not authenticated" };
    }

    // Get profile image URL from public_users via user_profiles mapping
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select(`
        public_users:public_user_id (
          profile_image_url
        )
      `)
      .eq("auth_user_id", user.id)
      .single();

    if (profileError) {
      return { url: null, error: profileError.message };
    }

    const publicUsers = profileData?.public_users as { profile_image_url?: string } | null;
    const storedUrl = publicUsers?.profile_image_url;
    
    if (!storedUrl) {
      return { url: null };
    }

    // If it's already a signed URL, return it
    if (storedUrl.includes('token=')) {
      return { url: storedUrl };
    }

    // If it's a public URL, convert to signed URL
    try {
      // Extract file path from public URL
      const urlParts = storedUrl.split('/storage/v1/object/public/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        // Remove the bucket name from the path since createSignedUrl expects just the file path
        const actualFilePath = filePath.replace(`${BUCKET_NAME}/`, '');
        
        // Create new signed URL
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(actualFilePath, 60 * 60 * 24 * 365); // 1 year expiry

        if (signedUrlError) {
          console.error("Error creating signed URL for existing image:", signedUrlError);
          return { url: storedUrl }; // Fallback to original URL
        }

        // Update database with new signed URL
        await updateProfileImageUrl(supabase, signedUrlData.signedUrl);
        
        return { url: signedUrlData.signedUrl };
      }
    } catch (error) {
      console.error("Error converting to signed URL:", error);
    }

    return { url: storedUrl };
  } catch (error) {
    return { 
      url: null, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Delete the current profile picture for the authenticated user
 */
export async function deleteProfilePicture(
  supabase: SupabaseClient
): Promise<{ error?: string }> {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Get current profile image URL
    const { url: currentUrl, error: getError } = await getProfilePictureUrl(supabase);
    if (getError) {
      return { error: getError };
    }

    // If there's an image, delete it from storage
    if (currentUrl) {
      // Extract file path from URL
      const urlObj = new URL(currentUrl);
      const pathParts = urlObj.pathname.split(`/${BUCKET_NAME}/`);
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath]);

        if (deleteError) {
          console.error("Error deleting file from storage:", deleteError);
        }
      }
    }

    // Clear profile_image_url in database
    const { error: updateError } = await updateProfileImageUrl(supabase, "");
    if (updateError) {
      return { error: updateError };
    }

    return {};
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Validate if a file is a valid image for profile picture
 */
export function validateProfilePictureFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "Image must be less than 5MB" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "File must be an image (JPEG, PNG, GIF, or WebP)" };
  }

  return { valid: true };
}

