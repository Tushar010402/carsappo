import { CONTENT_TOKENS } from "@/lib/content";

/** Collapsible list of the {tokens} admins can type into storefront copy. */
export function TokenHelp() {
  return (
    <details className="group rounded-xl border border-line bg-mist/50 px-4 py-3 text-sm">
      <summary className="cursor-pointer list-none font-semibold">
        Placeholders you can use <span className="font-normal text-muted">— e.g. {"{freeShipping}"} stays in sync with your shipping settings</span>
      </summary>
      <dl className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {CONTENT_TOKENS.map((t) => (
          <div key={t.token} className="flex gap-2">
            <dt>
              <code className="rounded bg-white px-1.5 py-0.5 text-xs">{t.token}</code>
            </dt>
            <dd className="text-muted">{t.description}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
