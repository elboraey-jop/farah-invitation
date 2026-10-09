# Farah & Karim Wedding Invitation

Next.js invitation website for Farah and Karim's wedding on 17 October 2026 at 8:00 PM, Qasr Hall.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add the Supabase URL, anon key, service-role key, and the admin email.
5. Create the admin user in Supabase Auth using that email.

The public invitation accepts a name and private wish. Wishes are never selected by the public page; they are visible only through `/admin` after the configured admin signs in.

## Replace temporary assets

- Couple photos: replace the four SVGs in `public/assets/placeholders/` or update `lib/invitation.ts`.
- Music: replace `public/assets/music/placeholder.wav` and keep the path in `lib/invitation.ts`, or update the path.
- Colors, fonts, and spacing: edit the CSS variables at the top of `app/globals.css`.
- Text and wedding data: edit `lib/invitation.ts` and the section copy in `components/InvitationExperience.tsx`.

The original source asset folders `الهام/` and `زخارف/` stay local and are ignored by Git; only the prepared files under `public/assets/` are committed.
