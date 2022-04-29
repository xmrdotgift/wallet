export class ErrorInvalidMoneroAddress extends Error {
    name = this.constructor.name
    constructor(message) {
        super(message)
    }
}

export class ErrorInvalidSeed extends Error {
    name = this.constructor.name
    constructor(message) {
        super(message)
    }
}

export class ErrorInvalidRestoreHeight extends Error {
    name = this.constructor.name
    constructor(message) {
        super(message)
    }
}

export class ErrorInvalidNetworkType extends Error {
    name = this.constructor.name
    constructor(message) {
        super(message)
    }
}