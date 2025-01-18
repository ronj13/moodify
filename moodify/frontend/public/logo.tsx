import { IconSvgProps } from "../types/index";
import React from "react";

export const NextUILogo: React.FC<IconSvgProps> = (props) => {
    const { width, height = 40 } = props;

    // Base64 encoded SVG
    const base64SVG = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNjQgNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIzLjcyNyAxNi40MDN2MjQuMTM0YTguMjk2IDguMjk2IDAgMCAwLTQuMzUtMS4yMzNjLTQuNjEyIDAtOC4zNTMgMy43NC04LjM1MyA4LjM0OWE4LjM1NCA4LjM1NCAwIDAgMCA4LjM1MyA4LjM1NGM0LjYxIDAgOC4zNDktMy43MzkgOC4zNS04LjM1MlYyNS4xNTFsMjEuMjUtNi4xMDlWMzMuMzNhOC4yOTYgOC4yOTYgMCAwIDAtNC4zNS0xLjIzM2MtNC42MTQgMC04LjM1MyAzLjczOS04LjM1MyA4LjM0OGE4LjM1NCA4LjM1NCAwIDAgMCA4LjM1MyA4LjM1NGM0LjM0NCAwIDcuOTE0LTMuMzI1IDguMzEtNy41N2guMDRWNy45OTNsLTI5LjI1IDguNDF6IiBmaWxsPSIjZWIwMDNmIi8+PC9zdmc+";

    return (
        <svg width={width} height={height} viewBox="0 0 68 65" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            <rect width="68" height="65" fill="url(#pattern0_4_62)"/>
            <defs>
                <pattern id="pattern0_4_62" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use xlinkHref="#image0_4_62" transform="matrix(0.002 0 0 0.00209231 0 -0.0230769)"/>
                </pattern>
                <image id="image0_4_62" width="500" height="500" xlinkHref={base64SVG}/>
            </defs>
        </svg>
    );
};