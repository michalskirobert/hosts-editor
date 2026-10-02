import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  readonly label: string;
  readonly children: ReactNode;
}

type Placement = "top" | "bottom";

interface TooltipPosition {
  readonly left: number;
  readonly top: number;
  readonly placement: Placement;
}

const VIEWPORT_MARGIN = 10;
const GAP = 8;

export const Tooltip = ({ label, children }: TooltipProps) => {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const canFitAbove = triggerRect.top >= tooltipRect.height + GAP + VIEWPORT_MARGIN;
    const placement: Placement = canFitAbove ? "top" : "bottom";

    const desiredLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    const maxLeft = window.innerWidth - tooltipRect.width - VIEWPORT_MARGIN;
    const left = Math.min(
      Math.max(desiredLeft, VIEWPORT_MARGIN),
      Math.max(VIEWPORT_MARGIN, maxLeft),
    );
    const top =
      placement === "top" ? triggerRect.top - tooltipRect.height - GAP : triggerRect.bottom + GAP;

    setPosition({ left, top, placement });
  }, []);

  useEffect(() => {
    if (!visible) return;

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [updatePosition, visible]);

  const show = () => {
    setVisible(true);
  };
  const hide = () => {
    setVisible(false);
    setPosition(null);
  };

  const handleBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) hide();
  };

  const handleMouseLeave = (event: MouseEvent<HTMLSpanElement>) => {
    if (!event.currentTarget.contains(document.activeElement)) {
      hide();
    }
  };

  const style: CSSProperties | undefined = position
    ? { left: position.left, top: position.top }
    : undefined;

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex shrink-0"
        aria-describedby={visible ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={handleMouseLeave}
        onFocusCapture={show}
        onBlurCapture={handleBlur}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <span
            ref={tooltipRef}
            id={id}
            role="tooltip"
            style={style}
            data-placement={position?.placement}
            className={`pointer-events-none fixed z-[9999] max-w-72 rounded-lg border border-white/10 bg-slate-950/95 px-2.5 py-1.5 text-center text-[11px] font-medium normal-case tracking-normal text-white shadow-xl backdrop-blur-xl transition-opacity duration-150 data-[placement=bottom]:origin-top data-[placement=top]:origin-bottom dark:border-white/15 dark:bg-slate-100/95 dark:text-slate-950 ${position ? "opacity-100" : "opacity-0"}`}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  );
};
