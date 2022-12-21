import { createApp } from "vue"
import App from "./App.vue"

import ElementPlus from "element-plus"
import * as ElementPlusIcons from "@element-plus/icons-vue"

import "element-plus/theme-chalk/index.css"
import "element-plus/theme-chalk/dark/css-vars.css"

const app = createApp(App)
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIcons)) {
    app.component(key, component)
}
app.mount("#app")