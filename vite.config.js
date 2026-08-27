var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
/**
 * Preload the hashed entry chunks and make the main stylesheet non-blocking.
 *
 * Critical above-the-fold CSS is inlined in `index.html`, so the full
 * stylesheet does not need to block first paint. We swap it to a
 * `media="print"` + `onload` pattern (with a `<noscript>` fallback) and add
 * `preload`/`modulepreload` hints so both assets still download immediately.
 */
function assetLoadingOptimizations() {
    return {
        name: 'asset-loading-optimizations',
        transformIndexHtml: function (html, ctx) {
            var bundle = ctx.bundle;
            if (!bundle)
                return html;
            var cssFiles = [];
            var jsEntries = [];
            for (var _i = 0, _a = Object.entries(bundle); _i < _a.length; _i++) {
                var _b = _a[_i], name_1 = _b[0], chunk = _b[1];
                if (chunk.type === 'asset' && name_1.endsWith('.css'))
                    cssFiles.push(chunk.fileName);
                if (chunk.type === 'chunk' && chunk.isEntry && chunk.fileName.endsWith('.js'))
                    jsEntries.push(chunk.fileName);
            }
            var out = html;
            // Make each emitted stylesheet non-blocking.
            for (var _c = 0, cssFiles_1 = cssFiles; _c < cssFiles_1.length; _c++) {
                var file = cssFiles_1[_c];
                var blocking = new RegExp("<link[^>]*rel=\"stylesheet\"[^>]*href=\"/".concat(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "\"[^>]*>"));
                out = out.replace(blocking, "<link rel=\"stylesheet\" crossorigin href=\"/".concat(file, "\" media=\"print\" onload=\"this.media='all';this.onload=null\">")
                    + "<noscript><link rel=\"stylesheet\" crossorigin href=\"/".concat(file, "\"></noscript>"));
            }
            var hints = __spreadArray(__spreadArray([], cssFiles.map(function (f) { return "<link rel=\"preload\" as=\"style\" href=\"/".concat(f, "\">"); }), true), jsEntries.map(function (f) { return "<link rel=\"modulepreload\" href=\"/".concat(f, "\">"); }), true);
            if (hints.length > 0)
                out = out.replace('</head>', "    ".concat(hints.join('\n    '), "\n  </head>"));
            return out;
        },
    };
}
// https://vitejs.dev/config/
export default defineConfig(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, ({
                plugins: [
                    vue(),
                    tailwindcss(),
                    assetLoadingOptimizations(),
                    VitePWA({
                        registerType: 'autoUpdate',
                        includeAssets: [
                            'favicon.svg',
                            'icon.svg',
                            'icon-light.svg',
                            'icon-dark.svg',
                            'apple-touch-icon.png',
                            'apple-touch-icon-dark.png',
                            'pwa-192x192.png',
                            'pwa-192x192-dark.png',
                            'pwa-512x512.png',
                            'pwa-512x512-dark.png',
                            'og-image.png',
                            'og-image-light.png',
                            'og-image-dark.png',
                            'robots.txt',
                        ],
                        manifest: {
                            name: 'Maina Voice',
                            short_name: 'MainaVoice',
                            description: 'Speech-to-text dictation and multi-engine speed benchmarking with local IndexedDB storage.',
                            theme_color: '#141414',
                            background_color: '#141414',
                            display: 'standalone',
                            orientation: 'any',
                            start_url: '/',
                            scope: '/',
                            categories: ['utilities', 'productivity', 'speech-to-text'],
                            icons: [
                                {
                                    src: 'pwa-192x192.png',
                                    sizes: '192x192',
                                    type: 'image/png',
                                },
                                {
                                    src: 'pwa-512x512.png',
                                    sizes: '512x512',
                                    type: 'image/png',
                                },
                                {
                                    src: 'pwa-maskable-512x512.png',
                                    sizes: '512x512',
                                    type: 'image/png',
                                    purpose: 'maskable',
                                },
                            ],
                        },
                        workbox: {
                            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                        },
                    }),
                ],
                resolve: {
                    alias: {
                        '@': path.resolve(__dirname, './src'),
                    },
                },
                envPrefix: ['VITE_'],
                server: {
                    port: 5173,
                },
            })];
    });
}); });
