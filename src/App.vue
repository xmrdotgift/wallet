<template>
    <el-container>
        <el-row>
            <el-col :span="24">
                <el-alert v-if="error" :title="error.message" type="error" />
            </el-col>
        </el-row>

        <el-header>
            <h1>xmr.gift wallet</h1>
        </el-header>

        <el-main>
            <el-row>
                <el-col :span="24" class="text-right">
                    <el-tag v-if="config.networkType == 1" type="warning">TESTNET</el-tag>
                    <el-tag v-if="config.networkType == 2" type="warning">STAGENET</el-tag>
                </el-col>
            </el-row>

            <wallet
                    :balance="balance"
                    :unlockedBalance="unlockedBalance"
                    :address="primaryAddress"
                    :isLoaded="isLoaded"
                    :isConnected="isConnected"
                    :isSynced="isSynced"
                    :syncProgress="syncProgress"
                    :sendTransactionFunc="sweepUnlockedBalance"
            ></wallet>
        </el-main>
    </el-container>
</template>

<style>
    .el-container {
        max-width:30rem;
        margin:0 auto;
    }

    body {
        font-family:sans-serif;
        font-size:17px;
        line-height:1.25rem;
    }

    .text-right {
        text-align:right;
    }

    .text-center {
        text-align:center;
    }

    li {
        margin:0;
        padding:0.25rem;
    }
</style>

<script>
    import monerojs from "monero-javascript"
    import moneroutils from "./moneroutils"
    import urlparams from "./urlparams"
    import hash from "./hash"
    import {ErrorInvalidMoneroAddress, ErrorInvalidRestoreHeight, ErrorInvalidNetworkType, ErrorInvalidSeed} from "./errors"

    const proxyToWorker = true
    const daemonConnectionTimeout = 40000
    const daemonCheckPeriod = 10000
    const daemonSyncPeriod = 30000
    const defaultNetworkType = monerojs.MoneroNetworkType.STAGENET

    const nodes = [
        // Mainnet
        [
            "https://mainnet.xmr.gift:443",
        ],
        // Testnet
        [
            "https://testnet.xmr.gift:443",
        ],
        // Stagenet
        [
            "https://node.xmr.gift:443",
        ],
    ]

    export default {
        name: "App",

        data() {
            return {
                config: {},
                wallet: null,
                primaryAddress: null,
                isSynced: false,
                isConnected: false,
                syncProgress: 0,
                balance: "0",
                error: null,
                unlockedBalance: "0",
            };
        },

        computed: {
            isLoaded() {
                return this.wallet !== null
            }
        },

        methods: {
            newConnectionManager(nodeUris) {
                const connectionManager = new monerojs.MoneroConnectionManager(proxyToWorker)
                connectionManager.addListener(this)
                connectionManager.setTimeout(daemonConnectionTimeout)
                connectionManager.setAutoSwitch(true)

                for (let i = 0; i < nodeUris.length; i++) {
                    const connection = new monerojs.MoneroRpcConnection({
                        uri: nodeUris[i],
                        proxyToWorker: proxyToWorker,
                    })
                    connectionManager.addConnection(connection)
                }

                return connectionManager
            },

            newWalletConfig(networkType, seed) {
                let config = {
                        language: 'English',
                        networkType: networkType,
                        // Password cannot be empty a dummy password will do.
                        password: 'walletPassword',
                        proxyToWorker: proxyToWorker,
                }
                if (seed !== '') {
                    const val = moneroutils.deriveAddressAndKeys(networkType, seed)
                    config = {
                        ...config,
                        ...{
                            primaryAddress: val[0],
                            privateViewKey: val[1],
                            privateSpendKey: val[2],
                        },
                    }
                }
                return config
            },

            async newWallet(config) {
                const wallet = await monerojs.createWalletFull(config)
                await wallet.addListener(this)
                return wallet
            },

            async sweepUnlockedBalance(address) {
                console.debug("sweepUnlockedBalance", address)
                if (!monerojs.MoneroUtils.isValidAddress(address, this.config.networkType)) {
                    throw new ErrorInvalidMoneroAddress("Invalid Monero address")
                }
                return this.wallet.sweepUnlocked({
                    address: address,
                    relay: true,
                })
            },

            // MoneroWalletListener interface implementation
            onSyncProgress(height, startHeight, endHeight, percentDone) {
                this.syncProgress = parseInt(percentDone * 100)
                this.isSynced = (this.syncProgress === 100)
                console.debug("[event] sync", this.syncProgress, "%")
            },

            onBalancesChanged(newBalance, newUnlockedBalance) {
                this.balance = newBalance.toString(10)
                this.unlockedBalance = newUnlockedBalance.toString(10)
                console.debug("[event] balance", this.balance, "/", this.unlockedBalance)
            },

            onNewBlock(){},
            onOutputReceived(){},
            onOutputSpent(){},

            // MoneroConnectionManagerListener
            async onConnectionChanged(connection){
                this.isConnected = connection.isConnected() === true
                console.debug("[event] connection", this.isConnected)

                if (this.isConnected) {
                    await this.wallet.setDaemonConnection(connection)

                    // getDaemonHeight - 1 is here to prevent this issue:
                    // https://github.com/monero-ecosystem/monero-javascript/issues/76
                    if (this.restoreHeight == null) {
                        this.restoreHeight = await this.wallet.getDaemonHeight() - 1
                        urlparams.setRestoreHeight(this.restoreHeight)
                    }

                    await this.wallet.setSyncHeight(this.restoreHeight)
                    await this.wallet.startSyncing(daemonSyncPeriod)
                } else {
                    await this.wallet.stopSyncing()
                }
            }
        },

        async mounted() {
            // Load wasm keys module to enable MoneroUtils.isValidAddress
            await monerojs.LibraryUtils.loadKeysModule()
            // Override the default path to monero_web_worker.js
            monerojs.LibraryUtils.setWorkerDistPath("./monero_web_worker.js")

            const seed = hash.get()
            // Validate the seed if there's one set
            if (seed !== "") {
                if (!monerojs.MoneroUtils.isValidPrivateSpendKey(seed)) {
                    let error = new ErrorInvalidSeed("Cannot load a wallet: invalid seed!")
                    this.error = error
                    console.error(error)
                    return
                }
            }

            this.restoreHeight = urlparams.getRestoreHeight()
            if (isNaN(this.restoreHeight)) {
                let error = new ErrorInvalidRestoreHeight("Cannot load a wallet: invalid restore height!")
                this.error = error
                console.error(error)
                return
            }

            let networkType = urlparams.getNetworkType(defaultNetworkType)
            if (!monerojs.MoneroNetworkType.isValid(networkType)) {
                let error = new ErrorInvalidNetworkType("Cannot load a wallet: invalid network type!")
                this.error = error
                console.error(error)
                return
            }

            this.config = this.newWalletConfig(networkType, seed)
            this.wallet = await this.newWallet(this.config)
            this.primaryAddress = await this.wallet.getPrimaryAddress()

            const privateSpendKey = await this.wallet.getPrivateSpendKey()
            hash.set(privateSpendKey)

            const connectionManager = this.newConnectionManager(nodes[networkType])
            await connectionManager.startCheckingConnection(daemonCheckPeriod)
        },

        beforeUnmount() {
            this.wallet.close()
        },
    }
</script>
