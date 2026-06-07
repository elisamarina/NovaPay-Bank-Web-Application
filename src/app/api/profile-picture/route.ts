import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

import { createAdminClient } from "@/lib/appwrite";
import { getLoggedInUser } from "@/lib/actions/user.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_PROFILE_BUCKET_ID: PROFILE_BUCKET_ID,
  NEXT_PUBLIC_APPWRITE_ENDPOINT: APPWRITE_ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT: APPWRITE_PROJECT,
} = process.env;

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const getErrorResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const getFileViewUrl = (fileId: string) =>
  `${APPWRITE_ENDPOINT}/storage/buckets/${PROFILE_BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT}`;

export async function POST(request: Request) {
  const loggedIn = (await getLoggedInUser()) as User | null;

  if (!loggedIn) {
    return getErrorResponse("Authentication required.", 401);
  }

  if (
    !DATABASE_ID ||
    !USER_COLLECTION_ID ||
    !PROFILE_BUCKET_ID ||
    !APPWRITE_ENDPOINT ||
    !APPWRITE_PROJECT
  ) {
    return getErrorResponse("Profile image storage is not configured.", 500);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return getErrorResponse("Profile image file is required.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return getErrorResponse("Only JPG, PNG, or WebP images are supported.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return getErrorResponse("Profile image must be 2MB or smaller.");
  }

  const { database, storage } = await createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadedFile = await storage.createFile(
    PROFILE_BUCKET_ID,
    ID.unique(),
    InputFile.fromBuffer(buffer, file.name),
  );
  const profileImageUrl = getFileViewUrl(uploadedFile.$id);

  await database.updateDocument(DATABASE_ID, USER_COLLECTION_ID, loggedIn.$id, {
    profileImageId: uploadedFile.$id,
    profileImageUrl,
  });

  return NextResponse.json({
    profileImageId: uploadedFile.$id,
    profileImageUrl,
  });
}
