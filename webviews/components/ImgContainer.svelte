<script>
    export let imgUrl = "";
    export let imgTitle = "";
</script>

<div class="img-container">
    <a href={imgUrl} class="img-link">
        <img src={imgUrl} alt="" class="img-meme" />
    </a>
    <h3 class="img-title">{imgTitle}</h3>
</div>

<style>
    .img-container {
        height: 50vh;
        width: 100%;
        border: 1px solid var(--vscode-button-background);
        background: var(--vscode-button-background);
        margin: auto;
        padding: 2px 2px;
        border-radius: 5px;
    }
    .img-meme {
        height: 50vh;
        width: 100%;
    }
</style>
