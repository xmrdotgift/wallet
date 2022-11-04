<template>
    <el-container>
        <el-header>
            <status-panel
                :status="status"
            >
            </status-panel>
        </el-header>

        <el-main>
            <balance-card
                v-if="currentCard == 'balance'"
                :balance="balance"
                :status="status"
            >
            </balance-card>

            <deposit-card
                v-if="currentCard == 'deposit'"
                @back="currentCard = 'balance'"
                :address="address"
                :qrSize="200"
            ></deposit-card>

            <redeem-card
                v-if="currentCard == 'redeem'"
                @back="currentCard = 'balance'"
                :redeemBalanceFunc="sendTransaction"
            ></redeem-card>

            <share-card
                v-if="currentCard == 'share'"
                @back="currentCard = 'balance'"
                :walletParams="params"
                :qrSize="200"
            ></share-card>
        </el-main>

        <el-footer v-if="currentCard == 'balance'">
            <el-card class="box-card">
                <el-row>
                    <el-col :span="8">
                        <deposit-button :status="$props.status" @click="currentCard = 'deposit'"></deposit-button>
                    </el-col>
                    <el-col :span="8" class="text-center">
                        <share-button :status="$props.status" @click="currentCard = 'share'"></share-button>
                    </el-col>
                    <el-col :span="8" class="text-right">
                        <redeem-button :status="$props.status" @click="currentCard = 'redeem'"></redeem-button>
                    </el-col>
                </el-row>
            </el-card>
        </el-footer>
    </el-container>
</template>

<style>
    .el-button {
        border:0 !important;
        color:var(--el-text-color-regular) !important;
        font-size:0.90em;
    }

    .el-button:disabled {
        color:var(--el-text-color-disabled) !important;
    }
</style>

<style scoped>
    .el-container {
        display:flex;
        flex-direction: column;
        height:100%;
    }

    .el-header {
        flex-grow:0;
        flex-shrink:0;
        margin-top:0.5em;
    }

    .el-main {
        flex-grow: 1;
        margin-top:1em;
    }

    .el-footer {
        flex-grow: 0;
        flex-shrink: 0;
        min-height:5em;
    }
</style>

<script>
    import BalanceCard from "./BalanceCard.vue"
    import RedeemCard from "./RedeemCard.vue"
    import RedeemButton from "./RedeemButton.vue"
    import DepositCard from "./DepositCard.vue"
    import ShareCard from "./ShareCard.vue"
    import DepositButton from "./DepositButton.vue"
    import StatusPanel from "./StatusPanel.vue"
    import ShareButton from "./ShareButton.vue"

    export default {
        name: "Wallet",

        components: {
            "redeem-card": RedeemCard,
            "redeem-button": RedeemButton,
            "deposit-card": DepositCard,
            "deposit-button": DepositButton,
            "share-card": ShareCard,
            "share-button": ShareButton,
            "balance-card": BalanceCard,
            "status-panel": StatusPanel,
        },

        props: {
            balance: String,
            unlockedBalance: String,
            address: String,
            params: String,
            status: Object,
            sendTransactionFunc: Function,
        },

        data() {
            return {
                currentCard: "balance"
            }
        },

        methods: {
            async sendTransaction(address) {
                console.log("send transaction")
                return this.$props.sendTransactionFunc(address)
            }
        },
    }
</script>