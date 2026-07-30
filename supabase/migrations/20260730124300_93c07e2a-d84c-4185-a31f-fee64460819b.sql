DROP TRIGGER IF EXISTS notify_post_like_trg ON public.post_likes;
DROP FUNCTION IF EXISTS public.notify_post_like();
DROP TRIGGER IF EXISTS notify_new_comment_trg ON public.comments;
DROP FUNCTION IF EXISTS public.notify_new_comment();