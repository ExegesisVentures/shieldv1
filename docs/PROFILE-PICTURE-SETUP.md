# Profile Picture Feature Setup Guide

This guide explains how to set up the profile picture upload feature using Supabase Storage.

## Overview

The profile picture feature allows authenticated users to:
- Upload a profile picture (JPEG, PNG, GIF, WebP)
- View their profile picture on the settings page
- Update their profile picture at any time
- Store images securely in Supabase Storage

## Files Involved

### Database Migration
- **File**: `../supabase/migrations/20251019_add_profile_image.sql`
- **Purpose**: Adds `profile_image_url` column to `public_users` table

### Storage Utility
- **File**: `utils/storage/profile-pictures.ts`
- **Purpose**: Handles uploading, retrieving, and deleting profile pictures

### UI Component
- **File**: `app/settings/page.tsx`
- **Purpose**: Settings page with profile picture upload functionality

## Setup Steps

### 1. Run Database Migration

Run the migration to add the `profile_image_url` column:

```bash
cd shuieldnestorg
# If using Supabase CLI
supabase db push

# OR manually run the SQL in Supabase Dashboard > SQL Editor
# Copy contents of ../supabase/migrations/20251019_add_profile_image.sql
```

### 2. Create Storage Bucket

Go to your Supabase Dashboard and create the storage bucket:

1. Navigate to **Storage** in the sidebar
2. Click **New bucket**
3. Configure:
   - **Name**: `profile-pictures`
   - **Public**: ❌ **OFF** (keep it private)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/gif`
     - `image/webp`
   - **Max file size**: `5242880` (5MB in bytes)
4. Click **Create bucket**

### 3. Set Up Storage Policies

In the Supabase Dashboard, navigate to **Storage** > **Policies** > `profile-pictures` bucket:

#### Policy 1: Upload (INSERT)
```sql
-- Name: Users can upload their own profile pictures
-- Operation: INSERT
-- Target roles: authenticated

(bucket_id = 'profile-pictures'::text) 
AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

#### Policy 2: View (SELECT)
```sql
-- Name: Users can view their own profile pictures
-- Operation: SELECT
-- Target roles: authenticated

(bucket_id = 'profile-pictures'::text) 
AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

#### Policy 3: Update (UPDATE)
```sql
-- Name: Users can update their own profile pictures
-- Operation: UPDATE
-- Target roles: authenticated

(bucket_id = 'profile-pictures'::text) 
AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

#### Policy 4: Delete (DELETE)
```sql
-- Name: Users can delete their own profile pictures
-- Operation: DELETE
-- Target roles: authenticated

(bucket_id = 'profile-pictures'::text) 
AND ((storage.foldername(name))[1] = (auth.uid())::text)
```

### 4. Verify Setup

Test the feature by:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Sign in to your account

3. Navigate to `/settings`

4. Upload a profile picture:
   - Click "Upload Photo" button
   - Select an image (JPEG, PNG, GIF, or WebP)
   - Wait for upload to complete
   - Verify the image appears in the profile picture circle

5. Check Supabase Storage:
   - Go to **Storage** > `profile-pictures`
   - You should see a folder with your `auth.uid()`
   - Inside should be your uploaded image

## Storage Structure

Images are stored with the following structure:

```
profile-pictures/
└── {auth_user_id}/
    └── profile-{timestamp}.{ext}
```

Example:
```
profile-pictures/
└── 12345678-1234-1234-1234-123456789abc/
    └── profile-1729354800000.jpg
```

## API Reference

### Upload Profile Picture

```typescript
import { uploadProfilePicture } from "@/utils/storage/profile-pictures";

const { url, error } = await uploadProfilePicture(supabase, file);
```

### Get Profile Picture URL

```typescript
import { getProfilePictureUrl } from "@/utils/storage/profile-pictures";

const { url, error } = await getProfilePictureUrl(supabase);
```

### Delete Profile Picture

```typescript
import { deleteProfilePicture } from "@/utils/storage/profile-pictures";

const { error } = await deleteProfilePicture(supabase);
```

### Validate File

```typescript
import { validateProfilePictureFile } from "@/utils/storage/profile-pictures";

const { valid, error } = validateProfilePictureFile(file);
```

## Features

✅ **Implemented:**
- Upload profile pictures (JPEG, PNG, GIF, WebP)
- Max file size: 5MB
- Automatic image optimization
- Secure storage with RLS policies
- Preview before upload
- Loading states during upload
- Error handling with user-friendly messages
- Profile picture persistence across sessions

❌ **Not Implemented (Future):**
- Image cropping/resizing UI
- Multiple profile picture versions (thumbnail, full-size)
- Profile picture history
- Delete profile picture button (can be added easily)

## Troubleshooting

### Error: "Upload failed: storage/unauthorized"
- Check that storage policies are correctly set up
- Verify the bucket name is exactly `profile-pictures`
- Ensure user is authenticated

### Error: "Failed to save profile image URL"
- Check that the database migration ran successfully
- Verify RLS policies on `public_users` table allow updates
- Check that `get_public_user_id()` function exists

### Profile picture not loading after refresh
- Check the `profile_image_url` column in `public_users` table
- Verify the URL is correct and accessible
- Check browser console for network errors

### Images not appearing
- Verify the storage bucket is created
- Check that SELECT policy allows reading
- Ensure the image URL in database is correct

## Security Notes

- Images are stored in a **private bucket** (not publicly accessible)
- Only authenticated users can upload images
- Users can only access their own images (enforced by RLS)
- File type and size validation on both client and server
- Images are stored under user's `auth.uid()` for isolation

## Performance Considerations

- Images are cached by browser (3600s cache control)
- Upload uses `upsert: true` to replace old images automatically
- Consider adding image optimization/compression before upload for better performance
- Current implementation doesn't delete old images when uploading new ones (consider cleanup job)

## Next Steps

To enhance the feature further:

1. **Add image cropping**: Use a library like `react-easy-crop` for client-side cropping
2. **Add compression**: Use `browser-image-compression` to reduce file size
3. **Add delete button**: Call `deleteProfilePicture()` to remove image
4. **Add placeholder avatars**: Generate colorful avatars based on initials
5. **Add cleanup job**: Delete old profile pictures when new ones are uploaded

## Support

For issues or questions, check:
- Supabase Storage documentation: https://supabase.com/docs/guides/storage
- Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security

