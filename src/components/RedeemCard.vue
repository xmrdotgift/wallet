<template>
    <el-card class="box-card">
        <template #header>
            <el-page-header content="Redeem Monero" @back="$emit('back')"></el-page-header>
        </template>

        <div v-if="!isDone">
            <div v-if="step == 3">
                <p>To redeem Monero in this wallet, you are going to need a private wallet. Go to <a href="https://monero.com/wallets" target="_blank">Monero.com</a> to create a private wallet for free.</p>

                <p>Here are some things to keep in mind:</p>

                <ul>
                    <li>Always copy &amp; paste your address.</li>
                    <li>The transaction is unreversable. Make sure to double-check your address.</li>
                    <li>You will see the Monero in your private wallet within a few minutes of submitting the transaction.</li>
                </ul>

                <el-form :model="form">
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
                    <el-button v-if="step == maxStep" :disabled="form.address === ''" :loading="isInProgress" @click="redeemBalance" type="success">Send to my wallet</el-button>
                </el-col>
            </el-row>
        </div>

        <div v-if="isDone">
            <el-result
                    icon="success"
                    title="Monero have been sent to your wallet!"
            >
            </el-result>

            <div class="text-center">
                <h3>What's next?</h3>
                <p>Monero is money so best is to spend it!</p>
                    <p>To give you some ideas what you can purchase <strong>today</strong>, visit AcceptedHere's
                    <a href="https://acceptedhere.io/catalog/currency/xmr/" target="_blank">catalog of businesses accepting Monero</a>.</p>
            </div>
        </div>
    </el-card>
</template>

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