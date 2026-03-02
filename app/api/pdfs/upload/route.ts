import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    if (!file || !category) {
      return NextResponse.json(
        { error: 'File and category are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['pdf', 'csv', 'graph', 'space'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', user.id);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const filename = `${timestamp}_${file.name}`;
    const filePath = path.join(uploadDir, filename);
    const relativeFilePath = `/uploads/${user.id}/${filename}`;

    // Convert file to buffer and save
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Save PDF record to database
    const { data: pdf, error: pdfError } = await supabase
      .from('pdfs')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_path: relativeFilePath,
        file_size: buffer.byteLength,
        category,
      })
      .select()
      .single();

    if (pdfError) {
      // Clean up file if database insert fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.error('Error saving PDF record:', pdfError);
      return NextResponse.json(
        { error: 'Failed to save PDF record' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'File uploaded successfully',
        pdf,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
