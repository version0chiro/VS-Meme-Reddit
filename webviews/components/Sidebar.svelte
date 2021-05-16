<script lang="ts">
  const fetchImage = (async () => {
    const response = await fetch("https://meme-api.herokuapp.com/gimme");
    return await response.json();
  })();
</script>

{#await fetchImage}
  <p>Getting you top quality Meme!</p>
{:then data}
  <img src={data.url} alt="Meme" />
  <p>here it is !</p>
{:catch}
  <p>Something went wrong!</p>
{/await}

<!-- svelte-ignore missing-declaration -->
<style>
</style>
