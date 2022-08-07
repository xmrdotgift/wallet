<template>
    <el-card class="box-card">
        <template #header>
            <el-page-header content="Deposit" @back="$emit('back')"></el-page-header>
        </template>

        <br>
        <br>
        <el-row>
            <el-col class="text-center">
                <canvas ref="canvas" :width="qrSize" :height="qrSize" :title="address"></canvas>
            </el-col>
        </el-row>

        <br>

        <el-row>
            <el-col class="text-center break" style="user-select: all">
                <p>{{ address }}</p>
            </el-col>
        </el-row>
    </el-card>
</template>

<style scoped>
    .break {
        word-wrap: break-word;
    }

    canvas {
        border-radius:var(--el-border-radius-round);
    }
</style>

<script>
    import qrcode from "qrcode"

    export default {
        Name: "DepositCard",

        props: {
            address: String,
            qrSize: Number,
        },

        emits: [
            "back"
        ],

        async mounted() {
            const ctx = this.$refs.canvas.getContext("2d")

            let qrImage = new Image()
            qrImage.onload = () => {
                ctx.drawImage(qrImage, 0, 0)
            }
            qrImage.src = await qrcode.toDataURL(this.address, {
                errorCorrectionLevel: 'L',
                width: this.$props.qrSize,
                margin: 4,
            })
        }
    }
</script>