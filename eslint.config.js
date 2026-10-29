import globals from 'globals';
import react from 'eslint-plugin-react';
export default [{ignores:['node_modules/**','dist/**']},{files:['src/**/*.{js,jsx}'],languageOptions:{ecmaVersion:'latest',sourceType:'module',globals:{...globals.browser},parserOptions:{ecmaFeatures:{jsx:true}}},plugins:{react},rules:{'no-undef':'error','no-dupe-keys':'error','no-unreachable':'error','react/jsx-no-undef':'error'}}];
