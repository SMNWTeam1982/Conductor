// This is just to reduce clutter in components
// I could do these inline in a couple cases but this makes life easier

export const mainConsoleStyle = {
    width: "330px",
    height: "200px",
    color: "#fff",
    marginTop: "1.5rem"
}

export function windowedConsoleStyle(windowSize: {width: number; height: number} | null) {
    let width = 800;
    let height = 220;
    let margin = 8;
    if (windowSize && (windowSize.height != 320 || windowSize.width != 820)) {
        width = windowSize.width * (800/820)
        height = windowSize.height * (220/280) - 30
        margin = (width % height) / 20
    }
    return {
        margin: margin + "px",
        width: width + "px",
        height: height + "px"
    };
}

export const consoleItemStyle = {
    minHeight: "20px"
};

export const successStyle = {
    color: "#00BC8C"
}

export const failStyle = {
    color: "#E74C3C"
}