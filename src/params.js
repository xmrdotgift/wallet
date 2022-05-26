import base58 from "base58-monero"

export default {
    get(param) {
        const urlParams = new URLSearchParams(window.location.hash.substring(1))
        if (urlParams.has(param)) {
            return urlParams.get(param)
        }
        return null
    },

    set(param, value) {
        const urlParams = new URLSearchParams(window.location.hash.substring(1))
        urlParams.set(param, value)
        window.location.hash = urlParams.toString()
    },

    getRestoreHeight(defaultValue) {
        const restoreHeight = this.get("h")
        if (restoreHeight == null) {
            return (defaultValue !== undefined) ? defaultValue:null
        }
        return parseInt(restoreHeight)
    },

    setRestoreHeight(restoreHeight) {
        this.set("h", restoreHeight)
    },

    getNetworkType(defaultValue) {
        const networkType = this.get("n")
        if (networkType == null) {
            return (defaultValue !== undefined) ? defaultValue:null
        }
        return parseInt(networkType)
    },

    getWalletSeed() {
        let walletSeed = this.get("s")
        if (walletSeed == null) {
            return ""
        }
        try {
            walletSeed = base58.decode(walletSeed).toString("hex")
        } catch(e) {
            console.error(e)
        }
        return walletSeed
    },

    setWalletSeed(walletSeed) {
        this.set("s", base58.encode(Buffer.from(walletSeed, "hex")))
    },
}
