revoke execute on function public.create_conversation_request(uuid, text, text) from anon, public;
revoke execute on function public.respond_conversation_request(uuid, boolean) from anon, public;
revoke execute on function public.request_withdraw(numeric) from anon, public;
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.update_updated_at_column() from anon, authenticated, public;

grant execute on function public.create_conversation_request(uuid, text, text) to authenticated;
grant execute on function public.respond_conversation_request(uuid, boolean) to authenticated;
grant execute on function public.request_withdraw(numeric) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;