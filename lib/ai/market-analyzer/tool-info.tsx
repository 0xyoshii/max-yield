import { Coins, GalleryHorizontalEnd, Wallet } from "lucide-react";
import Image from "next/image";

const imageProps = {
    width: 64,
    height: 64,
    className: "rounded-full h-4 w-4",
};

const toolInfo = {

    "view_moonwell_markets": {
      loading: "Fetching Moonwell Markets...",
      title: "Fetched Moonwell Markets",
      icon: <Image src="/images/moonwell.png" alt="Moonwell" {...imageProps} />,
  },

    "view_moonwell_market": {
        loading: "Fetching Moonwell Market...",
        title: "Fetched Moonwell Market",
        icon: <Image src="/images/moonwell.png" alt="Moonwell" {...imageProps} />,
    },

    "view_morpho_markets": {
      loading: "Fetching Morpho Markets...",
      title: "Fetched Morpho Markets",
      icon: <Image src="/images/moonwell.png" alt="Moonwell" {...imageProps} />,
  },

    "view_morpho_market": {
      loading: "Fetching Morpho Market...",
      title: "Fetched Morpho Market",
      icon: <Image src="/images/moonwell.png" alt="Moonwell" {...imageProps} />,
  },
} as const;

export const getAnalyzerToolInfo = (toolName: string) => {
    if (toolName in toolInfo) {
        return toolInfo[toolName as keyof typeof toolInfo];
    }
    return null;
}