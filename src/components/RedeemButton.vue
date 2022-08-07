<template>
    <el-tooltip effect="dark" :disabled="tooltipDisabled" :content="tooltipContent" placement="top-start">
        <el-button :disabled="buttonDisabled" @click="$emit('click')" round>
            <el-icon>
                <Upload />
            </el-icon>
            <span>Redeem</span>
        </el-button>
    </el-tooltip>
</template>
<script>
    export default {
        name: "RedeemButton",

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
                if(this.$props.status.action === "syncing") {
                    return "Wallet is synchronizing."
                }
                if(this.$props.status.empty === true) {
                    return "Wallet is empty."
                }
                if(this.$props.status.unlocked === false) {
                    return "The balance hasn't been fully unlocked yet. This may take up to 20 minutes."
                }
                return "Wallet is not ready yet."
            },

            tooltipDisabled() {
                return !this.buttonDisabled
            },

            buttonDisabled() {
                return this.$props.status.empty || !this.$props.status.unlocked
            }
        },
    }
</script>