# Wallet parameters

All wallet parameters are contained in the URL fragment. This prevents any information from being sent to the server.
Wallet parameters are read only once, at start. Changing a parameter has no effect until the page is reloaded.

| name |   value   |                      description                      |           default            |
|:----:|:---------:|:-----------------------------------------------------:|:----------------------------:|
| `h`  |   `int`   |                 wallet restore height                 | daemon's recent block height |
| `n`  |   `int`   | network type (mainnet=`0`, testnet=`1`, stagenet=`2`) |             `0`              |
| `s`  | `string`  |    base58 encoded private spend key (seed)            |             N/A              |

## Example

```
https://xmr.gift/wallet/#s=SBA9kQzua7FA3hcckXeCQTEF4x8VN87czBTff4uJcpjS&h=1100981&n=2
```
