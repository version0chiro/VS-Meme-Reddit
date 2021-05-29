<script>
    export let data = {};
</script>

<div class="img-container">
    <a href={data.postLink} class="img-link">
        <img src={data.url} alt="" class="img-meme" />
    </a>
    <h3 class="img-title">{data.title}</h3>
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
    h3 {
        font-family: Gelasio;
        margin: 10px;
        text-align: center;
    }
</style>
