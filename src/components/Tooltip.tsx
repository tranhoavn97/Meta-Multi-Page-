import React, { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  description?: string;
  children: ReactNode;
  side?: "right" | "left" | "top" | "bottom";
  disabled?: boolean;
  delay?: number;
}

export default function Tooltip({
  content,
  description,
  children,
  side = "right",
  disabled = false,
  delay = 250,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
    setTimeout(() => setShouldRender(false), 160);
  };

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      if (side === "right") {
        top = rect.top + rect.height / 2;
        left = rect.right + 10;
      } else if (side === "bottom") {
        top = rect.bottom + 10;
        left = rect.left + rect.width / 2;
      } else if (side === "top") {
        top = rect.top - 10;
        left = rect.left + rect.width / 2;
      } else if (side === "left") {
        top = rect.top + rect.height / 2;
        left = rect.left - 10;
      }

      setCoords({ top, left });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) updatePosition();
    };
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible]);

  // Handle unmount cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const child = React.Children.only(children) as React.ReactElement;
  const clone = React.cloneElement(child, {
    // @ts-ignore
    ref: triggerRef,
    onMouseEnter: (e: any) => {
      handleMouseEnter();
      if (child.props.onMouseEnter) child.props.onMouseEnter(e);
    },
    onMouseLeave: (e: any) => {
      handleMouseLeave();
      if (child.props.onMouseLeave) child.props.onMouseLeave(e);
    },
    onFocus: (e: any) => {
      handleMouseEnter();
      if (child.props.onFocus) child.props.onFocus(e);
    },
    onBlur: (e: any) => {
      handleMouseLeave();
      if (child.props.onBlur) child.props.onBlur(e);
    },
    "aria-label": !disabled ? content : undefined,
  });

  return (
    <>
      {clone}
      {shouldRender &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={`fixed z-[9999] pointer-events-none transition-all duration-150 ease-out whitespace-nowrap
              ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
            `}
            style={{
              top: side === "right" || side === "left" ? coords.top : side === "bottom" ? coords.top : "auto",
              bottom: side === "top" ? window.innerHeight - coords.top : "auto",
              left: side === "bottom" || side === "top" ? coords.left : side === "right" ? coords.left : "auto",
              right: side === "left" ? window.innerWidth - coords.left : "auto",
              transform: 
                side === "right" ? `translate(${isVisible ? '0' : '-4px'}, -50%)` :
                side === "left" ? `translate(${isVisible ? '0' : '4px'}, -50%)` :
                side === "bottom" ? `translate(-50%, ${isVisible ? '0' : '-4px'})` :
                `translate(-50%, ${isVisible ? '0' : '4px'})`
            }}
          >
            <div 
              className="relative rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] px-[10px] py-[7px]"
              style={{
                backgroundColor: "rgba(8, 15, 30, 0.94)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.12)"
              }}
            >
              <div className="flex flex-col gap-[2px]">
                <span className="text-[11px] font-bold text-white leading-none">
                  {content}
                </span>
                {description && (
                  <span className="text-[9px] text-slate-400 leading-none">
                    {description}
                  </span>
                )}
              </div>

              {/* Triangle Arrow Base */}
              <div 
                className="absolute w-0 h-0 pointer-events-none"
                style={{
                  ...(side === "right" && {
                    left: "-4px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    borderTop: "4px solid transparent",
                    borderBottom: "4px solid transparent",
                    borderRight: "4px solid rgba(255,255,255,0.12)"
                  }),
                  ...(side === "left" && {
                    right: "-4px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    borderTop: "4px solid transparent",
                    borderBottom: "4px solid transparent",
                    borderLeft: "4px solid rgba(255,255,255,0.12)"
                  }),
                  ...(side === "top" && {
                    bottom: "-4px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderTop: "4px solid rgba(255,255,255,0.12)"
                  }),
                  ...(side === "bottom" && {
                    top: "-4px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderBottom: "4px solid rgba(255,255,255,0.12)"
                  })
                }}
              >
                {/* Inner triangle to match bg */}
                <div 
                  className="absolute w-0 h-0 pointer-events-none"
                  style={{
                    ...(side === "right" && {
                      left: "1px",
                      top: "-3px",
                      borderTop: "3px solid transparent",
                      borderBottom: "3px solid transparent",
                      borderRight: "3px solid rgba(8, 15, 30, 0.94)"
                    }),
                    ...(side === "left" && {
                      right: "1px",
                      top: "-3px",
                      borderTop: "3px solid transparent",
                      borderBottom: "3px solid transparent",
                      borderLeft: "3px solid rgba(8, 15, 30, 0.94)"
                    }),
                    ...(side === "top" && {
                      bottom: "1px",
                      left: "-3px",
                      borderLeft: "3px solid transparent",
                      borderRight: "3px solid transparent",
                      borderTop: "3px solid rgba(8, 15, 30, 0.94)"
                    }),
                    ...(side === "bottom" && {
                      top: "1px",
                      left: "-3px",
                      borderLeft: "3px solid transparent",
                      borderRight: "3px solid transparent",
                      borderBottom: "3px solid rgba(8, 15, 30, 0.94)"
                    })
                  }}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
