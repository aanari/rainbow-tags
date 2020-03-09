module.exports = {
  env: {
	"browser": false,
	"commonjs": true,
	"es6": true,
	"node": true
	},
  extends: [
    'standard'
	],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
	},
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
	},
	"ignorePatterns": [
		"**/assets/js/*"
	],
  rules: {
		"indent": [
			"warn",
			2
		],
		"no-unused-vars": 0,
		"padded-blocks": 1,
		"no-multiple-empty-lines": 1,
		"padded-blocks": 1,
		"prefer-const": 0,
		"quotes": 1,
		"space-before-blocks": 1,
		"eol-last": 1,
		"space-before-function-paren": 1,
		"no-multi-spaces": 1,
		"space-in-parens": 1,
		"comma-spacing": 1,
		"space-infix-ops": 1,
		"comma-dangle": 1,
		"camelcase": 0,
		"semi": [
			1,
			"never"
		],
		"no-trailing-spaces": "warn"
	}
}