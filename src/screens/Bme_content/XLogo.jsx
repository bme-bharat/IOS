import React from "react";
import Svg, { Path } from "react-native-svg";

export default function XLogo({ size = 18, color = "#000" }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        fill={color}
        d="M18.244 2H21.5l-7.5 8.5L22 22h-6.75l-5.25-7L4.5 22H1.244l7.938-9-7.5-11h6.75l4.875 7L18.244 2z"
      />
    </Svg>
  );
}
