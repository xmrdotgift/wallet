<template>
    <h2>Wallet</h2>

    <el-card class="box-card">
        <el-row>
            <el-col :span="24">Balance</el-col>
        </el-row>
        <el-row>
            <el-col :span="12">
                <h2>{{ formatBalance }}</h2>
            </el-col>
            <el-col :span="12" class="text-right">
                <h2>XMR</h2>
            </el-col>
        </el-row>
    </el-card>
</template>

<style scoped>
    .el-card h2 {
        margin-bottom:0;
    }

    .el-card {
        padding:0.5em 0 0.5em 0;
    }
</style>

<script>
    import { MoneroUtils } from "monero-javascript"

    export default {
        Name: "BalanceCard",

        props: {
            balance: String,
            status: Object,
        },

        computed: {
            formatBalance() {
                return MoneroUtils.atomicUnitsToXmr(this.balance).toFixed(8)
            },
        },
    }
</script>