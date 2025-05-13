import {
	defineConfig
} from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import * as sass from 'sass'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		uni(),
	],
	server: {
		port: 5174, // 管理端使用5174端口
		open: true, // 自动打开浏览器
		cors: true // 允许跨域
	},
	css: {
		preprocessorOptions: {
			scss: {
				// 使用 Sass 2.0 的新特性
				additionalData: `
          @use "sass:math";
          @use "sass:color";
          @use "sass:list";
          @use "sass:map";
          @use "sass:selector";
          @use "sass:string";
        `,
				// 使用 dart-sass
				implementation: sass,
				// Sass 2.0 配置
				sassOptions: {
					// 输出样式格式
					style: 'expanded',
					// 禁用 charset
					charset: false,
					// 启用源码映射
					sourceMap: true,
					// 使用新的除法规则
					functions: {
						// 示例：自定义数学函数
						'custom-math-div($a, $b)': (a, b) => {
							return new sass.SassNumber(a.getValue() / b.getValue());
						}
					},
					// 使用新的模块系统
					loadPaths: ['src/styles'],
					// 启用严格模式
					quietDeps: true
				}
			}
		}
	}
})