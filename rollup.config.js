import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import babel from "@rollup/plugin-babel";

const config = {
    input: "src/index.js",
    output: [
        {
            file: "dist/neat-lib.js",
            format: "esm",
        },
        {
            file: "dist/neat-lib.min.js",
            format: "esm",
            plugins: [terser()],
        },
    ],
    plugins: [resolve(), babel({ babelHelpers: "bundled" })],
};

export default config;
