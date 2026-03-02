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

    const searchParams = request.nextUrl.searchParams;
    const threadId = searchParams.get('threadId');
    const sessionId = searchParams.get('sessionId');

    if (!threadId && !sessionId) {
      return NextResponse.json(
        { error: 'threadId or sessionId is required' },
        { status: 400 }
      );
    }

    // Build query – filter by threadId (preferred) or sessionId (legacy)
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (threadId) {
      query = query.eq('thread_id', threadId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
