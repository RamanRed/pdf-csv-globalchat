import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    const { data: pdfs, error: pdfsError } = await supabase
      .from('pdfs')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (pdfsError) {
      console.error('Error fetching PDFs:', pdfsError);
      return NextResponse.json(
        { error: 'Failed to fetch PDFs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pdfs }, { status: 200 });
  } catch (error) {
    console.error('List PDFs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
