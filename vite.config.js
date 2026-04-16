import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteMockServe } from 'vite-plugin-mock'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, process.cwd())

    const useMock = env.VITE_USE_MOCK === 'true'
    const isDev = command === 'serve'

    console.log(`[Vite] Mode: ${mode}, Command: ${command}, UseMock: ${useMock}`)

    return {
        plugins: [
            vue(),
            AutoImport({
                resolvers: [ElementPlusResolver()],
            }),
            Components({
                resolvers: [ElementPlusResolver()],
            }),
            viteMockServe({
                mockPath: 'mock',
                localEnabled: isDev && useMock,
                prodEnabled: false,
                logger: isDev,
            }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
        },
        server: {
            port: 5176,
            host: '0.0.0.0',
            open: true,
            // 代理配置：将 /api 请求转发到后端
            proxy: {
                '/api': {
                    target: 'http://localhost:8080/wisdom-classroom',
                    changeOrigin: true,
                    timeout: 300000,
                    proxyTimeout: 300000,
                    rewrite: (path) => path,  // 保持 /api 前缀
                },
            },
        },
        build: {
            outDir: 'dist',
            assetsDir: 'assets',
            sourcemap: false,
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vue-vendor': ['vue', 'vue-router', 'pinia'],
                        'element-plus': ['element-plus'],
                        'echarts': ['echarts'],
                    },
                },
            },
        },
    }
})
