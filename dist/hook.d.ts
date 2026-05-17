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

interface SessionData {
    directives: string[];
}
interface SessionUpdateResult {
    session: SessionData;
    added: string[];
    rejected: string[];
    removed: string[];
    cleared: boolean;
}

interface ProcessResult {
    output: string | null;
    sessionUpdate: SessionUpdateResult | null;
}
declare function processPrompt(prompt: string, config: HotmarksConfig, cwd?: string): string | null;

export { type ProcessResult, processPrompt };
