import React, { LegacyRef, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

export interface OverlaySpinnerPropsType {
  show: boolean;
  queryElement?: string;
  style?: React.CSSProperties;
  className?: string;
  backgroundColor?: string;
  opacity?: string | number;
  backdropBlur?: number;
  weight?: number | string;
  textSpinner?: string;
  width?: number;
  textColor?: string;
  variant?: string;
  displaySpinner?: boolean;
  position?: "fixed" | "absolute";
};

export function OverlaySpinner({
  backgroundColor,
  opacity,
  backdropBlur,
  style,
  className,
  queryElement,
  show,
  textSpinner,
  weight,
  width,
  textColor,
  variant,
  displaySpinner = true,
  position = "absolute"
}: OverlaySpinnerPropsType) {
  const [foundElement, setFoundElement] = useState(false);

  const defaultStyle: React.CSSProperties = {
    position,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: `blur(${backdropBlur || 0.7}px)`,
    backgroundColor: backgroundColor || "rgba(0, 0, 0, .15)",
    opacity: opacity || 1,
    ...style,
  };

  const dots = <div className="mx-auto dot-flashing"></div>

  useEffect(() => {
    const parentElement = document.querySelector(
      queryElement || "#noElementEmpty"
    ) as HTMLElement;

    if (show && parentElement) {
      parentElement.classList.add("position-relative");
      setFoundElement(true);
    }
  }, [queryElement, show]);

  return (
    show ?
    <div
      id="wm-spinner"
      className={`${className} ${show ? "visible" : "invisible"} notPrint`}
      style={{
        ...defaultStyle
      }}
    >
      <div className="text-center">
        {displaySpinner && (
          <div className="d-flex">
            {dots}
          </div>
        )}

        {textSpinner && (
          <p
            className="my-3"
            style={{
              color: textColor,
            }}
          >
            {textSpinner.toUpperCase()}
          </p>
        )}
      </div>
    </div>
    :
  null
  );
}
