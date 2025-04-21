import { defineEslint } from "@yx1126/eslint-config";

export default defineEslint({
    yaml: true,
    jsonc: true,
    package: true,
    deprecated: true,
    vue: {
        v2: true
    },
    flatESLintConfig: [{
        rules: {
            "no-console": "off",
            "vue/require-explicit-emits": "off",
            "vue/no-deprecated-v-on-native-modifier": "off",
            "vue/no-deprecated-events-api": "off",
            "vue/require-prop-types": "off"
        }
    }]
});