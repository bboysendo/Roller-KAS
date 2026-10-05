import { BRAND } from '../data/coins';

interface Props {
  size?: 'sm' | 'lg';
}

/** ROLLER KAS wordmark with the KAS + ZKAS MINING tagline. */
export function Wordmark({ size = 'sm' }: Props) {
  return (
    <span className={`wordmark size-${size}`}>
      <span className="wordmark-title">
        ROLLER<span className="accent"> KAS</span>
      </span>
      <span className="wordmark-tag">{BRAND.tagline}</span>
    </span>
  );
}
