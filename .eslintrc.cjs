/* eslint-env node */
module.exports = {
    root: true,
    extends: [
        "plugin:vue/recommended",
        "eslint:recommended"
    ],
    parser: "vue-eslint-parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
            jsx: true
        }
    },
    rules: {
        "vue/html-indent": ["error", 4],
        "indent": ["error", 4],
        "vue/html-quotes": ["error", "double"],
        "quotes": ["error", "double", { "allowTemplateLiterals": true }],
        "vue/max-attributes-per-line": "off"
    }
}
