import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../lib/prisma";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface ClaudinaryUploadResult {
  public_id: string;
  bytes: number;
  duration?: number;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (
      !process.env.NEXT_PUBLIC_CLUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { message: "Claoudinary credentials are not set" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = (formData.get("file") as File) || null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalsize ") as string;

    if (!file) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 401 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<ClaudinaryUploadResult>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "video",
            folder: "Next-claudinary-videos",
            transformation: [{ quality: "auto", fetch_format: "mp4" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as ClaudinaryUploadResult);
          }
        );
        uploadStream.end(buffer);
      }
    );

    const video = await prisma.video.create({
      data: {
        title,
        description,
        publicId: result.public_id,
        originalSize: originalSize,
        compressedSize: String(result.bytes),
        duration: result.duration || 0,
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.log("Upload video failed", error);
    return NextResponse.json(
      { message: "UPload video failed" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
