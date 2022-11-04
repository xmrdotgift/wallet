<template>
    <el-tooltip effect="dark" :disabled="tooltipDisabled" :content="tooltipContent" placement="top-start">
        <el-button :disabled="buttonDisabled" @click="$emit('click')" round>
            <el-icon>
                <Share />
            </el-icon>
            <span>Share</span>
        </el-button>
    </el-tooltip>
</template>
<script>
    export default {
        name: "ShareButton",

        props: {
            status: Object,
        },

        emits: [
            "click"
        ],

        computed: {
            tooltipContent() {
                if(this.$props.status.action === "error") {
                    return "Wallet error."
                }
                if(this.$props.status.action === "loading") {
                    return "Wallet is loading."
                }
            },

            tooltipDisabled() {
                return !this.buttonDisabled
            },

            buttonDisabled() {
                const action = this.$props.status.action
                return action === "loading" || action === "error"
            }
        },
    }
</script>