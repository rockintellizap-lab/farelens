<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Flight data is generated deterministically in `src/lib/flights/generate.ts` from route + date (no backend); every page re-derives flights from URL search params, so selections travel as `flightId.fareId` strings in the URL — keep it that way so pages work on refresh/share.
- Airline fare rules (baggage, fees, seats, meals) live only in `src/lib/flights/airlines.ts`; comparison logic (true cost, refunds, best-in-row) lives in `src/lib/flights/pricing.ts` with tests beside it — UI must not hard-code fees.
- Sign-in is a demo only (`src/lib/auth/demo-auth.ts`, localStorage, any OTP accepted) — no backend exists; picking a fare while signed out goes to `/login?redirect=<review href>`, and redirects pass through `safeRedirect` so only in-app paths are followed.
- Comparison table rows marked `essential` show by default; all other rows sit behind the "Show more details" toggle — keep the key list short.
