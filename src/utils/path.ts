import parse from "parse-svg-path";
import abs from "abs-svg-path";

// subpath를 분리
export function splitIntoSubpaths(pathStr: string): string[] {
    const commands = abs(parse(pathStr));

    const subpaths: string[] = [];

    let current: string[][] = [];

    for (const cmd of commands) {
        const [type, ...args] = cmd;

        if (type.toUpperCase() === "M" && current.length > 0) {
            subpaths.push(current.map((c) => c.join(" ")).join(" "));
            current = [];
        }
        current.push([type, ...args]);
    }

    if (current.length > 0) {
        subpaths.push(current.map((c) => c.join(" ")).join(" "));
    }

    return subpaths;
}
