# Turn on Velentis online (one time, about 10 minutes, free)

1. Go to supabase.com and sign in with GitHub. Tap New project. Name it velentis, make a database password (save it somewhere), pick the region nearest you, tap Create. Wait about 2 minutes.
2. Left menu: SQL Editor, then New query. Open VELENTIS-supabase.sql, copy ALL of it, paste it in, tap Run. It should say Success.
2b. For Chats, Guilds and Invites: SQL Editor, New query again, paste ALL of VELENTIS-supabase-2.sql, tap Run. Do this once, after step 2. It is safe to run twice.
3. Left menu: Authentication, then Providers (or Sign In / Providers), then Email. Turn OFF "Confirm email". Tap Save.
4. Left menu: Project Settings, then API (or API Keys). Copy the Project URL and the "anon public" key. Do NOT use the service_role key.
5. In your GitHub repo, open VELENTIS-config.js, tap the pencil, paste the URL and key between the quotes, and commit.
6. Upload the other new files, wait for the build, and install the APK.

Good to know:
- Free Supabase projects pause after about a week with no use. Open the project page and tap Restore if that happens.
- There is no email, so a forgotten password cannot be reset. Keep it safe.
- Leaderboard numbers come from each phone, so they work on trust.

## Step 2c: the Market (gold, gifts, trades, duels)
1. In Supabase open SQL Editor, then New query.
2. Paste everything from VELENTIS-supabase-3.sql and press Run. Run it once only.
3. This also sends the free Quiet Knit outfit to every account that already exists, and to every new account automatically.
