<template>
    <div id="status" class="text-center">
        <div v-if="$props.status.action == 'error'" class="error">Error</div>
        <div v-if="$props.status.action == 'loading'" class="warning">Loading</div>
        <div v-if="$props.status.action == 'connecting'" class="warning">Connecting</div>
        <div v-if="$props.status.action == 'syncing' && $props.status.progress == 0" class="warning">Synchronizing</div>
        <div v-if="$props.status.action == 'syncing' && $props.status.progress > 0" class="warning">Synchronizing {{ $props.status.progress }}%</div>
        <div v-if="$props.status.action == 'ready'" class="success">Synchronized</div>
    </div>
</template>

<style scoped>
    #status {
        background-color:var(--el-bg-color-overlay);
        color:var(--el-text-color-secondary);
        border-radius:var(--el-border-radius-round);
        padding:0.3em;
        text-transform:uppercase;
        width:20em;
        margin:0 auto;
        letter-spacing: 1px;
        font-weight: bold;
        font-size:0.65em;
    }

    #status > div:before {
        content: "\2022";
        padding:0;
        margin-right:0.8em;
        font-weight: bolder;
    }

    #status > div.success:before {
        color:var(--el-color-success);
    }

    #status > div.warning:before {
        color:var(--el-color-warning);
    }

    #status > div.error:before {
        color:var(--el-color-error);
    }
</style>

<script>
    export default {
        name: "StatusPanel",

        props: {
            status: Object,
        },
    }
</script>
