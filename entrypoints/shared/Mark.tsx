/**
 * The Meritum mark (logo B „Dwa łuki”) for the popup and the widget, same paths as
 * design-system/extension/popup/popup.html and reference/card.js. The two stylesheets name
 * the accent circle differently (`dot` in the popup's, `acc` in widget.css).
 *
 * @param props.where - Which stylesheet styles it: the popup's `mark`, the widget's `m-mark`.
 * @param props.size - Width and height in px; omit when the styles size it.
 * @returns The inline SVG, hidden from screen readers.
 * @feature US-WTY-05, ADR-09
 */
export function Mark({ where, size }: { where: 'popup' | 'widget'; size?: number }) {
  return (
    <svg
      className={where === 'popup' ? 'mark' : 'm-mark'}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        d="M10 40V25c0-5.5 3.1-9 7-9s7 3.5 7 9v15M24 25c0-5.5 3.1-9 7-9s7 3.5 7 9v15"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path className="acc" d="M24 25v15" fill="none" strokeWidth="4" strokeLinecap="round" />
      <circle className={where === 'popup' ? 'dot' : 'acc'} cx="24" cy="7.6" r="3.5" />
    </svg>
  )
}
