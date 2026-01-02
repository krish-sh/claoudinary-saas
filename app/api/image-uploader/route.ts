import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface ClaudinaryUploadResult {
  public_id: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = (formData.get("file") as File) || null;
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
          { folder: "Next-claudinary-uploads" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as ClaudinaryUploadResult);
          }
        );
        uploadStream.end(buffer);
      }
    );

    return NextResponse.json({ publicId: result.public_id }, { status: 200 });
  } catch (error) {
    console.log("Upload image failed", error);
    return NextResponse.json(
      { message: "UPload image failed" },
      { status: 500 }
    );
  }
}
