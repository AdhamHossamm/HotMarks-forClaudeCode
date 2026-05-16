interface HotmarksConfig {
    mode: "reminder" | "transform" | "both";
    markers: {
        directive: string;
        critical: string;
    };
    transformTags: {
        directive: string;
        critical: string;
    };
    skipCodeBlocks: boolean;
}

declare function processPrompt(prompt: string, config: HotmarksConfig): string | null;

export { processPrompt };
