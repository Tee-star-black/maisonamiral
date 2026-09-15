import type { MaisonProduct } from "@/data/products";

export type LookView = "front" | "back";

type LookFigureProps = {
  product: MaisonProduct;
  view: LookView;
  className?: string;
};

/** An illustrative styling form, not a photograph or a fitted 3D garment. */
export function LookFigure({ product, view, className }: LookFigureProps) {
  const back = view === "back";

  return (
    <svg
      viewBox="0 0 360 760"
      className={className}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="180" cy="743" rx="81" ry="8" fill="#d8d4cc" />
      {/* A complete, faceless display figure with neutral styling pieces. */}
      <g fill="#ddd8ce" stroke="#b9b2a6" strokeWidth="0.8">
        <path d="M151 106 L150 152 L131 167 Q180 197 229 167 L210 152 L209 106 Z" />
        <path d="M139 57 Q143 21 180 20 Q217 21 221 57 L216 100 Q210 125 180 136 Q150 125 144 100 Z" />
        <path d="M105 177 Q82 193 78 232 L66 322 L59 411 L77 419 L94 329 L119 242 Z" />
        <path d="M255 177 Q278 193 282 232 L294 322 L301 411 L283 419 L266 329 L241 242 Z" />
        <path d="M59 409 L53 436 L56 464 Q59 475 63 468 L65 446 L69 465 Q75 469 77 460 L81 435 L77 414 Z" />
        <path d="M301 409 L307 436 L304 464 Q301 475 297 468 L295 446 L291 465 Q285 469 283 460 L279 435 L283 414 Z" />
      </g>
      <g fill="#c2baad">
        <path d="M151 118 Q181 144 209 118 L210 148 Q180 167 150 148 Z" />
        <path d="M145 52 Q140 85 151 105 Q160 121 180 129 Q150 121 144 100 L139 62 Z" />
        <path d="M79 239 L92 250 L76 414 L67 412 Z" />
        <path d="M270 250 L281 239 L294 411 L285 414 Z" />
      </g>
      {!back && <path d="M202 41 Q215 65 207 86" fill="none" stroke="#edeae3" strokeWidth="6" strokeLinecap="round" />}
      <g stroke="#9c968b" strokeWidth="1">
        <path fill="#bcb6aa" d="M116 329 Q180 345 244 329 L249 416 L233 565 L224 704 L186 704 L177 464 L169 569 L166 704 L126 704 L116 571 L110 418 Z" />
        <path fill="#aba497" stroke="none" d="M168 378 L183 391 L192 699 L181 699 L177 464 L167 578 L163 699 L151 699 Z" />
        <path fill="none" d="M128 386 L133 537 L143 686 M226 388 L217 537 L206 686" opacity="0.5" />
        {back ? (
          <path fill="none" d="M128 360 L153 365 L151 389 L129 384 Z M207 365 L233 360 L232 384 L209 389 Z M180 348 L180 416" />
        ) : (
          <path fill="none" d="M122 354 L145 359 L128 389 M238 354 L215 359 L232 389 M180 355 L185 414 L176 418" />
        )}
      </g>
      <g fill="#e4e0d7" stroke="#aaa397" strokeWidth="1">
        <path d="M126 689 L164 689 L166 722 Q160 737 109 735 L108 724 L124 711 Z" />
        <path d="M188 689 L225 689 L227 711 L244 724 L244 735 Q194 737 187 722 Z" />
        <path fill="none" d="M109 728 Q139 731 166 722 M187 722 Q214 731 243 728" />
      </g>
      <g>
        <path
          fill={product.tone}
          stroke={product.ink}
          strokeOpacity="0.3"
          strokeWidth="1"
          d="M146 153 L111 168 L96 181 L72 227 L111 253 L124 230 L117 365 Q180 382 243 365 L236 230 L249 253 L288 227 L264 181 L249 168 L214 153 Q180 176 146 153 Z"
        />
        <path fill="#fff" fillOpacity="0.055" d="M146 155 L111 173 L90 222 L115 237 L130 205 L141 358 L177 367 L181 173 Z" />
        <path fill="#000" fillOpacity="0.12" d="M214 155 L230 199 L232 361 L201 369 L215 232 Z M98 190 L111 208 L112 245 L77 226 Z" />
        <g fill="none" stroke={product.ink} strokeOpacity="0.19" strokeWidth="1">
          <path d="M111 171 L127 200 M249 171 L233 200 M79 220 L110 242 M250 242 L281 220 M120 357 Q180 372 240 357" />
          <path d="M142 244 Q137 284 142 342 M219 246 Q224 292 217 343" />
        </g>
        <path
          d={back ? "M147 155 Q180 174 213 155" : "M146 155 Q149 183 180 185 Q211 183 214 155"}
          fill="#bcb5a9"
          stroke={product.ink}
          strokeOpacity="0.55"
          strokeWidth="4"
        />
        {!back && (
          <text x="180" y="245" textAnchor="middle" fill={product.ink} fontFamily="Arial, sans-serif" fontSize="12" fontWeight="600" letterSpacing="1.8">
            {product.artMark}
          </text>
        )}
        {back && <path d="M155 187 L205 187" stroke={product.ink} strokeOpacity="0.15" />}
      </g>
    </svg>
  );
}
