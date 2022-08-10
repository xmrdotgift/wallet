<template>
    <el-container>
        <el-row>
            <el-col :span="24">
                <el-alert v-if="error" :title="error.message" type="error" />
            </el-col>
        </el-row>

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
                    :status="walletStatus"
                    :sendTransactionFunc="sweepUnlockedBalance"
            ></wallet>
        </el-main>
    </el-container>
</template>

<style>
    #app {
        max-width:30rem;
        margin:0 auto;
    }

    body {
        font-family:sans-serif;
        font-size:17px;
        line-height:1.25rem;
        background-color:var(--el-bg-color-page);
        color:var(--el-text-color-primary);
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
    import params from "./params"
    import {ErrorInvalidMoneroAddress, ErrorInvalidRestoreHeight, ErrorInvalidNetworkType, ErrorInvalidSeed} from "./errors"

    const proxyToWorker = true
    const daemonConnectionTimeout = 40000
    const daemonCheckPeriod = 10000
    const daemonSyncPeriod = 30000
    const defaultNetworkType = monerojs.MoneroNetworkType.MAINNET

    const nodes = [
        // Mainnet
        [
            "https://fallacy.fiatfaucet.com:18089",
            "https://dewitte.fiatfaucet.com:443",
            "https://chad.fiatfaucet.com:443",
            "https://xmrnode1.ditatompel.com:443",
            "https://xmr.voidnet.tech:443",
        ],
        // Testnet
        [
            "https://testnet.xmr.ditatompel.com:443",
        ],
        // Stagenet
        [
            "https://stagenet.xmr.ditatompel.com:443",
        ],
    ]

    export default {
        name: "App",

        data() {
            return {
                config: {},
                wallet: null,
                primaryAddress: null,
                isConnected: false,
                syncProgress: 0,
                balance: "0",
                unlockedBalance: "0",
                error: null,
            };
        },

        computed: {
            isLoaded() {
                return this.wallet !== null
            },

            isSynced() {
                return this.syncProgress === 100
            },

            documentTitle() {
                let title = ""
                const status = this.walletStatus
                switch (status.action) {
                    case "loading":
                        title = "Loading..."
                        break

                    case "connecting":
                        title = "Connecting..."
                        break

                    case "syncing":
                        title = "Synchronizing"
                        if(status.progress > 0) {
                            title += " " + status.progress.toString() + "%"
                        } else {
                            title += "..."
                        }
                        break

                    case "ready":
                        title = monerojs.MoneroUtils.atomicUnitsToXmr(this.balance) + " XMR"
                        break
                }
                return [title, this.titleRoot].join(" | ")
            },

            walletStatus() {
                let status = {}
                if ( !this.isLoaded ) {
                    status = {
                        action: "loading",
                    }
                } else if ( !this.isConnected ) {
                    status = {
                        action: "connecting",
                    }
                } else if ( this.isConnected && !this.isSynced ) {
                    status = {
                        action: "syncing",
                        progress: this.syncProgress,
                    }
                } else {
                    status = {
                        action: "ready",
                        unlocked: this.balance === this.unlockedBalance,
                        empty: this.balance === "0",
                    }
                }
                return status
            },
        },

        watch: {
            documentTitle: {
                handler(val){
                    window.document.title = val
                },
                immediate: true,
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
                let isValidAddress = await monerojs.MoneroUtils.isValidAddress(address, this.config.networkType)
                if (!isValidAddress) {
                    throw new ErrorInvalidMoneroAddress("Invalid Monero address")
                }
                return this.wallet.sweepUnlocked({
                    address: address,
                    relay: true,
                })
            },

            // MoneroWalletListener interface implementation
            onSyncProgress(height, startHeight, endHeight, percentDone) {
                let percent = parseInt(percentDone * 100)
                if(percent === this.syncProgress) {
                    return
                }
                this.syncProgress = percent
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
                        params.setRestoreHeight(this.restoreHeight)
                    }

                    await this.wallet.setSyncHeight(this.restoreHeight)
                    await this.wallet.startSyncing(daemonSyncPeriod)
                } else {
                    await this.wallet.stopSyncing()
                }
            }
        },

        async mounted() {
            // Override the default path to monero_web_worker.js
            monerojs.LibraryUtils.setWorkerDistPath("./monero_web_worker.js")

            const seed = params.getWalletSeed()
            // Validate the seed if there's one set
            if (seed !== "") {
                let isValidSpendKey = await monerojs.MoneroUtils.isValidPrivateSpendKey(seed)
                if (!isValidSpendKey) {
                    let error = new ErrorInvalidSeed("Cannot load a wallet: invalid seed!")
                    this.error = error
                    console.error(error)
                    return
                }
            }

            this.restoreHeight = params.getRestoreHeight()
            if (isNaN(this.restoreHeight)) {
                let error = new ErrorInvalidRestoreHeight("Cannot load a wallet: invalid restore height!")
                this.error = error
                console.error(error)
                return
            }

            let networkType = params.getNetworkType(defaultNetworkType)
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
            params.setWalletSeed(privateSpendKey)

            const connectionManager = this.newConnectionManager(nodes[networkType])
            await connectionManager.startCheckingConnection(daemonCheckPeriod)
        },

        beforeCreate() {
            this.titleRoot = window.document.title
        },

        beforeUnmount() {
            this.wallet.close()
        },
    }
</script>
