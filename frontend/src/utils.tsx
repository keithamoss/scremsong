export const randomHash = (nChar: number) => {
    // https://stackoverflow.com/a/37378421/7368493

    // convert number of characters to number of bytes
    const nBytes = Math.ceil((nChar = (+nChar || 8) / 2))

    // create a typed array of that many bytes
    const u = new Uint8Array(nBytes)

    // populate it wit crypto-random values
    window.crypto.getRandomValues(u)

    // convert it to an Array of Strings (e.g. "01", "AF", ..)
    const zpad = (s: string) => {
        return "00".slice(s.length) + s
    }
    const a = Array.prototype.map.call(u, (x: any) => {
        return zpad(x.toString(16))
    })

    // Array of String to String
    let str = a.join("").toUpperCase()
    // and snip off the excess digit if we want an odd number
    if (nChar % 2) {
        str = str.slice(1)
    }

    // return what we made
    return str
}
