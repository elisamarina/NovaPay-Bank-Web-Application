"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type ProfileImageUploaderProps = {
  displayName: string;
  imageUrl?: string;
  variant?: "sidebar" | "inline";
};

const getInitials = (displayName: string) =>
  displayName
    .split(" ")
    .filter(Boolean)
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const ProfileImageUploader = ({
  displayName,
  imageUrl,
  variant = "sidebar",
}: ProfileImageUploaderProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState(imageUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const initials = getInitials(displayName);

  const uploadProfileImage = async (file: File) => {
    const formData = new FormData();

    formData.append("file", file);
    setIsUploading(true);

    try {
      const response = await fetch("/api/profile-picture", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        error?: string;
        profileImageUrl?: string;
      };

      if (!response.ok || !result.profileImageUrl) {
        throw new Error(result.error ?? "Could not upload profile image.");
      }

      setPreviewUrl(result.profileImageUrl);
      router.refresh();
    } catch {
      setPreviewUrl(imageUrl ?? "");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={
        variant === "inline"
          ? "relative flex size-28 items-center justify-center overflow-hidden rounded-full border-8 border-white bg-gray-100 p-2 shadow-profile dark:border-slate-950 dark:bg-slate-900"
          : "profile-img overflow-hidden"
      }
    >
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt=""
          fill
          unoptimized
          className="rounded-full object-cover"
        />
      ) : (
        <span className="text-5xl font-bold text-blue-500">
          {initials || "U"}
        </span>
      )}

      <button
        type="button"
        className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border border-white bg-bankGradient text-white shadow-md transition hover:brightness-95 disabled:opacity-70 dark:border-slate-950"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="Upload profile picture"
      >
        {isUploading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Camera size={15} />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) void uploadProfileImage(file);
          event.target.value = "";
        }}
      />
    </div>
  );
};

export default ProfileImageUploader;
