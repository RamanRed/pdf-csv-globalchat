import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PGRST205 = table does not exist yet — return empty data so the UI still loads
const TABLE_MISSING_CODE = 'PGRST205';

// GET /api/chat/threads - List all threads for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: threads, error: threadsError } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (threadsError) {
      // Table not created yet — return empty list so UI still renders
      if (threadsError.code === TABLE_MISSING_CODE) {
        return NextResponse.json({ threads: [], setup_required: true }, { status: 200 });
      }
      console.error('Error fetching threads:', threadsError);
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
    }

    return NextResponse.json({ threads: threads ?? [] }, { status: 200 });
  } catch (error) {
    console.error('Threads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat/threads - Create a new thread
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, model_type, description } = await request.json();

    const { data: thread, error: threadError } = await supabase
      .from('chat_threads')
      .insert({
        user_id: user.id,
        title: title || 'New Chat',
        model_type: model_type || 'minimax',
        description: description || null,
        status: 'active',
        message_count: 0,
      })
      .select()
      .single();

    if (threadError) {
      console.error('Error creating thread:', threadError);
      // User-friendly code for missing table
      if (threadError.code === TABLE_MISSING_CODE) {
        return NextResponse.json(
          {
            error: 'Database tables not set up yet. Please run the SQL setup script in your Supabase SQL Editor.',
            setup_required: true,
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
    }

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error('Create thread error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
