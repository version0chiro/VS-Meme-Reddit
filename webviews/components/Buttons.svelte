<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    const onClickNext = (e) => {
        // console.log("next is clicked");
        dispatch("onClickNext");
    };
    const onClickPrevious = (e) => {
        // console.log("prev is clicked");
        dispatch("onClickPrevious");
    };
</script>

<div class="btn-stack">
    <button class="btn btn-prev prev-btn-disabled" on:click={onClickPrevious}
        >Back!</button
    >
    <button class="btn btn-next" on:click={onClickNext}>Next!</button>
</div>

<style>
    .btn-stack {
        bottom: 12vh;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80%;
        position: absolute;
    }
    .btn {
        border: none;
        padding: 5px;
        min-width: 65px;
        width: 100%;
        margin: 5px;
        text-align: center;
        background: var(--vscode-button-background);
        border-radius: 15px;
        outline: none;
    }
    .btn:hover {
        background-color: orange;
    }
    .btn:focus {
        background-color: rgb(255, 106, 0);
    }
    .prev-btn-disabled {
        background-color: gray;
    }
    .prev-btn-disabled:hover {
        background-color: gray;
    }
    .prev-btn-disabled:focus {
        background-color: gray;
    }
</style>
