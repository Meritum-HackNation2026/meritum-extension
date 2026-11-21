/**
 * The Meritum mark (logo B „Dwa łuki”) for the widget, same paths as the popup and
 * design-system/extension/reference/card.js; the accent comes from widget.css `--m-sea`.
 *
 * @param props.size - Width and height in px.
 * @returns The inline SVG, hidden from screen readers.
 * @feature US-WTY-05, ADR-09
 */
export function Mark({ size }: { size: number }) {
  return (
    <svg className="m-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M10 40V25c0-5.5 3.1-9 7-9s7 3.5 7 9v15M24 25c0-5.5 3.1-9 7-9s7 3.5 7 9v15"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path className="acc" d="M24 25v15" fill="none" strokeWidth="4" strokeLinecap="round" />
      <circle className="acc" cx="24" cy="7.6" r="3.5" />
    </svg>
  )
}
