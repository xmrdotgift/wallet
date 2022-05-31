<template>
    <el-card v-if="currentCard == 'balance'" class="box-card">
        <template #header>
            <div class="card-header">
                <h1 class="brand">xmr.gift wallet</h1>
            </div>
        </template>

        <el-row>
            <el-col class="text-center">
                <h2>{{ formatBalance }} XMR</h2>
            </el-col>
        </el-row>

        <el-row>
            <el-col class="text-center">
                <el-button v-if="$props.status.action == 'loading'" type="primary" loading>Loading</el-button>

                <el-button v-if="$props.status.action == 'connecting'" type="primary" loading>Connecting</el-button>

                <el-button v-if="$props.status.action == 'syncing'" type="warning" loading>Synchronizing <span v-if="$props.status.progress > 0">&nbsp;{{ $props.status.progress }}%</span></el-button>

                <el-button v-if="$props.status.action != 'loading'" @click="currentCard = 'deposit'" type="primary">Deposit</el-button>

                <el-tooltip v-if="$props.status.action == 'ready' && !$props.status.empty" effect="dark" :disabled="$props.status.unlocked" content="The balance hasn't been fully unlocked yet. This process is automatic, but may take up to 20 minutes." placement="top-start">
                    <el-button :disabled="!$props.status.unlocked" @click="currentCard = 'redeem'" type="success">Redeem</el-button>
                </el-tooltip>
            </el-col>
        </el-row>
    </el-card>

    <deposit-card
            v-if="currentCard == 'deposit'"
            @back="currentCard = 'balance'"
            :address="address"
    ></deposit-card>

    <redeem-card
            v-if="currentCard == 'redeem'"
            @back="currentCard = 'balance'"
            :redeemBalanceFunc="sendTransaction"
    ></redeem-card>
</template>

<style scoped>
    h1, h2 {
        margin:0.75em;
    }

    .brand {
        margin:0;
        display:inline-block;
    }
</style>

<script>
    import { MoneroUtils } from "monero-javascript"
    import RedeemCard from "./RedeemCard.vue"
    import DepositCard from "./DepositCard.vue"

    export default {
        name: "Wallet",

        components: {
            "redeem-card": RedeemCard,
            "deposit-card": DepositCard,
        },

        props: {
            balance: String,
            unlockedBalance: String,
            address: String,
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

        computed: {
            formatBalance() {
                return MoneroUtils.atomicUnitsToXmr(this.balance)
            },
        },
    }
</script>