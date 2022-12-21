import base58 from "base58-monero"

export default {
    get(params, param) {
        if (params.has(param)) {
            return params.get(param)
        }
        return null
    },

    set(params, param, value) {
        const cp = this.copy(params)
        cp.set(param, value)
        return cp
    },

    delete(params, param) {
        const cp = this.copy(params)
        cp.delete(param)
        return cp
    },

    // copy makes a new copy of src.
    // The only purpose of copying is to trigger Vue's auto watcher.
    copy(src){
        return new URLSearchParams(src.toString())
    },

    getRestoreHeight(params, defaultValue) {
        const restoreHeight = this.get(params, "h")
        if (restoreHeight == null) {
            return (defaultValue !== undefined) ? defaultValue : null
        }
        return parseInt(restoreHeight)
    },

    setRestoreHeight(params, restoreHeight) {
        return this.set(params, "h", restoreHeight)
    },

    getNetworkType(params, defaultValue) {
        const networkType = this.get(params, "n")
        if (networkType == null) {
            return (defaultValue !== undefined) ? defaultValue : null
        }
        return parseInt(networkType)
    },

    getWalletSeed(params) {
        let walletSeed = this.get(params, "s")
        if (walletSeed == null) {
            return ""
        }
        try {
            walletSeed = base58.decode(walletSeed).toString("hex")
        } catch (e) {
            console.error(e)
        }
        return walletSeed
    },

    setWalletSeed(params, walletSeed) {
        try {
            walletSeed = base58.encode(Buffer.from(walletSeed, "hex"))
        } catch (e) {
            console.error(e)
        }
        return this.set(params, "s", walletSeed)
    },

    getCardName(params) {
        let name = this.get(params, "!")
        if (name == null) {
            return ""
        }
        return name
    },

    setCardName(params, name) {
        return this.set(params, "!", name)
    },

    deleteCardName(params) {
        return this.delete(params, "!")
    },
}
