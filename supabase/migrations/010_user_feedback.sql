-- ============================================================================
-- 010: User Feedback Table
-- Native Feedback Loop for product validation
-- ============================================================================

CREATE TABLE public.user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    valor_principal VARCHAR(50) NOT NULL,       -- The quick-tap option chosen
    comentario TEXT,                             -- Open-text "magic wand" response
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_family_id ON public.user_feedback(family_id);

COMMENT ON TABLE public.user_feedback IS 'Product feedback collected from users via the in-app feedback loop';
COMMENT ON COLUMN public.user_feedback.valor_principal IS 'The primary value option the user selected (e.g. rapidez, gastos_fijos, compartir)';
COMMENT ON COLUMN public.user_feedback.comentario IS 'Free-text response to the magic wand question';

-- RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback"
    ON public.user_feedback FOR INSERT
    WITH CHECK (user_id = auth.uid() AND family_id = public.get_user_family_id());

CREATE POLICY "Users can view their own feedback"
    ON public.user_feedback FOR SELECT
    USING (user_id = auth.uid());
