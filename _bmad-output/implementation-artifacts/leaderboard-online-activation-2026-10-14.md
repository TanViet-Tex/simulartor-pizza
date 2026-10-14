# Online leaderboard activation — 2026-10-14

- User authorized hands-on Supabase/Vercel setup and deployment.
- Pushed five completed commits d2bbec3 through 6983751 to main of TanViet-Tex/simulartor-pizza.
- Vercel production deployment AvRp9cuU8c8MQRgdjX7vHQn4tLRN became Ready at https://simulartor-pizza.vercel.app/.
- Live API exposed a native ESM import error that local bundler tests had missed; follow-up repair and deployment verification are in spec-vercel-leaderboard-esm.md.
- Vercel account login succeeded. Supabase GitHub OAuth remains blocked by a disabled Authorize Supabase button, including after reload and fresh login flow. Asked user to finish Supabase login; user requested the login location and received https://supabase.com/dashboard/sign-in.
- Supabase login subsequently succeeded. Created the FREE organization Pizza Game (tbvqcircgzmijwkyqlhl). Prepared project simulartor-pizza, Asia-Pacific, Data API enabled, automatic table exposure disabled, automatic RLS enabled. Paused before Database password: user must enter and submit the new credential themselves under browser control policy; requested user to complete Create new project.
- Repair d9854e3 passed frontend build, API NodeNext typecheck, 46 unit tests, native emitted Node smoke and independent review. Pushed to origin/main; real deployment check ongoing.
- User created a separate FREE project igqwvwxhogohixswkadq (TanViet-Tex's Project / TanViet-Tex's Org, Mumbai). Used this user-created project; the previously prepared Pizza Game project was not created.
- Executed supabase/leaderboard.sql successfully in the real SQL Editor. Saved SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as Production Secret variables in Vercel. The existing service_role key was transferred directly through browser memory, never written into files/Git/chat, and removed from the working variable afterward.
- Redeployed d9854e3 with the new settings: deployment 9ky3Byp6Sk9QAXCMp9R8nVThCy18. The public production API returned HTTP 200 with entries=[] and self=null. The real game menu leaderboard returned state=ready and the empty-player message.
- Real database smoke ran inside BEGIN/ROLLBACK: two player identities, cash ordering, day tie-break, self rank, stale revision protection, wrong-token rejection, browser-role RPC denial and service_role execution permission all passed. No test players retained; a subsequent real game read confirmed the empty board. This was two identities in a database transaction, not two full browser campaigns. Browser publication behavior remains covered by the earlier focused E2E tests with a controlled API.
- Activation completed: shared leaderboard now connects to real Supabase through the production Vercel API. Saved game progress still stays in the player's browser; online storage here is only the leaderboard.
- Proof screenshots: ui-baseline/leaderboard-online-activation-2026-10-14/{supabase-sql-success.jpg,supabase-two-player-check-success.jpg,vercel-server-env-configured.jpg,leaderboard-online-connected.jpg}.
- No secrets stored in this note or repository.
