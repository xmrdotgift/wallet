<template>
    <el-card class="box-card">
        <template #header>
            <el-page-header content="Redeem" @back="$emit('back')"></el-page-header>
        </template>

        <div v-if="!isDone">
            <div v-if="step == 3">
                <p>Paste the address of your private wallet below to redeem Monero in this wallet. Go to <a href="https://monero.com/wallets" target="_blank">Monero.com</a> if you do not have a private wallet and create one for free.</p>

                <p>Here are some things to keep in mind:</p>

                <ul>
                    <li>Always copy &amp; paste your wallet address.</li>
                    <li>A transaction is irreversible. Always double-check your address before sending.</li>
                    <li>You will be seeing Monero in your private wallet shortly after sending. However, it takes about 20 minutes to clear, and before you are able to spend it.</li>
                    <li>Transaction fee is <strong>&lt; €0.01</strong> and will be automatically deduced from the wallet's balance. The fee goes to the volunteers who sustain the Monero network.</li>
                </ul>

                <el-form :model="form" @submit.prevent>
                    <el-form-item label="Destination address" :error="error">
                        <el-input v-model="form.address"></el-input>
                    </el-form-item>
                </el-form>
            </div>

            <el-row justify="end">
                <el-col v-if="step != maxStep" :span="12">
                    <el-button @click="step = maxStep" type="primary">Skip</el-button>
                </el-col>
                <el-col :span="12" class="text-right">
                    <el-button v-if="step > minStep" @click="step -= 1">Back</el-button>
                    <el-button v-if="step != maxStep" @click="step += 1">Next</el-button>
                    <el-button v-if="step == maxStep" :disabled="form.address === ''" :loading="isInProgress" @click="redeemBalance" round>
                        <el-icon>
                            <Promotion />
                        </el-icon>
                       <span>Send</span>
                    </el-button>
                </el-col>
            </el-row>
        </div>

        <div v-if="isDone">
            <el-result
                    icon="success"
            >
            </el-result>

            <div class="text-center">
                <p>What's next? Monero is money so the best is to spend it.</p>
                <p>To give you some idea what you can purchase today, visit AcceptedHere's
                <a href="https://acceptedhere.io/catalog/currency/xmr/" target="_blank">catalog</a> of businesses accepting Monero.</p>
            </div>
        </div>
    </el-card>
</template>

<style scoped>
    ul {
        padding:0 0 0 2em;
        margin-bottom:2em;
    }
    li {
        margin:0;
        padding:0.30em;
    }
</style>

<script>
    import { ErrorInvalidMoneroAddress } from "../errors"

    export default {
        name: "RedeemDialog",

        props: {
            redeemBalanceFunc: Function,
        },

        data() {
            return {
                step: 3,
                minStep: 3,
                maxStep: 3,
                form: {
                    address: ""
                },
                isInProgress: false,
                isDone: false,
                error: null,
            }
        },

        emits: [
            "back"
        ],

        methods: {
            async redeemBalance() {
                console.debug("redeem balance")
                this.form.address = this.form.address.trim()
                if (this.form.address === "") {
                    this.error = Error("You must provide an address").message
                    return
                }
                this.isInProgress = true
                this.$props.redeemBalanceFunc(this.form.address).then(txWallet => {
                    console.debug("redeem balance successful success", txWallet[0])
                    this.isDone = true
                    this.isInProgress = false
                    this.error = null
                }).catch(reason => {
                    console.error("redeem balance failed", reason.toString())
                    this.isInProgress = false
                    if (reason instanceof ErrorInvalidMoneroAddress) {
                        this.error = reason.message
                        return
                    }
                    this.error = Error("Oops, something went wrong.").message
                })
            }
        }
    }
</script>