<script lang="ts">
  let url = null;
  const fetchImage = (async () => {
    const response = await fetch("https://meme-api.herokuapp.com/gimme");
    return await response.json();
  })();

  
  const refreshImage = async () => {
    const response = await fetch("https://meme-api.herokuapp.com/gimme");
  };
</script>

{#await fetchImage}
  <p>Getting you top quality Meme!</p>
{:then data}
  <img src={data.url} alt="Meme" />
  <p>here it is !</p>
{:catch}
  <p>Something went wrong!</p>
{/await}

<!-- <button class:active on:click={() => (active = !active)}>foo</button> -->

<!-- svelte-ignore missing-declaration -->
<style>
</style>
