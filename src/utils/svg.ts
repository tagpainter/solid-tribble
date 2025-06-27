export async function loadSvg(url: string) {
    const res = await fetch(url);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    return doc.querySelector("svg")!;
}

export function svgToUrl(svg: SVGElement) {
    const string = svg.outerHTML;
    const encoded = encodeURIComponent(string).replace(/'/g, "%27").replace(/"/g, "%22");
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
}
