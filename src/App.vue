<template>
    <el-container v-if="error">
        <el-main>
            <el-row>
                <el-col :span="24">
                    <el-alert :title="error.message" type="error" />
                </el-col>
            </el-row>
        </el-main>
    </el-container>

    <wallet
        :balance="balance"
        :unlockedBalance="unlockedBalance"
        :address="primaryAddress"
        :status="walletStatus"
        :params="walletParams"
        :sendTransactionFunc="sweepUnlockedBalance"
    ></wallet>

    <p class="text-center" v-if="config.networkType > 0">
        Using
            <span v-if="config.networkType == 1">testnet</span>
            <span v-if="config.networkType == 2">stagenet</span>
            network. Your coins are worthless.
    </p>
</template>

<style>
    #app {
        max-width:30rem;
        margin:0 auto;
        height:100%;
    }

    h2 {
        margin-top:1em;
        margin-bottom:1em;
    }

    html {
        height:100%;
        box-sizing:border-box;
    }

    body {
        box-sizing:border-box;
        font-family:sans-serif;
        font-size:17px;
        line-height:1.5rem;
        background-color:var(--el-bg-color-page);
        color:var(--el-text-color-regular);
        padding:0;
        margin:0;
        height:100%;
    }

    .text-right {
        text-align:right;
    }

    .text-center {
        text-align:center;
    }

    .el-card {
        border-radius:var(--el-border-radius-round) !important;
        border:0 !important;
        margin:0;
        color:var(--el-text-color-regular) !important;
    }
</style>

<script>
    import monerojs from "monero-javascript"
    import moneroutils from "./moneroutils"
    import params from "./params"
    import {ErrorInvalidMoneroAddress, ErrorInvalidRestoreHeight, ErrorInvalidNetworkType, ErrorInvalidSeed} from "./errors"

    const proxyToWorker = true
    const daemonConnectionTimeout = 120000
    const daemonCheckPeriod = 5000
    const daemonSyncPeriod = 10000
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
                appParams: new URLSearchParams(),
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
                    case "error":
                        title = "Error"
                        break

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
                if ( this.error != null ) {
                    status = {
                        action: "error",
                    }
                } else if ( !this.isLoaded ) {
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

            walletParams() {
                return this.appParams.toString()
            }
        },

        watch: {
            documentTitle: {
                handler(val){
                    window.document.title = val
                },
                immediate: true,
            },

            walletParams: {
                handler(val) {
                    if (val === "") {
                        return
                    }
                    const url = window.location.pathname + window.location.search + "#" + val
                    window.history.replaceState(null, "", url)
                },
                immediate: true,
            },
        },

        methods: {
            newConnectionManager(nodeUris) {
                const connectionManager = new monerojs.MoneroConnectionManager(proxyToWorker)
                let self = this
                connectionManager.addListener(new class extends monerojs.MoneroConnectionManagerListener {
                    async onConnectionChanged(connection) {
                        self.onConnectionChanged(connection)
                    }
                })
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
                let self = this
                await wallet.addListener(new class extends monerojs.MoneroWalletListener {
                    onSyncProgress(height, startHeight, endHeight, percentDone) {
                        self.onSyncProgress(height, startHeight, endHeight, percentDone)
                    }

                    onBalancesChanged(newBalance, newUnlockedBalance) {
                        self.onBalancesChanged(newBalance, newUnlockedBalance)
                    }
                })
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

            // MoneroConnectionManagerListener
            async onConnectionChanged(connection){
                this.isConnected = connection.isConnected() === true
                console.debug("[event] connection", this.isConnected)

                if (!this.isConnected) {
                    await this.wallet.stopSyncing()
                    return
                }

                await this.wallet.setDaemonConnection(connection)

                // getDaemonHeight - 1 is here to prevent this issue:
                // https://github.com/monero-ecosystem/monero-javascript/issues/76
                if (this.restoreHeight == null) {
                    this.restoreHeight = await this.wallet.getDaemonHeight() - 1
                    this.appParams = params.setRestoreHeight(this.appParams, this.restoreHeight)
                }

                await this.wallet.setSyncHeight(this.restoreHeight)
                await this.wallet.startSyncing(daemonSyncPeriod)
            },
        },

        async mounted() {
            // Override the default path to monero_web_worker.js
            monerojs.LibraryUtils.setWorkerDistPath("./monero_web_worker.js")

            this.appParams = new URLSearchParams(window.location.hash.substring(1))

            const seed = params.getWalletSeed(this.appParams)
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

            this.restoreHeight = params.getRestoreHeight(this.appParams)
            if (isNaN(this.restoreHeight)) {
                let error = new ErrorInvalidRestoreHeight("Cannot load a wallet: invalid restore height!")
                this.error = error
                console.error(error)
                return
            }

            let networkType = params.getNetworkType(this.appParams, defaultNetworkType)
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
            this.appParams = params.setWalletSeed(this.appParams, privateSpendKey)

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
