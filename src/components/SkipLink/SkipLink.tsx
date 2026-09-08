import './SkipLink.css';

export interface SkipLinkProps {
  /** Id of the main landmark, without the leading hash. */
  targetId?: string;
  children?: string;
}

/**
 * Bypass block link (2.4.1 Bypass Blocks). Hidden until focused, then pinned to the
 * top of the viewport so keyboard users can reach the main content immediately.
 */
export function SkipLink({ targetId = 'main', children = 'Przejdź do treści' }: SkipLinkProps) {
  return (
    <a className="cp-skip-link" href={`#${targetId}`}>
      {children}
    </a>
  );
}
