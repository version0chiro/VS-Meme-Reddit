<script lang="ts">
  let dataURL: Promise<any> | null = null;
  const fetchImage = (async () => {
    const response = await fetch("https://meme-api.herokuapp.com/gimme");

    return await response.json();
  });

  $: memeFetch = fetchImage; 
</script>

{#await memeFetch()}
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
  p {
    left:"50%"
  }
</style>
