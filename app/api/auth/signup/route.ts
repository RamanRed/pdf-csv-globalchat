import { createAdminClient } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use admin client to create an auto-confirmed user (no email confirmation needed)
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: username || email.split('@')[0],
      },
    });

    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 400 });
    }

    if (adminData.user) {
      // Create user profile in the users table
      const { error: profileError } = await admin
        .from('users')
        .insert({
          id: adminData.user.id,
          email: adminData.user.email,
          username: username || email.split('@')[0],
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    // Build the response first, then create a Supabase client that writes
    // session cookies directly onto that response object.
    const response = NextResponse.json(
      { message: 'Account created successfully' },
      { status: 201 }
    );

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 400 });
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Signup error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
