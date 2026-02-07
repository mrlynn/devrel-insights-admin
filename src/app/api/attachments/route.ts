/**
 * Attachments API - Vercel Blob Storage
 * 
 * POST /api/attachments - Upload a file
 * GET /api/attachments - List attachments for an insight
 * DELETE /api/attachments/[id] - Delete an attachment
 */

import { NextRequest, NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';
import { getCollection, collections } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
];

/**
 * POST /api/attachments - Upload a file
 * 
 * Body: FormData with:
 * - file: The file to upload
 * - insightId: The insight this attachment belongs to
 * - advocateId: The uploader's advocate ID
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const insightId = formData.get('insightId') as string | null;
    const advocateId = formData.get('advocateId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!insightId) {
      return NextResponse.json({ error: 'insightId required' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const filename = `insights/${insightId}/${timestamp}-${random}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Create attachment record
    const { ObjectId } = await import('mongodb');
    const attachment = {
      _id: new ObjectId().toString(),
      insightId,
      advocateId: advocateId || 'unknown',
      url: blob.url,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      blobPath: filename,
      createdAt: new Date().toISOString(),
    };

    // Save to database
    const attachmentsCol = await getCollection('attachments');
    await attachmentsCol.insertOne(attachment as any);

    // Update insight with attachment reference
    const insightsCol = await getCollection(collections.insights);
    await insightsCol.updateOne(
      { _id: insightId as any },
      { 
        $push: { 
          attachments: {
            _id: attachment._id,
            url: blob.url,
            type: 'image',
            filename: file.name,
          } 
        } as any,
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    return NextResponse.json({
      success: true,
      attachment: {
        _id: attachment._id,
        url: blob.url,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('POST /api/attachments error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

/**
 * GET /api/attachments - List attachments
 * Query: ?insightId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const insightId = searchParams.get('insightId');

    if (!insightId) {
      return NextResponse.json({ error: 'insightId required' }, { status: 400 });
    }

    const attachmentsCol = await getCollection('attachments');
    const attachments = await attachmentsCol
      .find({ insightId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      attachments: attachments.map((a: any) => ({
        _id: a._id,
        url: a.url,
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('GET /api/attachments error:', error);
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}

/**
 * DELETE /api/attachments - Delete an attachment
 * Body: { attachmentId, insightId }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { attachmentId, insightId } = body;

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachmentId required' }, { status: 400 });
    }

    const attachmentsCol = await getCollection('attachments');
    
    // Find the attachment
    const attachment = await attachmentsCol.findOne({ _id: attachmentId });
    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Delete from Vercel Blob
    try {
      await del((attachment as any).url);
    } catch (blobError) {
      console.warn('Failed to delete blob:', blobError);
      // Continue anyway - file might already be deleted
    }

    // Delete from database
    await attachmentsCol.deleteOne({ _id: attachmentId });

    // Remove from insight's attachments array
    if (insightId) {
      const insightsCol = await getCollection(collections.insights);
      await insightsCol.updateOne(
        { _id: insightId as any },
        { 
          $pull: { attachments: { _id: attachmentId } } as any,
          $set: { updatedAt: new Date().toISOString() }
        }
      );
    }

    return NextResponse.json({ success: true, deleted: attachmentId });
  } catch (error) {
    console.error('DELETE /api/attachments error:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}
