import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
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

    // Sign the user in immediately to establish a JWT session in cookies
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Account created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
