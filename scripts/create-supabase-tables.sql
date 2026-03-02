-- ═══════════════════════════════════════════════════════════════════
-- Paste this ENTIRE block into Supabase SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Silently drop everything (ignores "does not exist" errors)
DO $$
BEGIN
    DROP TABLE IF EXISTS public.chat_messages  CASCADE;
    DROP TABLE IF EXISTS public.chat_threads   CASCADE;
    DROP TABLE IF EXISTS public.pdfs           CASCADE;
    DROP TABLE IF EXISTS public.user_profiles  CASCADE;
    DROP FUNCTION IF EXISTS public.bump_thread_on_message();
    DROP FUNCTION IF EXISTS public.update_updated_at();
EXCEPTION WHEN OTHERS THEN
    -- Suppress any remaining errors from missing objects
    RAISE NOTICE 'Cleanup done (some objects may not have existed): %', SQLERRM;
END;
$$;

-- Step 2: Create tables fresh
CREATE TABLE public.chat_threads (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT        NOT NULL DEFAULT 'New Chat',
    model_type      TEXT        NOT NULL DEFAULT 'minimax',
    description     TEXT,
    status          TEXT        NOT NULL DEFAULT 'active',
    message_count   INTEGER     NOT NULL DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.chat_messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id   UUID        REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    session_id  UUID,
    user_id     UUID        NOT NULL,
    pdf_id      UUID,
    role        TEXT        NOT NULL,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.pdfs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name   TEXT        NOT NULL,
    file_path   TEXT        NOT NULL,
    file_size   BIGINT      NOT NULL DEFAULT 0,
    category    TEXT        NOT NULL DEFAULT 'pdf',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT,
    username    TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Functions & Triggers
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_chat_threads_updated_at
    BEFORE UPDATE ON public.chat_threads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.bump_thread_on_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.chat_threads
    SET message_count   = message_count + 1,
        last_message_at = NOW(),
        updated_at      = NOW()
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_thread
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.bump_thread_on_message();

-- Step 4: Indexes
CREATE INDEX idx_chat_threads_user    ON public.chat_threads(user_id);
CREATE INDEX idx_chat_threads_status  ON public.chat_threads(status);
CREATE INDEX idx_chat_messages_thread ON public.chat_messages(thread_id);
CREATE INDEX idx_chat_messages_time   ON public.chat_messages(created_at);

-- Step 5: Row Level Security
ALTER TABLE public.chat_threads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdfs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own threads"
    ON public.chat_threads FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own messages"
    ON public.chat_messages FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.chat_threads t
        WHERE t.id = chat_messages.thread_id AND t.user_id = auth.uid()
    ));

CREATE POLICY "Users own pdfs"
    ON public.pdfs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own profile"
    ON public.user_profiles FOR ALL USING (auth.uid() = id);

-- Done!
SELECT 'Tables created successfully ✅' AS status;
