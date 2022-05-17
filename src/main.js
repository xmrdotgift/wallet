import { createApp } from "vue"
import App from "./App.vue"

import ElementPlus from "element-plus"
import "element-plus/theme-chalk/index.css"
import "element-plus/theme-chalk/dark/css-vars.css"

// Components
import Wallet from "./components/Wallet.vue"

const app = createApp(App)
app.use(ElementPlus)
app.component("wallet", Wallet)
app.mount("#app")