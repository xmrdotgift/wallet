<template>
    <el-input
        v-model="text"
        readonly="true"
        size="large"
    >
        <template #append>
            <el-tooltip content="Copied to clipboard!" trigger="click" auto-close="1000" placement="top">
                <el-button @click="copyToClipboard">
                    <el-icon>
                        <CopyDocument />
                    </el-icon>
                </el-button>
            </el-tooltip>
        </template>
    </el-input>
</template>

<style scoped>

</style>

<script>
export default {
    name: "CopyInput",

    props: {
        text: String,
    },

    methods: {
        copyToClipboard() {
            console.log("copy to clipboard")
            navigator.clipboard.writeText(this.text)
        }
    }
}
</script>